from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import threading
import queue
import logging
from typing import Dict, List, Any, Optional
import json
import pandas as pd
from sklearn.model_selection import train_test_split

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
model = None
scaler = StandardScaler()
training_queue = queue.Queue()
is_training = False
last_training_time = None
training_data = []

class MLService:
    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self.model_path = 'model/isolation_forest.joblib'
        self.scaler_path = 'model/scaler.joblib'
        self.dataset_path = 'data/network_intrusion.csv'
        self.load_model()

    def load_model(self) -> None:
        """Load the trained model if it exists."""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Model and scaler loaded successfully")
            else:
                # Initialize new model and train with Kaggle dataset
                self.model = IsolationForest(
                    n_estimators=100,
                    max_samples='auto',
                    contamination=0.1,
                    random_state=42,
                    n_jobs=-1
                )
                self._train_with_kaggle_dataset()
                logger.info("New model initialized and trained with Kaggle dataset")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.model = IsolationForest(
                n_estimators=100,
                max_samples='auto',
                contamination=0.1,
                random_state=42,
                n_jobs=-1
            )

    def _train_with_kaggle_dataset(self) -> None:
        """Train the model using the Kaggle network intrusion dataset."""
        try:
            if not os.path.exists(self.dataset_path):
                logger.warning("Kaggle dataset not found. Please download it to data/network_intrusion.csv")
                return

            # Load and preprocess the dataset
            df = pd.read_csv(self.dataset_path)
            
            # Select relevant features
            features = [
                'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
                'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins',
                'logged_in', 'num_compromised', 'root_shell', 'su_attempted',
                'num_root', 'num_file_creations', 'num_shells', 'num_access_files',
                'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count',
                'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate',
                'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
                'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
                'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
                'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
                'dst_host_serror_rate', 'dst_host_srv_serror_rate',
                'dst_host_rerror_rate', 'dst_host_srv_rerror_rate'
            ]

            # Convert categorical features to numerical
            categorical_features = ['protocol_type', 'service', 'flag']
            df_encoded = pd.get_dummies(df[features], columns=categorical_features)

            # Scale the features
            X = self.scaler.fit_transform(df_encoded)

            # Train the model
            self.model.fit(X)
            
            # Save the model and scaler
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            logger.info(f"Model trained successfully with {len(X)} samples")
            
        except Exception as e:
            logger.error(f"Error training with Kaggle dataset: {str(e)}")
            raise

    def save_model(self) -> None:
        """Save the trained model and scaler."""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            logger.info("Model and scaler saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def validate_training_data(self, data: List[Dict[str, Any]]) -> bool:
        """Validate the training data format and content."""
        if not data:
            return False
        
        required_fields = {
            'packet_size', 'protocol_type', 'time_delta',
            'src_ip', 'dst_ip', 'src_port', 'dst_port'
        }
        
        for packet in data:
            if not isinstance(packet, dict):
                return False
            if not all(field in packet for field in required_fields):
                return False
            if not all(isinstance(packet[field], (int, float)) for field in ['packet_size', 'time_delta']):
                return False
            if not all(isinstance(packet[field], str) for field in ['protocol_type', 'src_ip', 'dst_ip']):
                return False
            if not all(isinstance(packet[field], int) for field in ['src_port', 'dst_port']):
                return False
        
        return True

    def prepare_features(self, data: List[Dict[str, Any]]) -> np.ndarray:
        """Prepare features for model training/prediction."""
        try:
            features = []
            for packet in data:
                # Convert IP addresses to numerical features
                src_ip_parts = [int(x) for x in packet['src_ip'].split('.')]
                dst_ip_parts = [int(x) for x in packet['dst_ip'].split('.')]
                
                # Convert protocol to numerical feature
                protocol_map = {'TCP': 0, 'UDP': 1, 'ICMP': 2}
                protocol_num = protocol_map.get(packet['protocol_type'], 3)
                
                feature_vector = [
                    packet['packet_size'],
                    protocol_num,
                    packet['time_delta'],
                    *src_ip_parts,
                    *dst_ip_parts,
                    packet['src_port'],
                    packet['dst_port']
                ]
                features.append(feature_vector)
            
            return np.array(features)
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            raise

    def train(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train the model with new data."""
        try:
            if not self.validate_training_data(data):
                raise ValueError("Invalid training data format")

            X = self.prepare_features(data)
            X_scaled = self.scaler.transform(X)
            self.model.fit(X_scaled)
            self.save_model()
            
            return {
                'status': 'success',
                'message': 'Model trained successfully',
                'samples_trained': len(data)
            }
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def predict(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predict anomalies in the data."""
        try:
            if not self.validate_training_data(data):
                raise ValueError("Invalid input data format")

            if self.model is None:
                raise ValueError("Model not initialized")

            X = self.prepare_features(data)
            X_scaled = self.scaler.transform(X)
            scores = self.model.score_samples(X_scaled)
            
            # Convert scores to probabilities (higher score = more normal)
            probabilities = 1 / (1 + np.exp(-scores))
            
            # Determine anomaly threshold (e.g., 0.1)
            threshold = 0.1
            anomalies = probabilities < threshold
            
            results = []
            for i, (prob, is_anomaly) in enumerate(zip(probabilities, anomalies)):
                result = {
                    'packet_id': i,
                    'is_anomaly': bool(is_anomaly),
                    'confidence': float(prob),
                    'anomaly_type': self._determine_anomaly_type(data[i], prob)
                }
                results.append(result)
            
            return {
                'status': 'success',
                'results': results,
                'total_anomalies': int(np.sum(anomalies))
            }
        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def _determine_anomaly_type(self, packet: Dict[str, Any], probability: float) -> str:
        """Determine the type of anomaly based on packet features."""
        if probability < 0.05:
            return 'severe'
        elif probability < 0.1:
            return 'moderate'
        else:
            return 'normal'

# Initialize ML service
ml_service = MLService()

def initialize_model():
    global model
    model = IsolationForest(
        n_estimators=100,
        max_samples='auto',
        contamination=0.1,  # Expected proportion of anomalies
        random_state=42,
        n_jobs=-1  # Use all available cores
    )

def train_model():
    global model, scaler, is_training, last_training_time, training_data
    
    if is_training or len(training_data) == 0:
        return
    
    is_training = True
    try:
        # Prepare training data
        X = np.array([d['features'] for d in training_data])
        
        # Scale features
        X_scaled = scaler.fit_transform(X)
        
        # Train model
        model.fit(X_scaled)
        
        # Save model and scaler
        joblib.dump(model, 'model.joblib')
        joblib.dump(scaler, 'scaler.joblib')
        
        last_training_time = datetime.now()
        
        # Clear training data after successful training
        training_data = []
        
    finally:
        is_training = False

def training_worker():
    while True:
        try:
            # Get data from queue
            data = training_queue.get()
            if data is None:
                break
                
            # Add to training data
            training_data.append(data)
            
            # Train if enough data
            if len(training_data) >= 1000:
                train_model()
                
        except Exception as e:
            print(f"Error in training worker: {e}")
        finally:
            training_queue.task_done()

# Start training worker
training_thread = threading.Thread(target=training_worker, daemon=True)
training_thread.start()

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_initialized': ml_service.model is not None,
        'last_training_time': last_training_time
    })

@app.route('/train', methods=['POST'])
def train():
    try:
        data = request.json
        result = ml_service.train(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        result = ml_service.predict(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/stats')
def get_stats():
    return jsonify({
        'model_initialized': ml_service.model is not None,
        'last_training_time': last_training_time,
        'training_data_size': len(training_data),
        'queue_size': training_queue.qsize()
    })

if __name__ == '__main__':
    # Initialize model
    initialize_model()
    
    # Load saved model if exists
    if os.path.exists('model.joblib'):
        model = joblib.load('model.joblib')
        scaler = joblib.load('scaler.joblib')
    
    app.run(host='0.0.0.0', port=5000) 