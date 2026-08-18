import { logger } from '../../utils/logger';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // In a real app, this role would come from your auth store
  const storedUser = localStorage.getItem('spdms_user');
  let role = null;
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      role = user.role;
    } catch (e) {
      logger.error('Failed to parse user role');
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back{role ? `, ${role}` : ''}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
