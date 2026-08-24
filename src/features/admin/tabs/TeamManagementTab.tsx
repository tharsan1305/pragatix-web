import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { UsersRound, RefreshCw, ChevronDown, ChevronUp, UserPlus, Edit2, UserMinus, Crown, Trash2, X, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface TeamData {
  id?: number;
  teamId?: number;
  name?: string;
  teamName?: string;
  size?: number;
  teamCapacity?: number;
  currentMemberCount?: number;
  captainName?: string;
  captainRegNo?: string;
  viceCaptainName?: string;
  viceCaptainRegNo?: string;
  departmentName?: string;
  yearName?: string;
  sectionName?: string;
  currentStage?: number;
  teamMembers?: any[];
  members?: any[];
}

const getTeamLevel = (g: TeamData) => {
  const members = g.teamMembers || g.members || [];
  const capReg = (g.captainRegNo || '').toString().toLowerCase().trim();
  const captain = members.find((m: any) => {
    const mReg = (m.regNo || m.studentId || m.id || '').toString().toLowerCase().trim();
    return (mReg && mReg === capReg) || m.isCaptain || m.teamRole === 'CAPTAIN';
  });

  if (captain?.currentStage) return captain.currentStage;
  if (captain?.level) return captain.level;
  if (members[0]?.currentStage) return members[0].currentStage;
  if (members[0]?.level) return members[0].level;

  const stages = members.map((m: any) => m.currentStage || m.level || 1);
  if (stages.length > 0) return Math.max(...stages);

  return g.currentStage || 1;
};

export default function TeamManagementTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [activeEditTeam, setActiveEditTeam] = useState<{ id: number; name: string; size: number } | null>(null);
  const [editTeamNameInput, setEditTeamNameInput] = useState('');
  const [editTeamSizeInput, setEditTeamSizeInput] = useState('');
  const [activeAddTeamId, setActiveAddTeamId] = useState<number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedMembersToAssign, setSelectedMembersToAssign] = useState<any[]>([]);
  const [activeDeleteTeam, setActiveDeleteTeam] = useState<TeamData | null>(null);
  const [activeChangeCaptainTeam, setActiveChangeCaptainTeam] = useState<TeamData | null>(null);
  const [selectedNewCaptainRegNo, setSelectedNewCaptainRegNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/teams');
      const rawData = response.data?.data || response.data || [];
      const data = Array.isArray(rawData) ? rawData : (rawData.teamId || rawData.id ? [rawData] : []);
      setTeams(data);
      return data;
    } catch (e: any) {
      logger.error("Error fetching teams", e);
      setTeams([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Search effect for adding members
  useEffect(() => {
    if (!activeAddTeamId) {
      setMemberSearchResults([]);
      setIsSearchingMembers(false);
      return;
    }

    const controller = new AbortController();

    const fetchStudentsForModal = async () => {
      setIsSearchingMembers(true);
      const query = memberSearchQuery.trim();
      try {
        const targetTeam = teams.find((g: any) => (g.teamId || g.id) === activeAddTeamId);
        const stageOrder = targetTeam?.currentStage || 1;

        let response;
        const queryParam = query ? `&keyword=${encodeURIComponent(query)}` : '';
        response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=${stageOrder}${queryParam}`, {
          signal: controller.signal,
        }).catch(() => null);

        if (!response || !response.data?.data) {
          response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=1${queryParam}`, {
            signal: controller.signal,
          }).catch(() => null);
        }

        let list: any[] = [];
        if (Array.isArray(response?.data?.data)) {
          list = response.data.data;
        } else if (Array.isArray(response?.data?.data?.content)) {
          list = response.data.data.content;
        }

        if (!controller.signal.aborted) {
          setMemberSearchResults(list);
        }
      } catch (e: any) {
        if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
          logger.error("Error searching students:", e);
        }
        setMemberSearchResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingMembers(false);
        }
      }
    };

    const timer = setTimeout(fetchStudentsForModal, memberSearchQuery.trim() ? 300 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [memberSearchQuery, activeAddTeamId]);

  // Trigger initial search on modal open
  useEffect(() => {
    if (activeAddTeamId && memberSearchQuery === '') {
      const controller = new AbortController();
      const fetchInitial = async () => {
        setIsSearchingMembers(true);
        try {
          const targetTeam = teams.find((g: any) => (g.teamId || g.id) === activeAddTeamId);
          const stageOrder = targetTeam?.currentStage || 1;

          let response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=${stageOrder}`, {
            signal: controller.signal,
          }).catch(() => null);

          if (!response || !response.data?.data) {
            response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=1`, {
              signal: controller.signal,
            }).catch(() => null);
          }

          let list: any[] = [];
          if (Array.isArray(response?.data?.data)) {
            list = response.data.data;
          } else if (Array.isArray(response?.data?.data?.content)) {
            list = response.data.data.content;
          }

          if (!controller.signal.aborted) {
            setMemberSearchResults(list);
          }
        } catch (e: any) {
          if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
            logger.error("Error fetching initial search:", e);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearchingMembers(false);
          }
        }
      };

      fetchInitial();
      return () => controller.abort();
    }
  }, [activeAddTeamId]);

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditTeam) return;
    const name = editTeamNameInput.trim();
    const newSize = parseInt(editTeamSizeInput, 10);
    if (!name) {
      toast.error("Please enter a valid team name");
      return;
    }
    if (isNaN(newSize) || newSize <= 0) {
      toast.error("Please enter a valid positive capacity limit");
      return;
    }
    const targetTeam = teams.find((g: any) => (g.teamId || g.id) === activeEditTeam.id);
    if (targetTeam) {
      const members = targetTeam.teamMembers || targetTeam.members || [];
      const currentCount = members.length;
      if (newSize < currentCount) {
        toast.error(`Team capacity cannot be less than current member count (${currentCount}).`);
        return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating team...");
    try {
      const response = await apiClient.put(`/api/v1/teams/${activeEditTeam.id}`, { name, size: newSize });
      toast.dismiss(toastId);
      if (response?.data?.success || response?.status === 200) {
        toast.success("Team updated successfully!");
        setActiveEditTeam(null);
        fetchTeams();
      } else {
        toast.error(response?.data?.message || "Failed to update team");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMembers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let regNosToAdd: string[] = selectedMembersToAssign
      .map((s: any) => s.regNo || s.registerNumber || s.studentId)
      .filter(Boolean);

    if (regNosToAdd.length === 0) {
      toast.error("Please select student(s) to add to the team.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Adding ${regNosToAdd.length} member(s)...`);
    try {
      const response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/add-members`, regNosToAdd);
      toast.dismiss(toastId);
      if (response?.data?.success || response?.status === 200 || response?.status === 201) {
        toast.success(`${regNosToAdd.length} member(s) added successfully!`);
        setActiveAddTeamId(null);
        setMemberSearchQuery('');
        setMemberSearchResults([]);
        setSelectedMembersToAssign([]);
        fetchTeams();
      } else {
        toast.error(response?.data?.message || "Failed to add members");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || "Failed to add members");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMember = async (teamId: number, regNo: string, name: string) => {
    const toastId = toast.loading(`Removing ${name}...`);
    try {
      const response = await apiClient.delete(`/api/v1/teams/${teamId}/members/${encodeURIComponent(regNo)}`);
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success(`Removed ${name}`);
        fetchTeams();
      } else {
        toast.error(response.data.message || "Failed to remove member");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeDeleteTeam) return;
    const tId = activeDeleteTeam.teamId || activeDeleteTeam.id;

    setIsSubmitting(true);
    const toastId = toast.loading("Deleting team...");
    try {
      const response = await apiClient.delete(`/api/v1/teams/${tId}`);
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Team deleted successfully!");
        setActiveDeleteTeam(null);
        fetchTeams();
      } else {
        toast.error(response.data.message || "Failed to delete team");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || "Failed to delete team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChangeCaptainTeam || !selectedNewCaptainRegNo) return;

    const tId = activeChangeCaptainTeam.teamId || activeChangeCaptainTeam.id;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating team captain...");
    try {
      const response = await apiClient.put(`/api/v1/teams/${tId}/captain?regNo=${encodeURIComponent(selectedNewCaptainRegNo)}`);
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Team captain changed successfully!");
        setActiveChangeCaptainTeam(null);
        fetchTeams();
      } else {
        toast.error(response.data.message || "Failed to change captain");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || "Failed to change captain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-indigo-600 text-white px-6 py-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <h1 className="type-h4">Team Management</h1>
        <button
          onClick={fetchTeams}
          className="p-2 type-btn hover:bg-white/10 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <UsersRound className="w-16 h-16 mb-4 opacity-30" />
            <p className="type-body-sm font-medium">No teams found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team: any) => {
              const tId = team.teamId || team.id || 0;
              const isExpanded = expandedTeamId === tId;
              const captainName = team.captainName || "No Captain";
              const members = team.teamMembers || team.members || [];
              const memberCount = members.length;
              const size = team.teamCapacity || team.size || 10;
              const teamName = team.teamName || team.name || `Team #${tId}`;
              const level = getTeamLevel(team);

              return (
                <div key={tId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div
                      className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                      onClick={() => setExpandedTeamId(isExpanded ? null : tId)}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <UsersRound className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[15px] text-slate-800 truncate">{teamName}</h3>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            Stage {level}
                          </span>
                        </div>
                        <p className="type-caption text-slate-500 mt-0.5 truncate">
                          Captain: {captainName} • {memberCount}/{size} members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedTeamId(isExpanded ? null : tId)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <div className="p-3 flex flex-wrap justify-end gap-2 border-b border-slate-100 bg-white">
                        <button
                          onClick={() => {
                            setActiveAddTeamId(tId);
                            setMemberSearchQuery('');
                            setSelectedMembersToAssign([]);
                          }}
                          className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg type-caption font-bold transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Member
                        </button>
                        <button
                          onClick={() => {
                            setActiveEditTeam({ id: tId, name: teamName, size });
                            setEditTeamNameInput(teamName);
                            setEditTeamSizeInput(size.toString());
                          }}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg type-caption font-bold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Team
                        </button>
                        <button
                          onClick={() => setActiveChangeCaptainTeam(team)}
                          className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg type-caption font-bold transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5" /> Change Captain
                        </button>
                        <button
                          onClick={() => setActiveDeleteTeam(team)}
                          className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg type-caption font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Team
                        </button>
                      </div>

                      <div className="p-3 flex flex-col">
                        {members.map((m: any, i: number) => {
                          const mRegNo = m.regNo || m.studentId || '';
                          const isCaptain = mRegNo === team.captainRegNo || m.isCaptain;

                          return (
                            <div key={i} className="p-3 border-b border-slate-100 last:border-0 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center type-caption font-bold ${isCaptain ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {isCaptain ? <Crown className="w-4 h-4" /> : (m.fullName || m.name || "S")?.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold type-caption text-slate-800">{m.fullName || m.name || "Student"}</span>
                                    {isCaptain && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">CAPTAIN</span>}
                                  </div>
                                  <span className="text-[11px] text-slate-400">{mRegNo}</span>
                                </div>
                              </div>

                              {!isCaptain && (
                                <button
                                  onClick={() => removeMember(tId, mRegNo.toString(), m.fullName || m.name || "Student")}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                  title="Remove Member"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Team Modal */}
      {activeEditTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="type-h4 text-slate-900 mb-4">Edit Team</h2>
              <form onSubmit={handleUpdateTeam} className="space-y-3">
                <div>
                  <label className="type-form-label block text-slate-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={editTeamNameInput}
                    onChange={(e) => setEditTeamNameInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg type-body-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="type-form-label block text-slate-700 mb-1">Team Capacity</label>
                  <input
                    type="number"
                    value={editTeamSizeInput}
                    onChange={(e) => setEditTeamSizeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg type-body-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveEditTeam(null)}
                    className="px-4 py-2 text-slate-600 type-btn hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 type-btn disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {activeAddTeamId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h3 className="type-h4 text-slate-900">Add Team Members</h3>
                <button
                  onClick={() => setActiveAddTeamId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search by name or register number..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg type-caption focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {isSearchingMembers ? (
                  <div className="flex justify-center py-10">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : memberSearchResults.length === 0 ? (
                  <p className="text-center type-body-sm text-slate-400 py-10">
                    No available students found.
                  </p>
                ) : (
                  memberSearchResults.map((s: any) => {
                    const sReg = s.regNo || s.registerNumber || s.studentId || '';
                    const sName = s.fullName || s.name || 'Student';
                    const isSelected = selectedMembersToAssign.some((m: any) => (m.regNo || m.registerNumber || m.studentId) === sReg);

                    return (
                      <div
                        key={sReg}
                        onClick={() => {
                          setSelectedMembersToAssign(prev =>
                            isSelected
                              ? prev.filter((m: any) => (m.regNo || m.registerNumber || m.studentId) !== sReg)
                              : [...prev, s]
                          );
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold type-body-sm text-slate-800">{sName}</div>
                            <div className="type-caption text-slate-500">{sReg}</div>
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAddTeamId(null)}
                  className="px-4 py-2 text-slate-600 type-btn hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={isSubmitting || selectedMembersToAssign.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 type-btn disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : `Add (${selectedMembersToAssign.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {activeDeleteTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6">
            <h2 className="type-h4 text-slate-900 mb-2">Delete Team?</h2>
            <p className="type-body-sm text-slate-600 mb-6">
              This action cannot be undone. Are you sure?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setActiveDeleteTeam(null)}
                className="px-4 py-2 text-slate-600 type-btn hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 type-btn disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Captain Modal */}
      {activeChangeCaptainTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6">
            <h2 className="type-h4 text-slate-900 mb-4">Change Team Captain</h2>
            <form onSubmit={handleChangeCaptain} className="space-y-4">
              <div>
                <label className="type-form-label block text-slate-700 mb-2">Select New Captain</label>
                <select
                  value={selectedNewCaptainRegNo}
                  onChange={(e) => setSelectedNewCaptainRegNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg type-body-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="">-- Select a member --</option>
                  {(activeChangeCaptainTeam.teamMembers || activeChangeCaptainTeam.members || []).map((m: any, i: number) => (
                    <option key={i} value={m.regNo || m.studentId || ''}>
                      {m.fullName || m.name || 'Student'} ({m.regNo || m.studentId || ''})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveChangeCaptainTeam(null)}
                  className="px-4 py-2 text-slate-600 type-btn hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedNewCaptainRegNo}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 type-btn disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
