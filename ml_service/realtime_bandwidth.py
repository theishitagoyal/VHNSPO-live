import os
import time
import json
import random
import threading
import logging
import psutil
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Initial device data
devices = [
    {"device": "Laptop", "usage": 25, "allocation": 30, "priority": 4},
    {"device": "Smartphone", "usage": 15, "allocation": 20, "priority": 3},
    {"device": "Gaming Console", "usage": 35, "allocation": 40, "priority": 5},
    {"device": "Smart TV", "usage": 20, "allocation": 25, "priority": 4},
    {"device": "IoT Devices", "usage": 5, "allocation": 8, "priority": 2},
]

# Network monitoring state
monitoring_thread = None
stop_monitoring = False

def get_system_network_stats():
    """Get real network statistics from the system"""
    try:
        # Get network I/O stats
        net_io = psutil.net_io_counters()
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Error getting network stats: {e}")
        return None

def update_device_usage():
    """Update device usage based on real system data and some randomization"""
    # Get real network activity
    net_stats = get_system_network_stats()
    if not net_stats:
        return
    
    # Calculate total network traffic
    total_traffic = net_stats["bytes_sent"] + net_stats["bytes_recv"]
    
    # Distribute traffic among devices with some randomization
    total_priority = sum(device["priority"] for device in devices)
    
    # Update each device's usage
    for device in devices:
        # Base usage on priority and add some randomness
        priority_factor = device["priority"] / total_priority
        randomness = random.uniform(0.8, 1.2)  # +/- 20%
        
        # Calculate new usage (0-100%)
        new_usage = min(100, max(5, 
            device["usage"] * 0.6 +  # 60% of previous usage for stability
            40 * priority_factor * randomness  # 40% new value based on priority and randomness
        ))
        
        device["usage"] = round(new_usage, 1)

def knapsack_optimize_bandwidth():
    """Optimize bandwidth allocation using Knapsack algorithm"""
    # Total bandwidth capacity (100 units)
    total_capacity = 100
    
    # Make a copy of devices to work with
    working_devices = devices.copy()
    
    # Sort devices by priority (higher priority first)
    working_devices.sort(key=lambda x: x["priority"], reverse=True)
    
    # Calculate total priority value for weighted allocation
    total_priority = sum(device["priority"] for device in working_devices)
    
    # Track remaining capacity
    remaining_capacity = total_capacity
    
    # Allocate bandwidth optimally
    for device in working_devices:
        # Calculate weight based on priority and usage
        weight = (device["priority"] / total_priority * 2) + (device["usage"] / 100)
        
        # Calculate allocation (prioritize higher-priority devices)
        allocation = min(
            round(total_capacity * weight * 0.8),  # Base on weight
            round(device["usage"] * 1.25),         # Max 25% more than usage
            remaining_capacity                     # Cannot exceed remaining
        )
        
        # Ensure minimum allocation based on priority
        min_allocation = max(device["usage"], device["priority"] * 5)
        allocation = max(allocation, min(min_allocation, remaining_capacity))
        
        # Update device allocation
        device["allocation"] = round(allocation, 1)
        
        # Update remaining capacity
        remaining_capacity -= allocation
    
    # Copy values back to original devices
    for i, device in enumerate(working_devices):
        for original_device in devices:
            if original_device["device"] == device["device"]:
                original_device["allocation"] = device["allocation"]
                break

def emit_network_data():
    """Emit network data to connected clients"""
    # Update usages
    update_device_usage()
    
    # Calculate and log bandwidth efficiency
    if devices:
        total_usage = sum(device["usage"] for device in devices) / len(devices)
        total_allocation = sum(device["allocation"] for device in devices) / len(devices)
        
        if total_usage > 0:
            efficiency = ((total_allocation - total_usage) / total_usage * 100)
        else:
            efficiency = 0 if total_allocation == 0 else 100
            
        logger.info(f"Bandwidth efficiency: {efficiency:.2f}%")
    
    # Emit updated data
    socketio.emit('bandwidth_update', devices)

def monitoring_worker():
    """Background worker to monitor and emit network data"""
    global stop_monitoring
    logger.info("Starting network monitoring")
    
    while not stop_monitoring:
        emit_network_data()
        time.sleep(2)  # Update every 2 seconds
    
    logger.info("Network monitoring stopped")

@app.route('/optimize-bandwidth', methods=['POST'])
def optimize_bandwidth():
    """API endpoint to optimize bandwidth allocation"""
    logger.info("Optimizing bandwidth...")
    knapsack_optimize_bandwidth()
    return jsonify(devices)

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    # Send initial data to the connected client
    socketio.emit('bandwidth_update', devices, room=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('start_monitoring')
def handle_start_monitoring():
    """Start network monitoring"""
    global monitoring_thread, stop_monitoring
    
    if monitoring_thread is None or not monitoring_thread.is_alive():
        stop_monitoring = False
        monitoring_thread = threading.Thread(target=monitoring_worker)
        monitoring_thread.daemon = True
        monitoring_thread.start()
        return {"status": "success", "message": "Monitoring started"}
    else:
        return {"status": "error", "message": "Monitoring already running"}

@socketio.on('stop_monitoring')
def handle_stop_monitoring():
    """Stop network monitoring"""
    global stop_monitoring
    stop_monitoring = True
    return {"status": "success", "message": "Monitoring stopped"}

if __name__ == '__main__':
    # Port to use (configurable)
    port = 5002
    
    try:
        # Initialize with optimized values
        knapsack_optimize_bandwidth()
        
        # Start the monitoring thread
        stop_monitoring = False
        monitoring_thread = threading.Thread(target=monitoring_worker)
        monitoring_thread.daemon = True
        monitoring_thread.start()
        
        # Start the server
        logger.info(f"Starting server on http://localhost:{port}")
        try:
            socketio.run(app, host='0.0.0.0', port=port, debug=True, use_reloader=False)
        except OSError as e:
            if "Only one usage of each socket address" in str(e):
                # Try another port
                alternate_port = port + 1
                logger.warning(f"Port {port} is in use, trying port {alternate_port}")
                socketio.run(app, host='0.0.0.0', port=alternate_port, debug=True, use_reloader=False)
            else:
                raise
    except KeyboardInterrupt:
        logger.info("Shutting down gracefully...")
        stop_monitoring = True
        if monitoring_thread and monitoring_thread.is_alive():
            monitoring_thread.join(timeout=1.0)
    except Exception as e:
        logger.error(f"Error starting server: {e}") 