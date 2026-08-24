import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileWarning,
  BarChart,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../store/authContext';

interface SidebarProps {
  role: string | null;
}

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const { logout, isAdmin, isTeacher } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pragatix_layout_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pragatix_layout_sidebar_collapsed', String(next));
      return next;
    });
  };

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
    <div className={`flex h-screen flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out shrink-0 z-20 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className={`flex h-16 items-center justify-between border-b border-gray-800 transition-all ${
        isCollapsed ? 'px-3 justify-center' : 'px-4'
      }`}>
        {!isCollapsed && (
          <h1 className="type-h4 tracking-tight whitespace-nowrap">PragatiX</h1>
        )}
        <div className="relative group/toggle">
          <button
            onClick={toggleSidebar}
            className={`p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
              isCollapsed ? 'w-10 h-10' : ''
            }`}
            aria-label={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
            title={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-white text-xs font-semibold rounded-full whitespace-nowrap opacity-0 pointer-events-none group-hover/toggle:opacity-100 transition-opacity z-50 shadow-2xl border border-gray-700">
            {isCollapsed ? 'Open sidebar' : 'Close sidebar'}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {getLinks().map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <div key={link.name} className="relative group/navitem">
              <Link
                to={link.path}
                className={`flex items-center rounded-md type-nav transition-colors ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-2 py-2'
                } ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title={isCollapsed ? link.name : undefined}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover/navitem:text-gray-300'
                  }`}
                  aria-hidden="true"
                />
                {!isCollapsed && <span>{link.name}</span>}
              </Link>

              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-950 text-white type-caption rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity z-50 shadow-2xl border border-gray-700 font-semibold">
                  {link.name}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="border-t border-gray-800 p-4">
        <div className="relative group/logout">
          <button
            onClick={logout}
            className={`flex w-full items-center rounded-md type-nav text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'px-2 py-2'
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className={`h-5 w-5 text-gray-400 group-hover/logout:text-gray-300 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>Logout</span>}
          </button>
          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-950 text-white type-caption rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/logout:opacity-100 transition-opacity z-50 shadow-2xl border border-gray-700 font-semibold">
              Logout
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
