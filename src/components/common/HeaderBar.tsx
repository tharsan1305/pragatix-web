import React, { useState, useRef, useEffect } from 'react';
import { Bell, RefreshCw, User, LogOut, CheckCircle2, Sparkles, Shield, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../store/authContext';

export interface HeaderBarProps {
  title: string;
  subtitle?: string;
  scopeBadge?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenProfile?: () => void;
  onOpenLogout?: () => void;
  notificationCount?: number;
  className?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  scopeBadge,
  onRefresh,
  isRefreshing = false,
  onOpenProfile,
  onOpenLogout,
  notificationCount = 0,
  className = '',
}) => {
  const { user, role, subRoles } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const roleDisplay = (role || (subRoles && subRoles[0]) || 'Member').toUpperCase();

  const mockNotifications = [
    {
      id: 1,
      title: 'Discipline Points Synchronized',
      time: 'Just now',
      desc: 'All semester records and streak trackers are up to date.',
      icon: CheckCircle2,
      isNew: true,
    },
    {
      id: 2,
      title: 'Active Evaluation Cycle',
      time: 'Today',
      desc: 'Stage requirements and milestone thresholds are currently active.',
      icon: Sparkles,
      isNew: false,
    },
  ];

  return (
    <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border mb-6 ${className}`}>
      {/* Title & Scope */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="type-h3 font-bold text-text-primary tracking-tight">{title}</h2>
          {scopeBadge && (
            <span className="px-2.5 py-0.5 rounded-md type-caption font-bold bg-bg text-text-primary border border-border">
              {scopeBadge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="type-body-sm text-text-secondary mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
        )}

        {/* Notifications Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsUserMenuOpen(false);
            }}
            className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-card type-fine font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card text-text-primary rounded-lg border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-4 border-b border-border flex items-center justify-between bg-bg/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <h4 className="type-body-sm font-bold text-text-primary">Notifications</h4>
                </div>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-bg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3.5 hover:bg-bg/60 transition-colors flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-accent-tint text-accent border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <n.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="type-caption font-bold text-text-primary truncate">{n.title}</p>
                        <span className="type-fine text-text-muted shrink-0">{n.time}</span>
                      </div>
                      <p className="type-caption text-text-secondary mt-0.5 line-clamp-2">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 border-t border-border bg-bg/30 text-center">
                <span className="type-fine text-text-muted font-medium">All notifications up to date</span>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-card hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
            aria-label="User menu"
          >
            <div className="w-6 h-6 rounded-md bg-accent-tint text-accent border border-accent/30 flex items-center justify-center font-bold type-fine">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="type-caption font-bold text-text-primary leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card text-text-primary rounded-lg border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-3.5 border-b border-border bg-bg/50">
                <p className="type-body-sm font-bold text-text-primary truncate">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="w-3 h-3 text-accent" />
                  <span className="type-fine font-bold text-accent uppercase tracking-wider">{roleDisplay}</span>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                {onOpenProfile && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left type-caption font-semibold text-text-primary hover:bg-bg rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-text-secondary" />
                      <span>My Profile</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                )}

                {onOpenLogout && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left type-caption font-semibold text-accent hover:bg-accent-tint rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-accent" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
