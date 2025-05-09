import React from 'react';
import { useNetworkData } from '../context/NetworkDataContext';
import { Shield, Wifi, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatusBar: React.FC = () => {
  const { threatLevel, detectionCount, lastScanTime } = useNetworkData();
  
  const getThreatLevelColor = () => {
    switch (threatLevel) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  const getFormattedTime = () => {
    if (!lastScanTime) return 'Never';
    return formatDistanceToNow(lastScanTime, { addSuffix: true });
  };

  return (
    <div className="flex items-center space-x-6 text-sm">
      <div className="flex items-center">
        <Shield className={`h-4 w-4 mr-2 ${getThreatLevelColor()}`} />
        <span className="capitalize">{threatLevel} Threat Level</span>
      </div>
      
      <div className="flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
        <span>{detectionCount} Detections</span>
      </div>
      
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2 text-slate-400" />
        <span>Last Scan: {getFormattedTime()}</span>
      </div>
      
      <div className="flex items-center">
        <Wifi className="h-4 w-4 mr-2 text-green-500" />
        <span>Connected</span>
      </div>
    </div>
  );
};

export default StatusBar;