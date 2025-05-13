import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCw } from 'lucide-react';
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

const PacketCapture: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Connect to WebSocket server with increased timeouts
    console.log('Connecting to packet capture service...');
    const newSocket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to packet capture service');
      setError(null);
    });

    newSocket.on('packet', (packet: PacketData) => {
      console.log('Received packet:', packet);
      setPackets(prev => {
        const newPackets = [packet, ...prev];
        return newPackets.slice(0, 100); // Keep last 100 packets
      });
      setError(null);
    });

    newSocket.on('error', (err: string) => {
      console.error('Socket error:', err);
      setError(err);
      setIsCapturing(false);
    });

    newSocket.on('connect_error', (err: any) => {
      console.error('Connection error:', err);
      setError('Failed to connect to packet capture service. Please ensure the service is running with administrator privileges.');
      setIsCapturing(false);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    return () => {
      console.log('Disconnecting from packet capture service...');
      newSocket.close();
    };
  }, []);

  const handleToggleCapture = useCallback(() => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

    if (isCapturing) {
      console.log('Stopping packet capture...');
      socket.emit('stop_capture', (response: any) => {
        console.log('Stop capture response:', response);
        if (response?.status === 'success') {
          setIsCapturing(false);
          setError(null);
        } else {
          setError(response?.message || 'Failed to stop packet capture');
        }
      });
    } else {
      console.log('Starting packet capture...');
      socket.emit('start_capture', (response: any) => {
        console.log('Start capture response:', response);
        if (response?.status === 'success') {
          setIsCapturing(true);
          setError(null);
        } else {
          setError(response?.message || 'Failed to start packet capture');
        }
      });
    }
  }, [socket, isCapturing]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const getProtocolName = (protocol: number) => {
    const protocols: { [key: number]: string } = {
      1: 'ICMP',
      6: 'TCP',
      17: 'UDP'
    };
    return protocols[protocol] || `Unknown (${protocol})`;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Packet Capture</h2>
        <div className="flex gap-2">
          <button
            onClick={handleToggleCapture}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              isCapturing
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isCapturing ? (
              <>
                <Square className="w-4 h-4" />
                Stop Capture
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Capture
              </>
            )}
          </button>
          <button
            onClick={() => setPackets([])}
            className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Protocol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Length
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {packets.map((packet, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(packet.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {packet.source_ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {packet.destination_ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getProtocolName(packet.protocol)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {packet.length} bytes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {packet.details.protocol}
                  {packet.details.source_port && `:${packet.details.source_port}`}
                  {packet.details.destination_port && ` → ${packet.details.destination_port}`}
                  {packet.details.flags && ` [${packet.details.flags}]`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PacketCapture; 