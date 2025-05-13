from scapy.all import sniff, IP, TCP, UDP, ICMP, conf
import socketio
import sys
import os
import ctypes
import logging
from datetime import datetime
import time
from flask import Flask, request
from flask_socketio import SocketIO
import threading

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for more detailed logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask and SocketIO
app = Flask(__name__)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=1e8
)

# Global variables
capture_thread = None
stop_capture = False

def is_admin():
    """Check if the script is running with administrator privileges."""
    try:
        result = ctypes.windll.shell32.IsUserAnAdmin()
        logger.debug(f"Admin check result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error checking admin status: {str(e)}")
        return False

def check_winpcap():
    """Check if WinPcap/Npcap is installed and list available interfaces."""
    try:
        interfaces = conf.ifaces.data.values()
        if not interfaces:
            logger.error("No network interfaces found. Please check if WinPcap/Npcap is installed.")
            return False
        logger.info(f"Found {len(interfaces)} network interfaces:")
        for iface in interfaces:
            logger.info(f"Interface: {iface.name} - {iface.description}")
        return True
    except Exception as e:
        logger.error(f"Error checking WinPcap: {str(e)}")
        return False

def get_tcp_flags(flags):
    """Convert TCP flags to a string representation."""
    flag_names = []
    if flags & 0x01:  # FIN
        flag_names.append('FIN')
    if flags & 0x02:  # SYN
        flag_names.append('SYN')
    if flags & 0x04:  # RST
        flag_names.append('RST')
    if flags & 0x08:  # PSH
        flag_names.append('PSH')
    if flags & 0x10:  # ACK
        flag_names.append('ACK')
    if flags & 0x20:  # URG
        flag_names.append('URG')
    return ' '.join(flag_names) if flag_names else 'None'

def packet_callback(packet):
    """Process captured packets and emit them to connected clients."""
    try:
        if IP in packet:
            logger.debug(f"Processing packet: {packet[IP].src} -> {packet[IP].dst}")
            packet_data = {
                'timestamp': int(time.time()),
                'source_ip': packet[IP].src,
                'destination_ip': packet[IP].dst,
                'protocol': packet[IP].proto,
                'length': len(packet),
                'details': {
                    'protocol': packet[IP].proto
                }
            }

            # Add protocol-specific details
            if TCP in packet:
                packet_data['details'].update({
                    'protocol': 'TCP',
                    'source_port': packet[TCP].sport,
                    'destination_port': packet[TCP].dport,
                    'flags': get_tcp_flags(packet[TCP].flags)
                })
            elif UDP in packet:
                packet_data['details'].update({
                    'protocol': 'UDP',
                    'source_port': packet[UDP].sport,
                    'destination_port': packet[UDP].dport
                })
            elif ICMP in packet:
                packet_data['details'].update({
                    'protocol': 'ICMP',
                    'type': packet[ICMP].type,
                    'code': packet[ICMP].code
                })

            logger.debug(f"Emitting packet: {packet_data}")
            socketio.emit('packet', packet_data)
    except Exception as e:
        logger.error(f"Error processing packet: {str(e)}", exc_info=True)

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    logger.info(f"Client connected: {request.sid}")
    logger.debug(f"Connection environment: {request.environ}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('start_capture')
def handle_start_capture():
    """Handle start capture request"""
    global capture_thread, stop_capture
    
    try:
        if not is_admin():
            return {'status': 'error', 'message': 'Administrator privileges required'}
        
        if not check_winpcap():
            return {'status': 'error', 'message': 'WinPcap/Npcap not found'}
        
        if capture_thread is None or not capture_thread.is_alive():
            stop_capture = False
            capture_thread = threading.Thread(target=start_capture)
            capture_thread.daemon = True
            capture_thread.start()
            return {'status': 'success'}
        else:
            return {'status': 'error', 'message': 'Capture already running'}
    except Exception as e:
        logger.error(f"Error starting capture: {str(e)}", exc_info=True)
        return {'status': 'error', 'message': str(e)}

@socketio.on('stop_capture')
def handle_stop_capture():
    """Handle stop capture request"""
    global stop_capture
    
    try:
        stop_capture = True
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Error stopping capture: {str(e)}", exc_info=True)
        return {'status': 'error', 'message': str(e)}

def start_capture():
    """Start packet capture in a separate thread"""
    global stop_capture
    stop_capture = False
    
    try:
        logger.info("Starting packet capture...")
        # List all available interfaces
        interfaces = list(conf.ifaces.data.values())
        logger.info(f"Available interfaces: {len(interfaces)}")
        for i, iface in enumerate(interfaces):
            logger.info(f"Interface {i}: {iface.name} - {iface.description}")
        
        # Try to find a suitable interface
        wifi_interface = None
        
        # First try to find a wireless interface
        for iface in interfaces:
            description = iface.description.lower() if hasattr(iface, 'description') else ''
            if any(term in description for term in ['wireless', 'wifi', 'wi-fi', 'wlan', '802.11']):
                wifi_interface = iface.name
                logger.info(f"Selected wireless interface: {wifi_interface} - {description}")
                break
        
        # If no wireless interface found, use the first Ethernet interface
        if not wifi_interface:
            for iface in interfaces:
                description = iface.description.lower() if hasattr(iface, 'description') else ''
                if 'ethernet' in description or 'local area connection' in description:
                    wifi_interface = iface.name
                    logger.info(f"Selected ethernet interface: {wifi_interface} - {description}")
                    break
        
        # If still no interface found, use the first available interface (excluding loopback)
        if not wifi_interface and interfaces:
            for iface in interfaces:
                description = iface.description.lower() if hasattr(iface, 'description') else ''
                name = iface.name.lower() if hasattr(iface, 'name') else ''
                # Skip loopback interfaces
                if 'loopback' not in description and 'loop' not in name and '127.0.0.1' not in description:
                    wifi_interface = iface.name
                    logger.info(f"Selected first available interface: {wifi_interface} - {description}")
                    break
        
        if not wifi_interface:
            logger.error("No suitable network interface found")
            socketio.emit('error', "No suitable network interface found")
            return
        
        # Use the selected interface for capture
        logger.info(f"Starting capture on interface {wifi_interface}")
        try:
            # Try to start sniffing with minimal parameters first
            sniff(
                iface=wifi_interface,
                prn=packet_callback,
                store=0,
                stop_filter=lambda p: stop_capture,
                count=0  # Continuously capture
            )
        except Exception as sniff_error:
            logger.error(f"Error in sniff operation: {str(sniff_error)}", exc_info=True)
            # Try with more basic parameters
            try:
                logger.info("Trying simpler sniff operation...")
                sniff(
                    iface=wifi_interface,
                    prn=lambda pkt: print(f"Packet captured: {len(pkt)} bytes"),
                    store=0,
                    count=10  # Just capture 10 packets as a test
                )
                logger.info("Basic packet capture successful, but callback failed")
            except Exception as basic_error:
                logger.error(f"Basic sniffing also failed: {str(basic_error)}", exc_info=True)
                socketio.emit('error', f"Failed to capture packets: {str(basic_error)}")
        
        logger.info("Packet capture stopped")
    except Exception as e:
        logger.error(f"Error in packet capture setup: {str(e)}", exc_info=True)
        socketio.emit('error', str(e))

if __name__ == '__main__':
    # Check for administrator privileges
    logger.info("Starting script execution...")
    try:
        admin_status = is_admin()
        logger.info(f"Administrator privileges: {admin_status}")
        if not admin_status:
            logger.error("This script must be run with administrator privileges")
            print("\nPlease run this script as administrator:")
            print("1. Right-click on Command Prompt or PowerShell")
            print("2. Select 'Run as administrator'")
            print("3. Navigate to the script directory")
            print("4. Run: python packet_capture.py")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error during admin check: {str(e)}", exc_info=True)
        sys.exit(1)

    # Check for WinPcap/Npcap
    try:
        winpcap_installed = check_winpcap()
        logger.info(f"WinPcap/Npcap check result: {winpcap_installed}")
        if not winpcap_installed:
            logger.error("WinPcap/Npcap not found")
            print("\nPlease install Npcap:")
            print("1. Download from https://npcap.com/")
            print("2. Run the installer")
            print("3. Restart your computer")
            print("4. Run this script again")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error during WinPcap check: {str(e)}", exc_info=True)
        sys.exit(1)

    logger.info("Starting packet capture server...")
    try:
        socketio.run(app, host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}", exc_info=True)
        print(f"\nError: {str(e)}")
        print("Please ensure no other service is using port 5001")
        sys.exit(1)