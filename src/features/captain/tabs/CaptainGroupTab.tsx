import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { teamService } from '../../../services/teamService';
import { useAuth } from '../../../store/authContext';
import toast from 'react-hot-toast';
import { Users, Star, RefreshCw, UserX, UserPlus, UserMinus, Shield, Award, Calendar, BookOpen, Trophy, X } from 'lucide-react';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

export default function CaptainGroupTab() {
  const { isCaptain: viewerIsCaptain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [isClassmatesLoading, setIsClassmatesLoading] = useState(false);
  const [pendingRegNo, setPendingRegNo] = useState<string | null>(null);
  const [removalTarget, setRemovalTarget] = useState<{ regNo: string; name: string } | null>(null);

  const fetchMyGroup = async () => {
    setLoading(true);
    try {
      // Call GET /api/v1/teams/my-team/details matching Flutter StudentTeamDetailsPage
      let response;
      try {
        response = await apiClient.get('/api/v1/teams/my-team/details');
      } catch (_) {
        response = await apiClient.get('/api/v1/teams/my-team');
      }

      if (response.data && response.data.success && response.data.data) {
        setTeamData(response.data.data);
      } else {
        setTeamData(null);
      }
    } catch (err: any) {
      logger.error('Error fetching team:', err);
      setTeamData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGroup();
  }, []);

  const openAddMemberModal = async () => {
    setIsAddModalOpen(true);
    setIsClassmatesLoading(true);
    try {
      const response = await teamService.getMyClassmates();
      const list = response.data?.data ?? response.data ?? [];
      setClassmates(Array.isArray(list) ? list : []);
    } catch (err) {
      logger.error('Failed to fetch classmates:', err);
      toast.error('Failed to load classmates');
      setClassmates([]);
    } finally {
      setIsClassmatesLoading(false);
    }
  };

  const handleAddMember = async (regNo: string, name: string) => {
    setPendingRegNo(regNo);
    const toastId = toast.loading(`Adding ${name}...`);
    try {
      const response = await teamService.addMemberByCaptain(regNo);
      toast.dismiss(toastId);
      if (response.data?.success !== false) {
        toast.success(`${name} added to the team`);
        setIsAddModalOpen(false);
        fetchMyGroup();
      } else {
        toast.error(response.data?.message || 'Failed to add member');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setPendingRegNo(null);
    }
  };

  const handleRequestRemovalConfirm = async () => {
    if (!removalTarget) return;
    const { regNo, name } = removalTarget;
    setRemovalTarget(null);
    setPendingRegNo(regNo);
    const toastId = toast.loading(`Requesting removal of ${name}...`);
    try {
      const response = await teamService.requestMemberRemoval(regNo);
      toast.dismiss(toastId);
      if (response.data?.success !== false) {
        toast.success('Removal request sent to your Class Coordinator');
      } else {
        toast.error(response.data?.message || 'Failed to submit removal request');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to submit removal request');
    } finally {
      setPendingRegNo(null);
    }
  };

  const existingRegNos = new Set(
    (teamData?.members || teamData?.teamMembers || []).map((m: any) =>
      String(m.regNo || m.studentRegNo || m.registerNumber || m.studentId || '')
    )
  );
  const availableClassmates = classmates.filter(
    (c) => !existingRegNos.has(String(c.regNo || c.studentRegNo || c.registerNumber || c.studentId || ''))
  );

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Loading group details...</p>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <UserX className="w-10 h-10" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-800 mb-2">No Team Assigned</h2>
          <p className="text-slate-500 max-w-md mb-6">
            You are not assigned to any group yet. Please contact your Class Coordinator for team placement.
          </p>
          <button
            onClick={fetchMyGroup}
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const teamMembers = teamData.members || teamData.teamMembers || [];
  const teamName = teamData.teamName || teamData.name || 'My Group';
  const stageLabel = teamData.stage || 'Stage 1';
  const department = teamData.department || teamData.departmentName || 'N/A';
  const section = teamData.section || teamData.sectionName || 'N/A';
  const academicYear = teamData.academicYear || teamData.academicYearName || 'N/A';
  const semester = teamData.semester || 'N/A';
  const totalTeamXp = teamData.totalTeamXp ?? teamData.teamXp ?? 0;
  const currentMembers = teamData.currentMemberCount || teamMembers.length;
  const maxMembers = teamData.maxTeamSize || 10;
  const captainName = teamData.captainName || teamData.captain?.fullName || 'N/A';
  const viceCaptainName = teamData.viceCaptainName || teamData.viceCaptain?.fullName || 'N/A';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-32">
      {/* Header Bar matching Flutter AppBar */}
      <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-md flex justify-between items-center">
        <h1 className="font-heading text-xl font-bold">My Team Leaderboard</h1>
        <div className="flex items-center gap-2">
          {viewerIsCaptain && (
            <button
              onClick={openAddMemberModal}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
              title="Add Member"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={fetchMyGroup}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
            title="Refresh Team"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Header Card matching Flutter _buildHeaderCard */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl p-6 text-white shadow-xl space-y-5">
        <div className="flex justify-between items-start">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">{teamName}</h2>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
            {stageLabel}
          </span>
        </div>

        {/* Sub-chips matching Flutter Wrap chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md">
            <BookOpen className="w-3.5 h-3.5 text-white/80" />
            {department}
          </span>
          <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md">
            <Shield className="w-3.5 h-3.5 text-white/80" />
            Sec: {section}
          </span>
          <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5 text-white/80" />
            {academicYear}
          </span>
          <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md">
            🚪 {semester}
          </span>
        </div>

        {/* Metrics Row matching Flutter _buildHeaderInfoItem */}
        <div className="flex justify-around items-center pt-2">
          <div className="flex flex-col items-center">
            <Star className="w-6 h-6 text-white/80 mb-1 fill-amber-300" />
            <span className="text-lg font-extrabold">{totalTeamXp} XP</span>
            <span className="text-[11px] text-white/70">Total Team XP</span>
          </div>

          <div className="flex flex-col items-center">
            <Users className="w-6 h-6 text-white/80 mb-1" />
            <span className="text-lg font-extrabold">{currentMembers} / {maxMembers}</span>
            <span className="text-[11px] text-white/70">Members</span>
          </div>
        </div>

        <div className="h-px bg-white/20" />

        {/* Captain / Vice Captain Row matching Flutter _buildRoleInfo */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-white/70">Captain</div>
            <div className="font-semibold text-sm truncate">{captainName}</div>
          </div>
          <div>
            <div className="text-white/70">Vice Captain</div>
            <div className="font-semibold text-sm truncate">{viceCaptainName}</div>
          </div>
        </div>
      </div>

      {/* Team Leaderboard Roster Section matching Flutter _buildLeaderboardCard */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-slate-800">Team Leaderboard</h2>

        {teamMembers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-100 shadow-sm">
            No members found in this group.
          </div>
        ) : (
          <div className="space-y-2.5">
            {teamMembers.map((member: any, idx: number) => {
              const rankInTeam = member.rankInsideTeam ?? (idx + 1);
              const isCaptain = member.teamRole === 'CAPTAIN';
              const isViceCaptain = member.teamRole === 'VICE_CAPTAIN';
              const name = member.studentName || 'Student';
              const memberXp = member.totalXp ?? 0;
              const memberStage = `${member.currentStage ?? 'Stage 1'} - ${member.currentLevel ?? 'Explorer'}`;
              const memberRegNo = member.regNo || member.studentRegNo || member.registerNumber || member.studentId || '';

              return (
                <div
                  key={idx}
                  className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Trophy / Badge matching Flutter */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {rankInTeam === 1 ? (
                        <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
                      ) : rankInTeam === 2 ? (
                        <Award className="w-6 h-6 text-slate-400" />
                      ) : (
                        <span className="font-extrabold text-slate-400 text-sm">{rankInTeam}</span>
                      )}
                    </div>

                    {/* Member Circle Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-200/80 text-blue-900 font-extrabold flex items-center justify-center text-sm shrink-0">
                      {name[0]?.toUpperCase() || 'S'}
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">{name}</span>
                        {isCaptain && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                            👑 CAPTAIN
                          </span>
                        )}
                        {isViceCaptain && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 uppercase tracking-wider">
                            🥈 VICE CAPTAIN
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {memberStage}
                      </div>
                    </div>
                  </div>

                  {/* Score on Right matching Flutter */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="flex items-center gap-1 text-sm font-extrabold text-amber-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{memberXp}</span>
                    </div>
                    {viewerIsCaptain && !isCaptain && memberRegNo && (
                      <button
                        onClick={() => setRemovalTarget({ regNo: memberRegNo, name })}
                        disabled={pendingRegNo === memberRegNo}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                        title={`Request removal of ${name}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-heading text-lg font-bold text-slate-900">Add Classmate to Team</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isClassmatesLoading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : availableClassmates.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">
                  No available classmates to add.
                </p>
              ) : (
                availableClassmates.map((c: any) => {
                  const cRegNo = c.regNo || c.studentRegNo || c.registerNumber || c.studentId || '';
                  const cName = c.fullName || c.studentName || c.name || 'Student';
                  return (
                    <div
                      key={cRegNo || cName}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-800 truncate">{cName}</div>
                        <div className="text-xs text-slate-400">{cRegNo}</div>
                      </div>
                      <button
                        onClick={() => handleAddMember(cRegNo, cName)}
                        disabled={pendingRegNo === cRegNo}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* Removal Confirmation Modal */}
      <ConfirmationModal
        isOpen={removalTarget !== null}
        title="Request Member Removal"
        description={`Are you sure you want to request the removal of "${removalTarget?.name || 'this member'}" from the team? This request will be sent to your Class Coordinator.`}
        confirmText="Request Removal"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleRequestRemovalConfirm}
        onCancel={() => setRemovalTarget(null)}
      />
    </div>
  );
}
