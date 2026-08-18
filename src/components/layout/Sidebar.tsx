import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileWarning,
  BarChart,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../store/authContext';

interface SidebarProps {
  role: string | null;
}

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const { logout, isAdmin, isTeacher } = useAuth();

  const getLinks = () => {
    const dashboardPath = isAdmin ? '/admin' : isTeacher ? '/teacher' : `/${role?.toLowerCase() || 'student'}`;
    const baseLinks = [
      { name: 'Dashboard', path: dashboardPath, icon: LayoutDashboard },
    ];

    if (isAdmin || isTeacher) {
      baseLinks.push(
        { name: 'Students', path: '/students', icon: Users }
      );
    }

    if (isAdmin) {
      baseLinks.push(
        { name: 'Analytics', path: '/admin?tab=analytics', icon: BarChart },
        { name: 'Attendance', path: '/admin?tab=attendance', icon: FileWarning }
      );
    } else if (isTeacher) {
      baseLinks.push(
        { name: 'Directory', path: '/teacher/students-directory', icon: Users }
      );
    }

    return baseLinks;
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
          onClick={logout}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
          Logout
        </button>
      </div>
    </div>
  );
}
