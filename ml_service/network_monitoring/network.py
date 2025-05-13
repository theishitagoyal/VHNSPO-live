import csv
import os
from scapy.all import sniff, IP, TCP, UDP, ARP
from datetime import datetime
from packet_processor import PacketProcessor

# ----------------------
# Configurable Variables
# ----------------------
CSV_LOG_FILE = "network_log.csv"
KNOWN_MACS = set()
FILTER = "ip or arp"  # You can change to: "tcp", "udp", "port 80", etc.

# Initialize packet processor
processor = PacketProcessor(CSV_LOG_FILE)

# ----------------------
# Logging Setup
# ----------------------
if not os.path.exists(CSV_LOG_FILE):
    with open(CSV_LOG_FILE, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Timestamp", "Source IP", "Destination IP", "Protocol", "Length", "Note"])

# ----------------------
# Packet Processing
# ----------------------
def process_packet(packet):
    """Process a packet and log it."""
    packet_data, note = processor.process_packet(packet)
    
    if packet_data is None:
        return

    # Log the packet
    processor.log_to_csv(
        packet_data['timestamp'],
        packet_data['source_ip'],
        packet_data['destination_ip'],
        packet_data['protocol'],
        packet_data['length'],
        note or ""
    )

    # Print packet information
    if note:
        print(f"[{packet_data['timestamp']}] {packet_data['source_ip']} | {packet_data['protocol']} | {note}")
    else:
        print(f"[{packet_data['timestamp']}] {packet_data['source_ip']} → {packet_data['destination_ip']} | {packet_data['protocol']} | {packet_data['length']} bytes")

# ----------------------
# Start Sniffing
# ----------------------
print(f"🟢 Starting live capture... Logging to {CSV_LOG_FILE}")
sniff(filter=FILTER, prn=process_packet, store=False) 