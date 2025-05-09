import React from 'react';
import { useNetworkData } from '../context/NetworkDataContext';
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { AlertTriangle, Shield, Activity, Zap } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const { 
    trafficByProtocol, 
    trafficByTime, 
    anomalies, 
    threatLevel,
    bandwidthAllocation
  } = useNetworkData();

  // Prepare traffic by protocol chart data
  const protocolChartData = {
    labels: Object.keys(trafficByProtocol),
    datasets: [
      {
        label: 'Traffic Volume',
        data: Object.values(trafficByProtocol),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare traffic by time chart data
  const timeChartData = {
    labels: trafficByTime.map(entry => {
      const date = new Date(entry.timestamp);
      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }),
    datasets: [
      {
        label: 'Traffic Volume',
        data: trafficByTime.map(entry => entry.value),
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  // Get threat color based on level
  const getThreatColor = () => {
    switch (threatLevel) {
      case 'high':
        return 'bg-red-500/20 border-red-500';
      case 'medium':
        return 'bg-amber-500/20 border-amber-500';
      case 'low':
        return 'bg-green-500/20 border-green-500';
      default:
        return 'bg-blue-500/20 border-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Network Security Dashboard</h1>
      
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`card ${getThreatColor()} transition-colors duration-500`}>
          <div className="flex items-center">
            <Shield className="h-10 w-10 mr-3" />
            <div>
              <p className="text-sm text-slate-300">Threat Level</p>
              <p className="text-xl font-semibold capitalize">{threatLevel}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-10 w-10 mr-3 text-amber-500" />
            <div>
              <p className="text-sm text-slate-300">Active Anomalies</p>
              <p className="text-xl font-semibold">{anomalies.filter(a => !a.resolved).length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Activity className="h-10 w-10 mr-3 text-blue-500" />
            <div>
              <p className="text-sm text-slate-300">Traffic Volume</p>
              <p className="text-xl font-semibold">
                {Object.values(trafficByProtocol).reduce((sum, val) => sum + val, 0)} KB
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Zap className="h-10 w-10 mr-3 text-amber-500" />
            <div>
              <p className="text-sm text-slate-300">Bandwidth Efficiency</p>
              <p className="text-xl font-semibold">
                {Math.floor(bandwidthAllocation.reduce((sum, item) => sum + item.allocation, 0) / bandwidthAllocation.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Traffic by Protocol</h2>
          <div className="chart-container h-64">
            <Bar data={protocolChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Traffic Volume Over Time</h2>
          <div className="chart-container h-64">
            <Line data={timeChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Recent anomalies */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Anomalies</h2>
        </div>
        <div className="table-container">
          {anomalies.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 5).map(anomaly => (
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
                    <td>
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${anomaly.resolved ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}
                      `}>
                        {anomaly.resolved ? 'Resolved' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-400 text-center py-4">No anomalies detected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;