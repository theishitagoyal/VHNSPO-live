import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { generateMockData } from '../utils/mockData';

export interface PacketData {
  id: string;
  timestamp: number;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  size: number;
  flags?: string[];
}

export interface AnomalyData {
  id: string;
  timestamp: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  sourceIP: string;
  destinationIP: string;
  details: string;
  resolved: boolean;
}

export interface BandwidthData {
  device: string;
  usage: number;
  priority: number;
  allocation: number;
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
  optimizeBandwidth: () => void;
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
  optimizeBandwidth: () => {},
  resolveAnomaly: () => {},
});

export const useNetworkData = () => useContext(NetworkDataContext);

export const NetworkDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [mockDataInterval, setMockDataInterval] = useState<NodeJS.Timeout | null>(null);
  
  // State
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [trafficByProtocol, setTrafficByProtocol] = useState<Record<string, number>>({});
  const [trafficByTime, setTrafficByTime] = useState<{ timestamp: number; value: number }[]>([]);
  const [bandwidthAllocation, setBandwidthAllocation] = useState<BandwidthData[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Initialize with mock data
  useEffect(() => {
    // Generate initial data
    const initialData = generateMockData();
    setPackets(initialData.packets);
    setAnomalies(initialData.anomalies);
    setTrafficByProtocol(initialData.trafficByProtocol);
    setTrafficByTime(initialData.trafficByTime);
    setBandwidthAllocation(initialData.bandwidthAllocation);
    setThreatLevel(initialData.threatLevel);
    setDetectionCount(initialData.anomalies.length);
    setLastScanTime(new Date());

    // Set up interval for mock data
    if (!mockDataInterval) {
      const interval = setInterval(() => {
        const newData = generateMockData();
        
        // Update with new data
        setPackets(prev => [...prev.slice(-100), ...newData.packets]);
        setAnomalies(prev => {
          // Keep unresolved anomalies and add new ones
          const unresolvedAnomalies = prev.filter(a => !a.resolved);
          return [...unresolvedAnomalies, ...newData.anomalies];
        });
        setTrafficByProtocol(newData.trafficByProtocol);
        setTrafficByTime(prev => {
          const newTimeData = [...prev, ...newData.trafficByTime];
          return newTimeData.slice(-30); // Keep only the last 30 data points
        });
        setThreatLevel(newData.threatLevel);
        setDetectionCount(prev => prev + newData.anomalies.length);
        setLastScanTime(new Date());
      }, 5000);
      
      setMockDataInterval(interval);
    }

    return () => {
      if (mockDataInterval) {
        clearInterval(mockDataInterval);
      }
    };
  }, [isConnected]);

  // Function to optimize bandwidth using Knapsack algorithm
  const optimizeBandwidth = () => {
    // In a real application, this would call the backend to apply the knapsack algorithm
    // For now, we'll simulate an optimization
    const optimizedAllocation = bandwidthAllocation.map(device => ({
      ...device,
      allocation: Math.min(100, device.usage + device.priority * 10)
    }));
    
    setBandwidthAllocation(optimizedAllocation);
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