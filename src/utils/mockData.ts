import { PacketData, AnomalyData, BandwidthData } from '../context/NetworkDataContext';

// Helper function to generate random IP address
const generateRandomIP = () => {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
};

// Helper function to generate random packet data
const generateRandomPacket = (): PacketData => {
  const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP'];
  const flags = ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG'];
  const protocol = protocols[Math.floor(Math.random() * protocols.length)];
  
  return {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: Date.now() - Math.floor(Math.random() * 60000), // Within the last minute
    sourceIP: generateRandomIP(),
    destinationIP: generateRandomIP(),
    protocol,
    size: Math.floor(Math.random() * 1500) + 40, // Size in bytes
    flags: protocol === 'TCP' ? flags.filter(() => Math.random() > 0.7) : undefined,
  };
};

// Helper function to generate random anomaly data
const generateRandomAnomaly = (): AnomalyData => {
  const anomalyTypes = ['DDoS', 'Port Scan', 'Brute Force', 'Phishing', 'Unknown'];
  const severityLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
  
  return {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: Date.now() - Math.floor(Math.random() * 3600000), // Within the last hour
    type,
    severity: severityLevels[Math.floor(Math.random() * severityLevels.length)],
    sourceIP: generateRandomIP(),
    destinationIP: generateRandomIP(),
    details: `Potential ${type} attack detected`,
    resolved: false,
  };
};

// Helper function to generate traffic by protocol data
const generateTrafficByProtocol = (): Record<string, number> => {
  return {
    TCP: Math.floor(Math.random() * 1000) + 500,
    UDP: Math.floor(Math.random() * 500) + 200,
    HTTP: Math.floor(Math.random() * 800) + 300,
    HTTPS: Math.floor(Math.random() * 1200) + 600,
    DNS: Math.floor(Math.random() * 300) + 100,
    ICMP: Math.floor(Math.random() * 100) + 50,
  };
};

// Helper function to generate traffic by time data
const generateTrafficByTime = (): { timestamp: number; value: number }[] => {
  const now = Date.now();
  const data = [];
  
  for (let i = 0; i < 5; i++) {
    data.push({
      timestamp: now - (5 - i) * 1000, // Every second in the last 5 seconds
      value: Math.floor(Math.random() * 1000) + 500, // Value in bytes
    });
  }
  
  return data;
};

// Helper function to generate bandwidth allocation data
const generateBandwidthAllocation = (): BandwidthData[] => {
  const devices = [
    'Living Room TV',
    'Home Office PC',
    'Kitchen Tablet',
    'Gaming Console',
    'Smart Thermostat',
    'Security Cameras',
    'Mobile Phone',
    'Guest Network',
  ];
  
  return devices.map(device => ({
    device,
    usage: Math.floor(Math.random() * 100), // Usage in percentage
    priority: Math.floor(Math.random() * 5) + 1, // Priority from 1 to 5
    allocation: Math.floor(Math.random() * 100), // Current allocation in percentage
  }));
};

// Main function to generate all mock data
export const generateMockData = () => {
  // Generate packets
  const packetCount = Math.floor(Math.random() * 5) + 1; // 1-5 packets per update
  const packets: PacketData[] = [];
  
  for (let i = 0; i < packetCount; i++) {
    packets.push(generateRandomPacket());
  }
  
  // Generate anomalies (less frequent)
  const anomalies: AnomalyData[] = [];
  if (Math.random() < 0.2) { // 20% chance to generate an anomaly
    anomalies.push(generateRandomAnomaly());
  }
  
  // Generate other data
  const trafficByProtocol = generateTrafficByProtocol();
  const trafficByTime = generateTrafficByTime();
  const bandwidthAllocation = generateBandwidthAllocation();
  
  // Determine threat level based on anomalies
  let threatLevel: 'low' | 'medium' | 'high' = 'low';
  if (anomalies.some(a => a.severity === 'high')) {
    threatLevel = 'high';
  } else if (anomalies.some(a => a.severity === 'medium')) {
    threatLevel = 'medium';
  }
  
  return {
    packets,
    anomalies,
    trafficByProtocol,
    trafficByTime,
    bandwidthAllocation,
    threatLevel,
  };
};