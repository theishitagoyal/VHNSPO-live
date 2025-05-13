import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import axios from 'axios';
import io from 'socket.io-client';

interface PacketData {
  timestamp: number;
  source_ip: string;
  destination_ip: string;
  protocol: number;
  length: number;
  details: {
    protocol: string;
    source_port?: number;
    destination_port?: number;
    flags?: string;
    type?: number;
    code?: number;
  };
}

interface AnomalyData {
  id: string;
  timestamp: number;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  length: number;
  confidence: number;
  type: string;
  resolved: boolean;
}

interface BandwidthData {
  device: string;
  usage: number;
  allocation: number;
  priority: number;
}

interface NetworkDataContextType {
  packets: PacketData[];
  anomalies: AnomalyData[];
  trafficByProtocol: Record<string, number>;
  trafficByTime: { timestamp: number; value: number }[];
  bandwidthAllocation: BandwidthData[];
  threatLevel: 'low' | 'medium' | 'high';
  detectionCount: number;
  lastScanTime: Date | null;
  optimizeBandwidth: () => Promise<void>;
  resolveAnomaly: (id: string) => void;
}

const NetworkDataContext = createContext<NetworkDataContextType>({
  packets: [],
  anomalies: [],
  trafficByProtocol: {},
  trafficByTime: [],
  bandwidthAllocation: [],
  threatLevel: 'low',
  detectionCount: 0,
  lastScanTime: null,
  optimizeBandwidth: async () => {},
  resolveAnomaly: () => {}
});

export const useNetworkData = () => useContext(NetworkDataContext);

// Add a dedicated socket for bandwidth data
let bandwidthSocket: any = null;

export const NetworkDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected } = useSocket();
  
  // State
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [trafficByProtocol, setTrafficByProtocol] = useState<Record<string, number>>({});
  const [trafficByTime, setTrafficByTime] = useState<{ timestamp: number; value: number }[]>([]);
  const [bandwidthAllocation, setBandwidthAllocation] = useState<BandwidthData[]>([
    // Initial sample data
    { device: 'Laptop', usage: 25, allocation: 30, priority: 4 },
    { device: 'Smartphone', usage: 15, allocation: 20, priority: 3 },
    { device: 'Gaming Console', usage: 35, allocation: 40, priority: 5 },
    { device: 'Smart TV', usage: 20, allocation: 25, priority: 4 },
    { device: 'IoT Devices', usage: 5, allocation: 8, priority: 2 },
  ]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  
  // Connect to the real-time bandwidth service
  useEffect(() => {
    // Initialize Socket.IO connection for bandwidth data
    if (!bandwidthSocket) {
      console.log('Connecting to bandwidth service at http://localhost:5002');
      bandwidthSocket = io('http://localhost:5002', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      });
      
      // Set up event listeners
      bandwidthSocket.on('connect', () => {
        console.log('Connected to bandwidth service');
        bandwidthSocket.emit('start_monitoring'); // Start real-time monitoring
      });
      
      bandwidthSocket.on('bandwidth_update', (data: BandwidthData[]) => {
        console.log('Received bandwidth update:', data);
        setBandwidthAllocation(data);
      });
      
      bandwidthSocket.on('disconnect', () => {
        console.log('Disconnected from bandwidth service');
      });
      
      bandwidthSocket.on('connect_error', (error: any) => {
        console.error('Bandwidth service connection error:', error);
      });
    }
    
    // Clean up on unmount
    return () => {
      if (bandwidthSocket) {
        bandwidthSocket.off('bandwidth_update');
        bandwidthSocket.off('connect');
        bandwidthSocket.off('disconnect');
        bandwidthSocket.off('connect_error');
        bandwidthSocket.disconnect();
        bandwidthSocket = null;
      }
    };
  }, []);
  
  // Initialize with real data - packet monitoring
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Set up packet listener
    socket.on('packet', (packet: PacketData) => {
      try {
        // Update packets
        setPackets(prev => {
          const newPackets = [packet, ...prev];
          return newPackets.slice(0, 100); // Keep last 100 packets
        });

        // Update traffic by protocol
        setTrafficByProtocol(prev => {
          const protocol = packet.details.protocol;
          return {
            ...prev,
            [protocol]: (prev[protocol] || 0) + packet.length
          };
        });

        // Update traffic by time
        setTrafficByTime(prev => {
          const timestamp = packet.timestamp;
          const newTimeData = [...prev, { timestamp, value: packet.length }];
          return newTimeData.slice(-30); // Keep last 30 data points
        });

        // Check for anomalies (example: large packets or unusual ports)
        if (packet.length > 1500 || // Large packet
            (packet.details.protocol === 'TCP' && 
             (packet.details.destination_port === 22 || // SSH
              packet.details.destination_port === 3389))) { // RDP
          const anomaly: AnomalyData = {
            id: `${packet.timestamp}-${packet.source_ip}`,
            timestamp: packet.timestamp,
            source_ip: packet.source_ip,
            destination_ip: packet.destination_ip,
            protocol: packet.details.protocol,
            length: packet.length,
            confidence: 0.9,
            type: 'suspicious_traffic',
            resolved: false
          };
          setAnomalies(prev => [...prev, anomaly]);
          setDetectionCount(prev => prev + 1);
          setThreatLevel('high');
        }

        setLastScanTime(new Date());
      } catch (err) {
        console.error('Error processing packet:', err);
      }
    });

    socket.on('error', (err: string) => {
      console.error('Socket error:', err);
    });

    return () => {
      socket.off('packet');
      socket.off('error');
    };
  }, [socket, isConnected]);

  // Function to optimize bandwidth using Knapsack algorithm
  const optimizeBandwidth = async () => {
    try {
      // Try to get optimized data from the server
      console.log('Requesting bandwidth optimization from server');
      if (bandwidthSocket && bandwidthSocket.connected) {
        // Use the real-time service if connected
        const response = await axios.post<BandwidthData[]>('http://localhost:5002/optimize-bandwidth');
        console.log('Server optimization successful:', response.data);
        setBandwidthAllocation(response.data);
      } else {
        // Fallback to local implementation
        console.log('Using local Knapsack algorithm as fallback');
        const optimizedData = knapsackOptimizeBandwidth([...bandwidthAllocation]);
        setBandwidthAllocation(optimizedData);
        console.log('Local optimization result:', optimizedData);
      }
    } catch (error) {
      console.error('Failed to optimize bandwidth from server:', error);
      
      // Fallback: Use local implementation of Knapsack algorithm
      console.log('Using local Knapsack algorithm as fallback');
      const optimizedData = knapsackOptimizeBandwidth([...bandwidthAllocation]);
      setBandwidthAllocation(optimizedData);
      console.log('Local optimization result:', optimizedData);
    }
  };

  // Local implementation of Knapsack algorithm for bandwidth optimization
  const knapsackOptimizeBandwidth = (devices: BandwidthData[]): BandwidthData[] => {
    // Total bandwidth capacity (let's assume 100 units)
    const totalCapacity = 100;
    
    // Sort devices by priority (higher priority first)
    devices.sort((a, b) => b.priority - a.priority);
    
    // Calculate total priority value for weighted allocation
    const totalPriority = devices.reduce((sum, device) => sum + device.priority, 0);
    
    // Allocate bandwidth proportionally based on priority and usage
    let remainingCapacity = totalCapacity;
    
    return devices.map(device => {
      // Calculate weight based on priority and usage
      const weight = (device.priority / totalPriority) * 2 + (device.usage / 100);
      
      // Calculate allocation (prioritize higher-priority devices)
      let allocation = Math.min(
        Math.round(totalCapacity * weight * 0.8), // Base on weight
        device.usage * 1.25, // Max 25% more than current usage
        remainingCapacity // Cannot exceed remaining capacity
      );
      
      // Ensure minimum allocation based on priority
      const minAllocation = Math.max(device.usage, device.priority * 5);
      allocation = Math.max(allocation, Math.min(minAllocation, remainingCapacity));
      
      // Update remaining capacity
      remainingCapacity -= allocation;
      
      // Return updated device
      return {
        ...device,
        allocation: allocation
      };
    });
  };

  // Function to mark an anomaly as resolved
  const resolveAnomaly = (id: string) => {
    setAnomalies(prev => 
      prev.map(anomaly => 
        anomaly.id === id ? { ...anomaly, resolved: true } : anomaly
      )
    );
  };

  return (
    <NetworkDataContext.Provider value={{
      packets,
      anomalies,
      trafficByProtocol,
      trafficByTime,
      bandwidthAllocation,
      threatLevel,
      detectionCount,
      lastScanTime,
      optimizeBandwidth,
      resolveAnomaly
    }}>
      {children}
    </NetworkDataContext.Provider>
  );
};