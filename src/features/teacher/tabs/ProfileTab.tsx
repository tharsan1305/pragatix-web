import { useState, useEffect } from 'react';
import { LogOut, FileBadge } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

export default function ProfileTab() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Teacher",
    email: "",
    role: "TEACHER",
    department: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/v1/auth/me');
        if (response.data.success) {
          const d = response.data.data;
          setProfileData({
            name: d.fullName || d.username || "Teacher",
            email: d.email || "",
            role: d.role || "TEACHER",
            department: d.department || ""
          });
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success("Signed out successfully");
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Profile Summary</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#F1F5F9] flex flex-col items-center pt-10">
        <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-white shadow-md flex items-center justify-center mb-5">
          <FileBadge className="w-12 h-12 text-teal-600" />
        </div>

        <h2 className="text-[22px] font-bold text-slate-800">{profileData.name}</h2>
        {profileData.email && (
          <p className="text-sm text-slate-500 mt-1">{profileData.email}</p>
        )}
        <p className="text-sm text-slate-500 mt-1.5">PragatiX — Student Discipline Monitoring</p>

        <div className="w-full max-w-md px-6 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">Role</span>
              <span className="text-sm font-bold text-slate-800">
                {profileData.role.replace("ROLE_", "")}
              </span>
            </div>
            <div className="h-px bg-slate-100" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">Active System Session</span>
              <span className="text-sm font-bold text-slate-800">Yes</span>
            </div>
            
            {profileData.department && (
              <>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Department</span>
                  <span className="text-sm font-bold text-slate-800">{profileData.department}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-auto w-full max-w-md px-6 py-6">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      <LogoutModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
