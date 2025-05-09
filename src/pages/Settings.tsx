import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, RefreshCw, Save, Terminal, FileCode, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {/* System Configuration */}
      <div className="card">
        <div className="flex items-center mb-6">
          <SettingsIcon className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-semibold">System Configuration</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-3 text-slate-300">Network Interface</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="interface" className="block text-sm text-slate-400 mb-1">Monitoring Interface</label>
                <select
                  id="interface"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                >
                  <option value="eth0">eth0</option>
                  <option value="wlan0">wlan0</option>
                  <option value="docker0">docker0</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  id="promiscuous"
                  type="checkbox"
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
                  defaultChecked
                />
                <label htmlFor="promiscuous" className="ml-2 text-sm text-slate-300">
                  Enable promiscuous mode (capture all packets)
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-3 text-slate-300">Monitoring Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="packet-limit" className="block text-sm text-slate-400 mb-1">Packet Buffer Size</label>
                <select
                  id="packet-limit"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                >
                  <option value="100">100 packets</option>
                  <option value="500">500 packets</option>
                  <option value="1000">1000 packets</option>
                  <option value="5000">5000 packets</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="capture-interval" className="block text-sm text-slate-400 mb-1">Capture Interval</label>
                <select
                  id="capture-interval"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                >
                  <option value="1">1 second</option>
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scapy Configuration */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Terminal className="h-5 w-5 mr-2 text-green-500" />
          <h2 className="text-lg font-semibold">Scapy Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="scapy-path" className="block text-sm text-slate-400 mb-1">Scapy Installation Path</label>
            <input
              type="text"
              id="scapy-path"
              className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
              defaultValue="/usr/local/lib/python3.9/site-packages/scapy"
            />
          </div>
          
          <div>
            <label htmlFor="capture-filter" className="block text-sm text-slate-400 mb-1">BPF Capture Filter</label>
            <input
              type="text"
              id="capture-filter"
              className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
              defaultValue="tcp or udp or icmp"
              placeholder="e.g., tcp port 80"
            />
            <p className="text-xs text-slate-400 mt-1">Berkeley Packet Filter syntax for filtering captured packets</p>
          </div>
          
          <div className="flex items-center">
            <input
              id="enable-scapy"
              type="checkbox"
              className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
              defaultChecked
            />
            <label htmlFor="enable-scapy" className="ml-2 text-sm text-slate-300">
              Enable Scapy packet capture
            </label>
          </div>
        </div>
      </div>
      
      {/* Snort Configuration */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Shield className="h-5 w-5 mr-2 text-red-500" />
          <h2 className="text-lg font-semibold">Snort Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="snort-rules" className="block text-sm text-slate-400 mb-1">Snort Rules Directory</label>
            <input
              type="text"
              id="snort-rules"
              className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
              defaultValue="/etc/snort/rules"
            />
          </div>
          
          <div>
            <label htmlFor="snort-config" className="block text-sm text-slate-400 mb-1">Snort Configuration File</label>
            <input
              type="text"
              id="snort-config"
              className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
              defaultValue="/etc/snort/snort.conf"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="enable-snort"
              type="checkbox"
              className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
              defaultChecked
            />
            <label htmlFor="enable-snort" className="ml-2 text-sm text-slate-300">
              Enable Snort IDS
            </label>
          </div>
          
          <button className="btn bg-slate-700 hover:bg-slate-600 text-white text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Snort Rules
          </button>
        </div>
      </div>
      
      {/* Machine Learning Configuration */}
      <div className="card">
        <div className="flex items-center mb-6">
          <FileCode className="h-5 w-5 mr-2 text-purple-500" />
          <h2 className="text-lg font-semibold">Machine Learning Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-3 text-slate-300">Isolation Forest Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contamination" className="block text-sm text-slate-400 mb-1">Contamination Factor</label>
                <input
                  type="text"
                  id="contamination"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                  defaultValue="0.05"
                />
                <p className="text-xs text-slate-400 mt-1">Expected proportion of anomalies (0.0 to 0.5)</p>
              </div>
              
              <div>
                <label htmlFor="n-estimators" className="block text-sm text-slate-400 mb-1">Number of Estimators</label>
                <input
                  type="number"
                  id="n-estimators"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                  defaultValue="100"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-3 text-slate-300">Random Forest Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rf-estimators" className="block text-sm text-slate-400 mb-1">Number of Estimators</label>
                <input
                  type="number"
                  id="rf-estimators"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                  defaultValue="100"
                />
              </div>
              
              <div>
                <label htmlFor="max-depth" className="block text-sm text-slate-400 mb-1">Max Depth</label>
                <input
                  type="number"
                  id="max-depth"
                  className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
                  defaultValue="10"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              id="enable-ml"
              type="checkbox"
              className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
              defaultChecked
            />
            <label htmlFor="enable-ml" className="ml-2 text-sm text-slate-300">
              Enable Machine Learning detection
            </label>
          </div>
        </div>
      </div>
      
      {/* Notification Settings */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Bell className="h-5 w-5 mr-2 text-amber-500" />
          <h2 className="text-lg font-semibold">Notification Settings</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="email-alerts"
              type="checkbox"
              className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
              defaultChecked
            />
            <label htmlFor="email-alerts" className="ml-2 text-sm text-slate-300">
              Email alerts for high severity threats
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="desktop-notifications"
              type="checkbox"
              className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-blue-600"
              defaultChecked
            />
            <label htmlFor="desktop-notifications" className="ml-2 text-sm text-slate-300">
              Desktop notifications
            </label>
          </div>
          
          <div>
            <label htmlFor="email-address" className="block text-sm text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              id="email-address"
              className="bg-slate-700 text-white rounded-md border-slate-600 w-full p-2"
              defaultValue="admin@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notification Severity Threshold</label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="severity-high"
                  name="severity"
                  type="radio"
                  defaultChecked
                  className="w-4 h-4 bg-slate-700 border-slate-600 focus:ring-blue-600"
                />
                <label htmlFor="severity-high" className="ml-2 text-sm text-slate-300">High only</label>
              </div>
              <div className="flex items-center">
                <input
                  id="severity-medium"
                  name="severity"
                  type="radio"
                  className="w-4 h-4 bg-slate-700 border-slate-600 focus:ring-blue-600"
                />
                <label htmlFor="severity-medium" className="ml-2 text-sm text-slate-300">Medium and above</label>
              </div>
              <div className="flex items-center">
                <input
                  id="severity-all"
                  name="severity"
                  type="radio"
                  className="w-4 h-4 bg-slate-700 border-slate-600 focus:ring-blue-600"
                />
                <label htmlFor="severity-all" className="ml-2 text-sm text-slate-300">All severities</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Settings */}
      <div className="flex justify-end space-x-4">
        <button className="btn bg-slate-700 hover:bg-slate-600 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </button>
        <button className="btn btn-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;