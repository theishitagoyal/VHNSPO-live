import os
import joblib
from scapy.all import sniff
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import pandas as pd
from packet_processor import PacketProcessor

# ----------------------
# Configurable Variables
# ----------------------
CSV_LOG_FILE = "network_log.csv"
MODEL_FILE = "isolation_forest_model.pkl"
ENCODER_FILE = "label_encoders.pkl"
FILTER = "ip or arp"

# ----------------------
# Load Model and Encoders
# ----------------------
if os.path.exists(MODEL_FILE) and os.path.exists(ENCODER_FILE):
    iso_forest = joblib.load(MODEL_FILE)
    encoders = joblib.load(ENCODER_FILE)
    print("✅ Model and encoders loaded.")
else:
    print("❌ Isolation Forest model or encoders not found. Please train them first.")
    exit(1)

# Initialize packet processor
processor = PacketProcessor(CSV_LOG_FILE)

def preprocess_packet_data(packet_data):
    """Preprocess packet data for anomaly detection."""
    try:
        src_encoded = encoders["src_ip"].transform([packet_data['source_ip']])[0]
    except:
        src_encoded = -1
    try:
        dst_encoded = encoders["dst_ip"].transform([packet_data['destination_ip']])[0]
    except:
        dst_encoded = -1
    try:
        proto_encoded = encoders["protocol"].transform([packet_data['protocol']])[0]
    except:
        proto_encoded = -1

    return pd.DataFrame([{
        "Source IP": src_encoded,
        "Destination IP": dst_encoded,
        "Protocol": proto_encoded,
        "Length": packet_data['length']
    }])

def process_packet(packet):
    """Process a packet and detect anomalies."""
    # Process packet using unified processor
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

    # Detect anomalies for IP packets
    if packet_data['protocol'] != 'ARP':
        features_df = preprocess_packet_data(packet_data)
        prediction = iso_forest.predict(features_df)
        anomaly_note = "Anomaly Detected" if prediction[0] == -1 else ""
        
        if anomaly_note:
            processor.log_to_csv(
                packet_data['timestamp'],
                packet_data['source_ip'],
                packet_data['destination_ip'],
                packet_data['protocol'],
                packet_data['length'],
                anomaly_note
            )
            print(f"[{packet_data['timestamp']}] {packet_data['source_ip']} → {packet_data['destination_ip']} | {packet_data['protocol']} | {packet_data['length']} bytes ⚠️ Anomaly")
        else:
            print(f"[{packet_data['timestamp']}] {packet_data['source_ip']} → {packet_data['destination_ip']} | {packet_data['protocol']} | {packet_data['length']} bytes")

# ----------------------
# Start Sniffing
# ----------------------
print(f"🟢 Starting live capture with anomaly detection... Logging to {CSV_LOG_FILE}")
sniff(filter=FILTER, prn=process_packet, store=False) 