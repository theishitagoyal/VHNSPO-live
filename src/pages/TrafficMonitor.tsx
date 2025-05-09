import React, { useState } from 'react';
import { useNetworkData } from '../context/NetworkDataContext';
import { 
  ArrowDownUp, 
  ArrowRightLeft, 
  Filter, 
  RefreshCw,
  Network,
  Download,
  Upload
} from 'lucide-react';

const TrafficMonitor: React.FC = () => {
  const { packets } = useNetworkData();
  
  const [filters, setFilters] = useState({
    protocol: '',
    sourceIP: '',
    destinationIP: '',
  });
  
  const [sortBy, setSortBy] = useState<keyof typeof packets[0]>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Apply filters
  const filteredPackets = packets.filter(packet => {
    return (
      (filters.protocol === '' || packet.protocol === filters.protocol) &&
      (filters.sourceIP === '' || packet.sourceIP.includes(filters.sourceIP)) &&
      (filters.destinationIP === '' || packet.destinationIP.includes(filters.destinationIP))
    );
  });
  
  // Apply sorting
  const sortedPackets = [...filteredPackets].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSort = (column: keyof typeof packets[0]) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Get unique protocols for filter
  const protocols = Array.from(new Set(packets.map(packet => packet.protocol)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Traffic Monitor</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-green-500 text-sm">
            <Download className="h-4 w-4" />
            <span>2.4 MB/s</span>
          </div>
          <div className="flex items-center gap-1 text-blue-500 text-sm">
            <Upload className="h-4 w-4" />
            <span>1.2 MB/s</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-sm">
            <Network className="h-4 w-4" />
            <span>{packets.length} packets</span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <div>
              <label htmlFor="protocol" className="block text-sm text-slate-400 mb-1">Protocol</label>
              <select
                id="protocol"
                name="protocol"
                value={filters.protocol}
                onChange={handleFilterChange}
                className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2 text-sm"
              >
                <option value="">All</option>
                {protocols.map(protocol => (
                  <option key={protocol} value={protocol}>{protocol}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="sourceIP" className="block text-sm text-slate-400 mb-1">Source IP</label>
              <input
                type="text"
                id="sourceIP"
                name="sourceIP"
                value={filters.sourceIP}
                onChange={handleFilterChange}
                placeholder="Filter by source IP"
                className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2 text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="destinationIP" className="block text-sm text-slate-400 mb-1">Destination IP</label>
              <input
                type="text"
                id="destinationIP"
                name="destinationIP"
                value={filters.destinationIP}
                onChange={handleFilterChange}
                placeholder="Filter by destination IP"
                className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2 text-sm"
              />
            </div>
          </div>
          
          <button 
            className="btn btn-primary sm:self-end"
            onClick={() => setFilters({ protocol: '', sourceIP: '', destinationIP: '' })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
      
      {/* Packets table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center">
                    Time
                    {sortBy === 'timestamp' && (
                      <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('sourceIP')}
                >
                  <div className="flex items-center">
                    Source IP
                    {sortBy === 'sourceIP' && (
                      <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('destinationIP')}
                >
                  <div className="flex items-center">
                    Destination IP
                    {sortBy === 'destinationIP' && (
                      <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('protocol')}
                >
                  <div className="flex items-center">
                    Protocol
                    {sortBy === 'protocol' && (
                      <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center">
                    Size
                    {sortBy === 'size' && (
                      <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th>Flags</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
              {sortedPackets.length > 0 ? (
                sortedPackets.map(packet => (
                  <tr key={packet.id}>
                    <td>{new Date(packet.timestamp).toLocaleTimeString()}</td>
                    <td>{packet.sourceIP}</td>
                    <td>{packet.destinationIP}</td>
                    <td>
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${packet.protocol === 'TCP' ? 'bg-blue-500/20 text-blue-300' : 
                          packet.protocol === 'UDP' ? 'bg-green-500/20 text-green-300' :
                          packet.protocol === 'HTTP' ? 'bg-purple-500/20 text-purple-300' :
                          packet.protocol === 'HTTPS' ? 'bg-emerald-500/20 text-emerald-300' :
                          packet.protocol === 'DNS' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-500/20 text-slate-300'}
                      `}>
                        {packet.protocol}
                      </span>
                    </td>
                    <td>{packet.size} bytes</td>
                    <td>
                      {packet.flags && packet.flags.length > 0 ? (
                        <div className="flex gap-1">
                          {packet.flags.map(flag => (
                            <span key={flag} className="px-1.5 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">
                              {flag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      <ArrowRightLeft className="h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-slate-400">
                    No packets found matching the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Packet Capture Controls */}
      <div className="flex justify-end space-x-4">
        <button className="btn btn-primary">Start Capture</button>
        <button className="btn bg-slate-700 hover:bg-slate-600 text-white">Export Data</button>
      </div>
    </div>
  );
};

export default TrafficMonitor;