import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileWarning, 
  BarChart, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  role: string | null;
}

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();

  const getLinks = () => {
    // Customize these based on role if needed
    const baseLinks = [
      { name: 'Dashboard', path: `/${role?.toLowerCase() || 'dashboard'}`, icon: LayoutDashboard },
    ];

    if (role === 'ADMIN' || role === 'TEACHER') {
      baseLinks.push(
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Discipline', path: '/discipline', icon: FileWarning },
        { name: 'Reports', path: '/reports', icon: BarChart }
      );
    }

    if (role === 'ADMIN') {
      baseLinks.push({ name: 'Settings', path: '/settings', icon: Settings });
    }

    return baseLinks;
  };

  const handleLogout = () => {
    // Clear ALL token keys used across the app
    localStorage.removeItem('spdms_token');
    localStorage.removeItem('spdms_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    sessionStorage.clear();
    window.location.href = '/#/login';
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white transition-all duration-300">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider">SPDMS</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {getLinks().map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                }`}
                aria-hidden="true"
              />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
          Logout
        </button>
      </div>
    </div>
  );
}
