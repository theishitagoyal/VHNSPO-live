import { EventEmitter } from 'events';
import { NetworkTap } from './networkTap';
import { AnomalyDetector } from './anomalyDetector';
import { RouterManager, RouterConfig } from './routerManager';

interface OrchestratorConfig {
    router: RouterConfig;
    modelPath?: string;
    trainingInterval?: number; // in milliseconds
    anomalyThreshold?: number;
}

export class NetworkOrchestrator extends EventEmitter {
    private networkTap: NetworkTap;
    private anomalyDetector: AnomalyDetector;
    private routerManager: RouterManager;
    private isRunning: boolean = false;
    private trainingInterval: number;
    private anomalyThreshold: number;

    constructor(config: OrchestratorConfig) {
        super();
        this.networkTap = new NetworkTap();
        this.anomalyDetector = new AnomalyDetector();
        this.routerManager = new RouterManager(config.router);
        this.trainingInterval = config.trainingInterval || 3600000; // Default: 1 hour
        this.anomalyThreshold = config.anomalyThreshold || 0.8;

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Network tap events
        this.networkTap.on('packet', this.handlePacket.bind(this));
        this.networkTap.on('error', this.handleError.bind(this));

        // Anomaly detector events
        this.anomalyDetector.on('anomaly', this.handleAnomaly.bind(this));
        this.anomalyDetector.on('trainingComplete', this.handleTrainingComplete.bind(this));
        this.anomalyDetector.on('error', this.handleError.bind(this));
    }

    /**
     * Start the network monitoring and protection system
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        try {
            // Connect to router
            await this.routerManager.connect();

            // Start network tap
            await this.networkTap.start();

            // Load or initialize anomaly detection model
            await this.anomalyDetector.initialize();

            // Set up periodic training
            this.setupPeriodicTraining();

            this.isRunning = true;
            console.log('Network monitoring system started');
        } catch (error) {
            console.error('Failed to start network monitoring system:', error);
            throw error;
        }
    }

    /**
     * Stop the network monitoring and protection system
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            // Stop network tap
            await this.networkTap.stop();

            // Disconnect from router
            await this.routerManager.disconnect();

            this.isRunning = false;
            console.log('Network monitoring system stopped');
        } catch (error) {
            console.error('Failed to stop network monitoring system:', error);
            throw error;
        }
    }

    /**
     * Handle incoming network packets
     */
    private async handlePacket(packet: any): Promise<void> {
        try {
            // Extract features and detect anomalies
            const features = this.anomalyDetector.extractFeatures(packet);
            const result = await this.anomalyDetector.detectAnomaly(features);

            // If anomaly detected, take action
            if (result.isAnomaly && result.confidence >= this.anomalyThreshold) {
                await this.handleAnomaly({
                    packet,
                    features,
                    confidence: result.confidence
                });
            }
        } catch (error) {
            console.error('Error processing packet:', error);
        }
    }

    /**
     * Handle detected anomalies
     */
    private async handleAnomaly(anomaly: any): Promise<void> {
        try {
            console.log('Anomaly detected:', anomaly);

            // Get router stats
            const stats = await this.routerManager.getStats();

            // Implement anomaly response strategy
            if (anomaly.confidence > 0.9) {
                // High confidence anomaly - block IP
                await this.routerManager.blockIP(anomaly.packet.sourceIP);
            } else if (anomaly.confidence > 0.8) {
                // Medium confidence anomaly - limit bandwidth
                await this.routerManager.setBandwidthLimit(anomaly.packet.sourceIP, 1); // 1 Mbps limit
            }

            // Emit anomaly event
            this.emit('anomaly', {
                ...anomaly,
                routerStats: stats
            });
        } catch (error) {
            console.error('Error handling anomaly:', error);
        }
    }

    /**
     * Handle training completion
     */
    private handleTrainingComplete(stats: any): void {
        console.log('Model training completed:', stats);
        this.emit('trainingComplete', stats);
    }

    /**
     * Handle errors from any component
     */
    private handleError(error: Error): void {
        console.error('System error:', error);
        this.emit('error', error);
    }

    /**
     * Set up periodic model training
     */
    private setupPeriodicTraining(): void {
        setInterval(async () => {
            try {
                await this.anomalyDetector.train();
            } catch (error) {
                console.error('Error during periodic training:', error);
            }
        }, this.trainingInterval);
    }

    /**
     * Get current system status
     */
    public async getStatus(): Promise<any> {
        try {
            const routerStats = await this.routerManager.getStats();
            const modelStats = await this.anomalyDetector.getModelStats();

            return {
                isRunning: this.isRunning,
                router: routerStats,
                model: modelStats,
                policies: this.routerManager.getPolicies()
            };
        } catch (error) {
            console.error('Error getting system status:', error);
            throw error;
        }
    }
} 