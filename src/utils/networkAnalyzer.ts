import { EventEmitter } from 'events';
import * as net from 'net';
import * as dns from 'dns';
import * as os from 'os';

interface PacketInfo {
    timestamp: number;
    sourceIP: string;
    destIP: string;
    protocol: string;
    length: number;
    payload?: Buffer;
}

interface NetworkStats {
    totalPackets: number;
    bytesTransferred: number;
    protocols: Map<string, number>;
    topTalkers: Map<string, number>;
    topDestinations: Map<string, number>;
    connections: Map<string, ConnectionInfo>;
}

interface ConnectionInfo {
    localAddress: string;
    localPort: number;
    remoteAddress: string;
    remotePort: number;
    state: string;
    bytesIn: number;
    bytesOut: number;
}

export class NetworkAnalyzer extends EventEmitter {
    private stats: NetworkStats = {
        totalPackets: 0,
        bytesTransferred: 0,
        protocols: new Map(),
        topTalkers: new Map(),
        topDestinations: new Map(),
        connections: new Map()
    };
    private isMonitoring: boolean = false;
    private monitorInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
    }

    /**
     * Start monitoring network activity
     */
    public startMonitoring(): void {
        if (this.isMonitoring) {
            throw new Error('Already monitoring network activity');
        }

        this.isMonitoring = true;
        this.monitorInterval = setInterval(() => this.updateNetworkStats(), 1000);
        console.log('Started network monitoring');
    }

    /**
     * Stop monitoring network activity
     */
    public stopMonitoring(): void {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.isMonitoring = false;
        console.log('Stopped network monitoring');
    }

    /**
     * Update network statistics
     */
    private async updateNetworkStats(): Promise<void> {
        try {
            const connections = await this.getActiveConnections();
            this.updateConnectionStats(connections);
            this.emit('statsUpdate', this.stats);
        } catch (error) {
            console.error('Error updating network stats:', error);
        }
    }

    /**
     * Get active network connections
     */
    private async getActiveConnections(): Promise<ConnectionInfo[]> {
        return new Promise((resolve, reject) => {
            const connections: ConnectionInfo[] = [];
            const server = net.createServer();

            server.on('connection', (socket: net.Socket) => {
                const connectionInfo: ConnectionInfo = {
                    localAddress: socket.localAddress || 'unknown',
                    localPort: socket.localPort || 0,
                    remoteAddress: socket.remoteAddress || 'unknown',
                    remotePort: socket.remotePort || 0,
                    state: 'ESTABLISHED',
                    bytesIn: 0,
                    bytesOut: 0
                };

                socket.on('data', (data: Buffer) => {
                    connectionInfo.bytesIn += data.length;
                    this.stats.bytesTransferred += data.length;
                    this.stats.totalPackets++;
                });

                socket.on('drain', () => {
                    connectionInfo.bytesOut += socket.bytesWritten;
                });

                connections.push(connectionInfo);
            });

            server.listen(() => {
                server.close(() => {
                    resolve(connections);
                });
            });

            server.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    /**
     * Update connection statistics
     */
    private updateConnectionStats(connections: ConnectionInfo[]): void {
        connections.forEach((conn) => {
            const key = `${conn.localAddress}:${conn.localPort}-${conn.remoteAddress}:${conn.remotePort}`;
            this.stats.connections.set(key, conn);

            // Update top talkers
            const sourceCount = this.stats.topTalkers.get(conn.localAddress) || 0;
            this.stats.topTalkers.set(conn.localAddress, sourceCount + 1);

            // Update top destinations
            const destCount = this.stats.topDestinations.get(conn.remoteAddress) || 0;
            this.stats.topDestinations.set(conn.remoteAddress, destCount + 1);
        });
    }

    /**
     * Get current network statistics
     */
    public getStats(): NetworkStats {
        return { ...this.stats };
    }

    /**
     * Get list of network interfaces
     */
    public getNetworkInterfaces(): os.NetworkInterfaceInfo[] {
        const interfaces = os.networkInterfaces();
        return Object.values(interfaces).flat().filter((iface): iface is os.NetworkInterfaceInfo => iface !== undefined);
    }

    /**
     * Analyze connection for potential security threats
     */
    public analyzeThreats(connection: ConnectionInfo): string[] {
        const threats: string[] = [];

        // Check for suspicious ports
        const suspiciousPorts = [22, 23, 3389, 445, 1433];
        if (suspiciousPorts.includes(connection.remotePort)) {
            threats.push(`Connection to potentially sensitive port ${connection.remotePort}`);
        }

        // Check for unusual data transfer patterns
        if (connection.bytesIn > 1000000 || connection.bytesOut > 1000000) {
            threats.push('Unusually large data transfer detected');
        }

        // Check for multiple connections to the same port
        const connectionsToPort = Array.from(this.stats.connections.values())
            .filter(c => c.remotePort === connection.remotePort).length;
        if (connectionsToPort > 5) {
            threats.push(`Multiple connections to port ${connection.remotePort} detected`);
        }

        return threats;
    }

    /**
     * Generate a summary report of network activity
     */
    public generateReport(): string {
        const stats = this.getStats();
        let report = 'Network Activity Report\n';
        report += '=====================\n\n';
        
        report += `Total Packets: ${stats.totalPackets}\n`;
        report += `Total Bytes: ${stats.bytesTransferred}\n\n`;
        
        report += 'Active Connections:\n';
        stats.connections.forEach((conn, key) => {
            report += `${key}\n`;
            report += `  State: ${conn.state}\n`;
            report += `  Bytes In: ${conn.bytesIn}\n`;
            report += `  Bytes Out: ${conn.bytesOut}\n`;
        });
        
        report += '\nTop Talkers:\n';
        const sortedTalkers = Array.from(stats.topTalkers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        sortedTalkers.forEach(([ip, count]) => {
            report += `${ip}: ${count} connections\n`;
        });
        
        report += '\nTop Destinations:\n';
        const sortedDests = Array.from(stats.topDestinations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        sortedDests.forEach(([ip, count]) => {
            report += `${ip}: ${count} connections\n`;
        });
        
        return report;
    }
} 