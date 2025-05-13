import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  Sliders, 
  Settings,
  Menu,
  X,
  Shield,
  Zap
} from 'lucide-react';
import StatusBar from './StatusBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Traffic Monitor', path: '/traffic', icon: <Activity className="w-5 h-5" /> },
    { name: 'Anomaly Detection', path: '/anomalies', icon: <AlertTriangle className="w-5 h-5" /> },
    { name: 'Bandwidth Optimizer', path: '/optimize', icon: <Sliders className="w-5 h-5" /> },
    /*{ name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },*/
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-6">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-white">
            <Shield className="h-8 w-8 text-blue-500" />
            <span>NetSecure</span>
          </Link>
        </div>
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center rounded-md px-3 py-3 transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 bg-slate-900/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center">
              <div className="status-indicator online mr-2"></div>
              <span>System Active</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-amber-500" />
              <span>Optimized</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800 px-6">
          <button
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center">
            <StatusBar />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;