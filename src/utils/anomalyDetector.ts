import { EventEmitter } from 'events';
import axios from 'axios';
import { PacketData } from './networkTap';

interface AnomalyDetectionResult {
    isAnomaly: boolean;
    confidence: number;
    type: string;
    details: string;
}

interface TrainingData {
    timestamp: number;
    features: number[];
    label: number; // 0 for normal, 1 for anomaly
}

interface MLServiceResponse {
    isAnomaly: boolean;
    confidence: number;
    type: string;
    details: string;
}

interface MLServiceStats {
    model_initialized: boolean;
    last_training_time: string | null;
    training_data_size: number;
    queue_size: number;
}

export class AnomalyDetector extends EventEmitter {
    private mlServiceUrl: string;
    private isTraining: boolean = false;
    private lastTrainingTime: number = 0;
    private featureExtractor: FeatureExtractor;

    constructor(mlServiceUrl: string = 'http://localhost:5000') {
        super();
        this.mlServiceUrl = mlServiceUrl;
        this.featureExtractor = new FeatureExtractor();
    }

    /**
     * Initialize the anomaly detection service
     */
    public async initialize(): Promise<void> {
        try {
            // Check if ML service is available
            await axios.get(`${this.mlServiceUrl}/health`);
            console.log('ML service initialized');
        } catch (error) {
            console.error('Failed to initialize ML service:', error);
            throw error;
        }
    }

    /**
     * Extract features from packet data
     */
    public extractFeatures(packet: PacketData): number[] {
        return this.featureExtractor.extract(packet);
    }

    /**
     * Add training data
     */
    public async addTrainingData(packet: PacketData, isAnomaly: boolean): Promise<void> {
        const features = this.extractFeatures(packet);
        try {
            await axios.post(`${this.mlServiceUrl}/train`, {
                timestamp: packet.timestamp,
                features,
                label: isAnomaly ? 1 : 0
            });
        } catch (error) {
            console.error('Failed to add training data:', error);
            throw error;
        }
    }

    /**
     * Train the model
     */
    public async train(epochs: number = 50): Promise<void> {
        if (this.isTraining) {
            throw new Error('Training already in progress');
        }

        this.isTraining = true;

        try {
            const response = await axios.post(`${this.mlServiceUrl}/train`, { epochs });
            this.lastTrainingTime = Date.now();
            this.emit('trainingComplete', response.data);
        } catch (error) {
            console.error('Failed to train model:', error);
            throw error;
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Detect anomalies in packet data
     */
    public async detectAnomaly(packet: PacketData): Promise<AnomalyDetectionResult> {
        const features = this.extractFeatures(packet);
        
        try {
            const response = await axios.post<MLServiceResponse>(`${this.mlServiceUrl}/predict`, { features });
            return response.data;
        } catch (error) {
            console.error('Failed to detect anomaly:', error);
            throw error;
        }
    }

    /**
     * Get model statistics
     */
    public async getModelStats(): Promise<any> {
        try {
            const response = await axios.get<MLServiceStats>(`${this.mlServiceUrl}/stats`);
            return {
                ...response.data,
                lastTrainingTime: this.lastTrainingTime
            };
        } catch (error) {
            console.error('Error getting model stats:', error);
            throw error;
        }
    }
}

/**
 * Feature extraction for network packets
 */
class FeatureExtractor {
    private featureCount: number = 10; // Number of features to extract

    /**
     * Extract features from packet data
     */
    public extract(packet: PacketData): number[] {
        const features: number[] = [];
        
        // Packet size features
        features.push(packet.length / 1500); // Normalized packet size
        
        // Protocol features (one-hot encoding)
        const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS'];
        protocols.forEach(protocol => {
            features.push(packet.protocol === protocol ? 1 : 0);
        });
        
        // Time-based features
        features.push(this.extractTimeFeatures(packet.timestamp));
        
        // IP-based features
        features.push(this.extractIPFeatures(packet.sourceIP));
        features.push(this.extractIPFeatures(packet.destIP));
        
        return features;
    }

    /**
     * Extract time-based features
     */
    private extractTimeFeatures(timestamp: number): number {
        const date = new Date(timestamp);
        const hour = date.getHours();
        return hour / 24; // Normalized hour of day
    }

    /**
     * Extract IP-based features
     */
    private extractIPFeatures(ip: string): number {
        // Simple IP feature: sum of octets normalized
        const octets = ip.split('.').map(Number);
        return octets.reduce((sum, octet) => sum + octet, 0) / 1020; // 255 * 4 = 1020
    }

    /**
     * Get the number of features
     */
    public getFeatureCount(): number {
        return this.featureCount;
    }
} 