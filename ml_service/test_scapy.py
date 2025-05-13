from scapy.all import *
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    print("=== Scapy Version Information ===")
    print(f"Scapy version: {conf.version}")
    
    print("\n=== Python Information ===")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    
    print("\n=== Network Interfaces ===")
    print(f"Number of interfaces: {len(conf.ifaces.data)}")
    
    # List all interfaces
    print("\nListing all interfaces:")
    for i, (name, iface) in enumerate(conf.ifaces.data.items()):
        print(f"Interface {i}: {name}")
        print(f"  - Description: {iface.description if hasattr(iface, 'description') else 'N/A'}")
        print(f"  - Type: {type(iface)}")
        for attr in dir(iface):
            if not attr.startswith('_') and attr not in ['__class__', '__dict__', '__weakref__']:
                try:
                    value = getattr(iface, attr)
                    if not callable(value):
                        print(f"  - {attr}: {value}")
                except:
                    pass
    
    # Check for default interface
    print("\n=== Default Interface ===")
    try:
        print(f"Default interface: {conf.iface}")
    except Exception as e:
        print(f"Error getting default interface: {e}")
    
    # Try to sniff a few packets
    print("\n=== Testing Packet Capture ===")
    print("Trying to capture 5 packets (press Ctrl+C to stop if it hangs)...")
    try:
        # Try with the default interface first
        packets = sniff(count=5, timeout=10, store=1)
        print(f"Successfully captured {len(packets)} packets with default interface")
        
        if len(packets) > 0:
            print("\nFirst packet summary:")
            print(packets[0].summary())
    except Exception as e:
        print(f"Error capturing packets with default interface: {e}")
        
        # Try with explicit interfaces
        print("\nTrying with explicit interfaces...")
        for name, iface in conf.ifaces.data.items():
            if 'loopback' in str(iface).lower() or '127.0.0.1' in str(iface).lower():
                continue
                
            try:
                print(f"Trying interface: {name}")
                packets = sniff(iface=name, count=2, timeout=5, store=1)
                print(f"Successfully captured {len(packets)} packets with interface {name}")
                if len(packets) > 0:
                    break
            except Exception as e2:
                print(f"Error with interface {name}: {e2}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main() 