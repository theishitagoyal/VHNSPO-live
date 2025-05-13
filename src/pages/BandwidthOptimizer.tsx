import React, { useState } from 'react';
import { useNetworkData } from '../context/NetworkDataContext';
import { Sliders, Zap, Settings, Laptop, LayoutGrid, BarChart } from 'lucide-react';

const BandwidthOptimizer: React.FC = () => {
  const { bandwidthAllocation, optimizeBandwidth } = useNetworkData();
  const [optimizationInProgress, setOptimizationInProgress] = useState(false);
  
  // Debug log for bandwidthAllocation
  console.log('Bandwidth Allocation:', bandwidthAllocation);
  
  const handleOptimize = () => {
    setOptimizationInProgress(true);
    setTimeout(() => {
      optimizeBandwidth();
      setOptimizationInProgress(false);
    }, 2000); // Simulate optimization process
  };
  
  const getTotalUsage = () => {
    // Check if bandwidthAllocation exists and has items
    if (!bandwidthAllocation || bandwidthAllocation.length === 0) {
      console.log('getTotalUsage: No bandwidth data available');
      return 0;
    }
    
    const total = bandwidthAllocation.reduce((sum, device) => {
      console.log('Usage for device:', device.device, device.usage);
      return sum + (device.usage || 0);
    }, 0) / bandwidthAllocation.length;
    
    console.log('Total Usage:', total);
    return total;
  };
  
  const getTotalAllocation = () => {
    // Check if bandwidthAllocation exists and has items
    if (!bandwidthAllocation || bandwidthAllocation.length === 0) {
      console.log('getTotalAllocation: No bandwidth data available');
      return 0;
    }
    
    const total = bandwidthAllocation.reduce((sum, device) => {
      console.log('Allocation for device:', device.device, device.allocation);
      return sum + (device.allocation || 0);
    }, 0) / bandwidthAllocation.length;
    
    console.log('Total Allocation:', total);
    return total;
  };
  
  const getEfficiencyGain = () => {
    const beforeOptimization = getTotalUsage();
    const afterOptimization = getTotalAllocation();
    
    console.log('Efficiency calculation - Before:', beforeOptimization, 'After:', afterOptimization);
    
    // Prevent division by zero or NaN
    if (!beforeOptimization || beforeOptimization === 0) {
      const result = afterOptimization > 0 ? '100.00' : '0.00';
      console.log('Efficiency result (zero division case):', result);
      return result;
    }
    
    const result = ((afterOptimization - beforeOptimization) / beforeOptimization * 100).toFixed(2);
    console.log('Efficiency result:', result);
    return result;
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bandwidth Optimizer</h1>
      
      {/* Optimization stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center">
            <BarChart className="h-10 w-10 mr-3 text-blue-500" />
            <div>
              <p className="text-sm text-slate-300">Current Bandwidth Usage</p>
              <p className="text-xl font-semibold">{getTotalUsage().toFixed(2)}%</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Sliders className="h-10 w-10 mr-3 text-green-500" />
            <div>
              <p className="text-sm text-slate-300">Optimized Allocation</p>
              <p className="text-xl font-semibold">{getTotalAllocation().toFixed(2)}%</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Zap className="h-10 w-10 mr-3 text-amber-500" />
            <div>
              <p className="text-sm text-slate-300">Efficiency Gain</p>
              <p className="text-xl font-semibold">{getEfficiencyGain()}%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Knapsack algorithm explanation */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Knapsack Algorithm</h2>
        <p className="text-slate-300 mb-4">
          The bandwidth optimizer uses the Knapsack algorithm to maximize network efficiency by allocating bandwidth based on device priority and actual usage patterns. This ensures critical applications receive sufficient resources while optimizing overall network performance.
        </p>
        <div className="flex justify-end">
          <button 
            className={`btn btn-primary ${optimizationInProgress ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleOptimize}
            disabled={optimizationInProgress}
          >
            {optimizationInProgress ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Optimization
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Device allocation table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Device Bandwidth Allocation</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Current Usage</th>
                <th>Priority</th>
                <th>Optimized Allocation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bandwidthAllocation.map((device, index) => (
                <tr key={index}>
                  <td className="flex items-center">
                    <Laptop className="h-4 w-4 mr-2 text-slate-400" />
                    {device.device}
                  </td>
                  <td>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${device.usage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{device.usage}%</span>
                  </td>
                  <td>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-4 h-4 ${i < device.priority ? 'text-yellow-400' : 'text-slate-700'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-xs text-slate-400">Level {device.priority}</span>
                    </div>
                  </td>
                  <td>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          optimizationInProgress ? 'bg-slate-600 animate-pulse' : 'bg-green-600'
                        }`}
                        style={{ width: `${device.allocation}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{device.allocation}%</span>
                  </td>
                  <td>
                    <span className={`
                      px-2 py-1 rounded-full text-xs
                      ${device.allocation > device.usage ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}
                    `}>
                      {device.allocation > device.usage ? 'Optimized' : 'Limited'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Manual configuration */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Settings className="h-5 w-5 mr-2 text-slate-400" />
          <h2 className="text-lg font-semibold">Manual Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium mb-3 text-slate-300">Priority Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Video Streaming Priority</span>
                  <span>High</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  defaultValue="4"
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Gaming Priority</span>
                  <span>Very High</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  defaultValue="5"
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Work Applications Priority</span>
                  <span>Medium</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  defaultValue="3"
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>IoT Devices Priority</span>
                  <span>Low</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  defaultValue="2"
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-3 text-slate-300">Time-Based Rules</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="work-hours"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
                />
                <label htmlFor="work-hours" className="ml-2 text-sm text-slate-300">
                  Prioritize work applications during work hours (9AM-5PM)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="evening-streaming"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
                />
                <label htmlFor="evening-streaming" className="ml-2 text-sm text-slate-300">
                  Prioritize streaming in the evening (7PM-11PM)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="gaming-weekend"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
                />
                <label htmlFor="gaming-weekend" className="ml-2 text-sm text-slate-300">
                  Prioritize gaming on weekends
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="limit-background"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
                />
                <label htmlFor="limit-background" className="ml-2 text-sm text-slate-300">
                  Limit background updates during high usage periods
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button className="btn bg-slate-700 hover:bg-slate-600 text-white">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default BandwidthOptimizer;