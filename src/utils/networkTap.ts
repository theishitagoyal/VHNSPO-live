import { EventEmitter } from 'events';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface NetworkInterface {
    name: string;
    ip: string;
    mac: string;
    type: string;
}

export interface PacketData {
    timestamp: number;
    sourceIP: string;
    destIP: string;
    protocol: string;
    length: number;
    sourcePort?: number;
    destPort?: number;
    flags?: string;
    ttl?: number;
    window?: number;
    checksum?: number;
}

export class NetworkTap extends EventEmitter {
    private interfaces: NetworkInterface[] = [];
    private isCapturing: boolean = false;
    private tcpdumpProcess: any = null;
    private readonly isWindows: boolean = os.platform() === 'win32';

    constructor() {
        super();
    }

    /**
     * Initialize network tap
     */
    public async initialize(): Promise<void> {
        try {
            if (this.isWindows) {
                // Check if npcap is installed on Windows
                try {
                    await execAsync('where tcpdump');
                } catch (error: any) {
                    throw new Error('tcpdump not found. Please install Npcap (https://npcap.com/)');
                }
            } else {
                // Check if tcpdump is installed on Unix-like systems
                try {
                    await execAsync('which tcpdump');
                } catch (error: any) {
                    throw new Error('tcpdump not found. Please install tcpdump');
                }
            }
        } catch (error: any) {
            throw new Error(`Failed to initialize network tap: ${error.message}`);
        }
    }

    /**
     * Detect available network interfaces
     */
    public async detectInterfaces(): Promise<string[]> {
        try {
            const { stdout } = await execAsync('tcpdump -D');
            return stdout
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    const match = line.match(/^\d+\.\s+(.+?)\s+/);
                    return match ? match[1] : '';
                })
                .filter(iface => iface.length > 0);
        } catch (error: any) {
            throw new Error(`Failed to detect network interfaces: ${error.message}`);
        }
    }

    /**
     * Start capturing network traffic
     */
    public async startCapture(interfaceName: string, filter: string = ''): Promise<void> {
        if (this.isCapturing) {
            throw new Error('Capture is already running');
        }

        try {
            const filterStr = filter ? `-f "${filter}"` : '';
            const command = `tcpdump -i ${interfaceName} -n -tttt ${filterStr}`;
            
            this.tcpdumpProcess = exec(command);
            this.isCapturing = true;

            this.tcpdumpProcess.stdout.on('data', (data: string) => {
                this.processPacket(data);
            });

            this.tcpdumpProcess.stderr.on('data', (data: string) => {
                console.error(`tcpdump error: ${data}`);
            });

            this.tcpdumpProcess.on('close', (code: number) => {
                this.isCapturing = false;
                if (code !== 0) {
                    this.emit('error', new Error(`tcpdump process exited with code ${code}`));
                }
            });
        } catch (error: any) {
            throw new Error(`Failed to start capture: ${error.message}`);
        }
    }

    /**
     * Stop capturing network traffic
     */
    public async stopCapture(): Promise<void> {
        if (!this.isCapturing) {
            return;
        }

        try {
            if (this.tcpdumpProcess) {
                this.tcpdumpProcess.kill();
                this.tcpdumpProcess = null;
            }
            this.isCapturing = false;
        } catch (error: any) {
            throw new Error(`Failed to stop capture: ${error.message}`);
        }
    }

    /**
     * Process captured packet
     */
    private processPacket(rawPacket: string): void {
        try {
            // Parse tcpdump output
            const lines = rawPacket.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;

                const packet: Partial<PacketData> = {
                    timestamp: Date.now(),
                };

                // Parse IP addresses
                const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)/);
                if (ipMatch) {
                    packet.sourceIP = ipMatch[1];
                    packet.destIP = ipMatch[2];
                }

                // Parse protocol
                const protocolMatch = line.match(/(TCP|UDP|ICMP)/);
                if (protocolMatch) {
                    packet.protocol = protocolMatch[1];
                }

                // Parse length
                const lengthMatch = line.match(/length (\d+)/);
                if (lengthMatch) {
                    packet.length = parseInt(lengthMatch[1], 10);
                }

                // Parse ports for TCP/UDP
                const portMatch = line.match(/(\d+)\.(\d+)\s*>\s*(\d+)\.(\d+)/);
                if (portMatch) {
                    packet.sourcePort = parseInt(portMatch[2], 10);
                    packet.destPort = parseInt(portMatch[4], 10);
                }

                // Parse TCP flags
                const flagsMatch = line.match(/Flags \[([^\]]+)\]/);
                if (flagsMatch) {
                    packet.flags = flagsMatch[1];
                }

                // Parse TTL
                const ttlMatch = line.match(/ttl (\d+)/);
                if (ttlMatch) {
                    packet.ttl = parseInt(ttlMatch[1], 10);
                }

                // Parse window size
                const windowMatch = line.match(/win (\d+)/);
                if (windowMatch) {
                    packet.window = parseInt(windowMatch[1], 10);
                }

                // Parse checksum
                const checksumMatch = line.match(/cksum (\d+)/);
                if (checksumMatch) {
                    packet.checksum = parseInt(checksumMatch[1], 10);
                }

                if (Object.keys(packet).length > 1) { // Only emit if we have more than just timestamp
                    this.emit('packet', packet as PacketData);
                }
            }
        } catch (error) {
            console.error('Error processing packet:', error);
            this.emit('error', error);
        }
    }

    /**
     * Get list of available network interfaces
     */
    public getInterfaces(): NetworkInterface[] {
        return [...this.interfaces];
    }

    /**
     * Get current capture status
     */
    public isActive(): boolean {
        return this.isCapturing;
    }
} 