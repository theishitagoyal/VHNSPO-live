import React, { useState } from 'react';
import { useNetworkData } from '../context/NetworkDataContext';
import { 
  AlertTriangle, 
  Check, 
  AlertCircle, 
  Filter,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const AnomalyDetection: React.FC = () => {
  const { anomalies, resolveAnomaly } = useNetworkData();
  
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
  });

  // Apply filters
  const filteredAnomalies = anomalies.filter(anomaly => {
    return (
      (filters.type === '' || anomaly.type === filters.type) &&
      (filters.severity === '' || anomaly.severity === filters.severity) &&
      (filters.status === '' || 
        (filters.status === 'resolved' && anomaly.resolved) || 
        (filters.status === 'active' && !anomaly.resolved))
    );
  });

  // Count anomalies by type
  const anomaliesByType: Record<string, number> = {};
  anomalies.forEach(anomaly => {
    anomaliesByType[anomaly.type] = (anomaliesByType[anomaly.type] || 0) + 1;
  });

  // Count anomalies by severity
  const anomaliesBySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };
  anomalies.forEach(anomaly => {
    anomaliesBySeverity[anomaly.severity] += 1;
  });

  // Prepare chart data
  const typeChartData = {
    labels: Object.keys(anomaliesByType),
    datasets: [
      {
        data: Object.values(anomaliesByType),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const severityChartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        data: [anomaliesBySeverity.low, anomaliesBySeverity.medium, anomaliesBySeverity.high],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Get unique types for filter
  const types = Array.from(new Set(anomalies.map(anomaly => anomaly.type)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Anomaly Detection</h1>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-red-500/10 border border-red-500/30">
          <div className="flex items-center">
            <AlertTriangle className="h-10 w-10 mr-3 text-red-500" />
            <div>
              <p className="text-sm text-slate-300">High Severity</p>
              <p className="text-xl font-semibold">{anomaliesBySeverity.high}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center">
            <AlertCircle className="h-10 w-10 mr-3 text-amber-500" />
            <div>
              <p className="text-sm text-slate-300">Medium Severity</p>
              <p className="text-xl font-semibold">{anomaliesBySeverity.medium}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-green-500/10 border border-green-500/30">
          <div className="flex items-center">
            <Shield className="h-10 w-10 mr-3 text-green-500" />
            <div>
              <p className="text-sm text-slate-300">Low Severity</p>
              <p className="text-xl font-semibold">{anomaliesBySeverity.low}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Anomalies by Type</h2>
          <div className="h-64">
            <Doughnut data={typeChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Anomalies by Severity</h2>
          <div className="h-64">
            <Doughnut data={severityChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <div>
              <label htmlFor="type" className="block text-sm text-slate-400 mb-1">Type</label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2 text-sm"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="severity" className="block text-sm text-slate-400 mb-1">Severity</label>
              <select
                id="severity"
                name="severity"
                value={filters.severity}
                onChange={handleFilterChange}
                className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2 text-sm"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm text-slate-400 mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => setFilters({ type: '', severity: '', status: '' })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
      
      {/* Anomalies list */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Detected Anomalies</h2>
        
        <div className="table-container">
          {filteredAnomalies.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Time</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalies.map(anomaly => (
                  <tr key={anomaly.id}>
                    <td>{anomaly.type}</td>
                    <td>
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${anomaly.severity === 'high' ? 'bg-red-500/20 text-red-300' : 
                          anomaly.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-green-500/20 text-green-300'}
                      `}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td>{anomaly.sourceIP}</td>
                    <td>{anomaly.destinationIP}</td>
                    <td>{new Date(anomaly.timestamp).toLocaleTimeString()}</td>
                    <td>{anomaly.details}</td>
                    <td>
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${anomaly.resolved ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}
                      `}>
                        {anomaly.resolved ? 'Resolved' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {!anomaly.resolved && (
                        <button 
                          className="btn bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                          onClick={() => resolveAnomaly(anomaly.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-400 text-center py-4">No anomalies match the current filters</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection;