import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TrafficMonitor from './pages/TrafficMonitor';
import AnomalyDetection from './pages/AnomalyDetection';
import BandwidthOptimizer from './pages/BandwidthOptimizer';
import Settings from './pages/Settings';
import { SocketProvider } from './context/SocketContext';
import { NetworkDataProvider } from './context/NetworkDataContext';

function App() {
  return (
    <Router>
      <SocketProvider>
        <NetworkDataProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/traffic" element={<TrafficMonitor />} />
              <Route path="/anomalies" element={<AnomalyDetection />} />
              <Route path="/optimize" element={<BandwidthOptimizer />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </NetworkDataProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;