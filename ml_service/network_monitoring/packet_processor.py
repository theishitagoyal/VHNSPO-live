import csv
import os
from datetime import datetime
from scapy.all import IP, TCP, UDP, ARP
from typing import Dict, Any, Optional, Tuple

class PacketProcessor:
    def __init__(self, csv_log_file: str = "network_log.csv"):
        self.csv_log_file = csv_log_file
        self.known_macs = set()
        self._setup_logging()

    def _setup_logging(self):
        """Initialize CSV logging if file doesn't exist."""
        if not os.path.exists(self.csv_log_file):
            with open(self.csv_log_file, mode='w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(["Timestamp", "Source IP", "Destination IP", "Protocol", "Length", "Note"])

    def log_to_csv(self, timestamp: str, src_ip: str, dst_ip: str, protocol: str, length: int, note: str = ""):
        """Log packet information to CSV file."""
        with open(self.csv_log_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([timestamp, src_ip, dst_ip, protocol, length, note])

    def process_packet(self, packet: Any) -> Tuple[Dict[str, Any], Optional[str]]:
        """
        Process a network packet and return its data and any notes.
        Returns a tuple of (packet_data, note)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        note = None

        # Handle ARP packets
        if packet.haslayer(ARP) and packet[ARP].op == 1:
            mac = packet[ARP].hwsrc
            ip = packet[ARP].psrc
            if mac not in self.known_macs:
                self.known_macs.add(mac)
                note = f"New device detected - MAC: {mac}"
                packet_data = {
                    'timestamp': timestamp,
                    'source_ip': ip,
                    'destination_ip': '',
                    'protocol': 'ARP',
                    'length': 0,
                    'details': {'mac': mac}
                }
                return packet_data, note
            return None, None

        # Handle IP packets
        if packet.haslayer(IP):
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            length = len(packet)
            
            # Determine protocol
            if packet.haslayer(TCP):
                protocol = 'TCP'
                details = {
                    'protocol': 'TCP',
                    'source_port': packet[TCP].sport,
                    'destination_port': packet[TCP].dport,
                    'flags': packet[TCP].flags
                }
            elif packet.haslayer(UDP):
                protocol = 'UDP'
                details = {
                    'protocol': 'UDP',
                    'source_port': packet[UDP].sport,
                    'destination_port': packet[UDP].dport
                }
            else:
                protocol = 'Other'
                details = {'protocol': 'Other'}

            packet_data = {
                'timestamp': timestamp,
                'source_ip': src_ip,
                'destination_ip': dst_ip,
                'protocol': protocol,
                'length': length,
                'details': details
            }
            return packet_data, note

        return None, None

    def extract_features(self, packet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from packet data for anomaly detection."""
        features = {
            'source_ip': packet_data['source_ip'],
            'destination_ip': packet_data['destination_ip'],
            'protocol': packet_data['protocol'],
            'length': packet_data['length']
        }

        # Add protocol-specific features
        if 'details' in packet_data:
            features.update(packet_data['details'])

        return features 