import { useState } from 'react';
import Footer from '../../components/common/Footer';
import DashboardTab from '../student/tabs/DashboardTab';
import PointReviewTab from '../student/tabs/PointReviewTab';
import LeaderboardTab from '../student/tabs/LeaderboardTab';
import CaptainGroupTab from './tabs/CaptainGroupTab';
import ActivitiesTab from '../student/tabs/ActivitiesTab';
import LevelsBadgesTab from '../student/tabs/LevelsBadgesTab';
import ProfileTab from '../student/tabs/ProfileTab';
import PageLoader from '../../components/common/PageLoader';
import { LayoutDashboard, History, Trophy, Users, Ticket, Medal, User } from 'lucide-react';

export default function CaptainDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const handleTabChange = (idx: number) => {
    if (idx === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(idx);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 350);
  };

  const tabs = [
    { name: 'Dashboard', icon: LayoutDashboard, component: <DashboardTab onSelectTab={handleTabChange} /> },
    { name: 'Point Review', icon: History, component: <PointReviewTab /> },
    { name: 'Leaderboard', icon: Trophy, component: <LeaderboardTab /> },
    { name: 'My Group', icon: Users, component: <CaptainGroupTab /> },
    { name: 'Activities', icon: Ticket, component: <ActivitiesTab /> },
    { name: 'Levels & Badges', icon: Medal, component: <LevelsBadgesTab /> },
    { name: 'Profile', icon: User, component: <ProfileTab /> }
  ];

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {isTabLoading && <PageLoader message={`Opening ${tabs[activeTab].name}...`} fullScreen={true} />}

      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">PragatiX</h1>
          <p className="text-xs text-slate-400 mt-1">Captain Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => handleTabChange(idx)}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${activeTab === idx
                  ? 'bg-indigo-600 text-white border-l-4 border-indigo-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                }`}
            >
              <tab.icon className={`w-5 h-5 mr-3 ${activeTab === idx ? 'text-indigo-200' : 'text-slate-400'}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {tabs[activeTab].component}
          </div>
          <Footer />
        </div>

        {/* Bottom Nav (Mobile) */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  activeTab === idx ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === idx ? 'stroke-2' : 'stroke-[1.5]'}`} />
                <span className="text-[10px] font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
