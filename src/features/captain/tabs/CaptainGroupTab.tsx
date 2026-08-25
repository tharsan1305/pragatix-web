import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { teamService } from '../../../services/teamService';
import { useAuth } from '../../../store/authContext';
import toast from 'react-hot-toast';
import { Users, Star, RefreshCw, UserX, UserPlus, UserMinus, Shield, Calendar, BookOpen, X, Search, Check, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface CaptainGroupTabProps {
  onBack?: () => void;
}

export default function CaptainGroupTab({ onBack }: CaptainGroupTabProps) {
  const { isCaptain: viewerIsCaptain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [isClassmatesLoading, setIsClassmatesLoading] = useState(false);
  const [selectedClassmates, setSelectedClassmates] = useState<any[]>([]);
  const [classmateSearchQuery, setClassmateSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pendingRegNo, setPendingRegNo] = useState<string | null>(null);
  const [isSubmittingMembers, setIsSubmittingMembers] = useState(false);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(classmateSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [classmateSearchQuery]);

  const openAddMemberModal = async () => {
    setIsAddModalOpen(true);
    setIsClassmatesLoading(true);
    setSelectedClassmates([]);
    setClassmateSearchQuery('');
    try {
      let list: any[] = [];
      try {
        const response = await teamService.getMyClassmates();
        list = response.data?.data ?? response.data ?? [];
      } catch (err1) {
        logger.warn('Failed with getMyClassmates, trying fallback /api/v1/students:', err1);
        try {
          const fallbackRes = await apiClient.get('/api/v1/students');
          list = fallbackRes.data?.data ?? fallbackRes.data ?? [];
        } catch (err2) {
          logger.warn('Fallback also failed:', err2);
        }
      }
      setClassmates(Array.isArray(list) ? list : []);
    } catch (err) {
      logger.error('Failed to fetch classmates:', err);
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

  const handleAddSelectedMembers = async () => {
    if (selectedClassmates.length === 0) {
      toast.error('Please select at least one classmate to add.');
      return;
    }

    const currentCount = teamData?.members?.length || teamData?.teamMembers?.length || 0;
    const maxCapacity = teamData?.maxTeamSize || teamData?.size || 10;
    const availableSlots = Math.max(0, maxCapacity - currentCount);

    if (availableSlots > 0 && selectedClassmates.length > availableSlots) {
      toast.error(`Cannot add ${selectedClassmates.length} members. Only ${availableSlots} slot(s) available.`);
      return;
    }

    setIsSubmittingMembers(true);
    const toastId = toast.loading(`Adding ${selectedClassmates.length} member${selectedClassmates.length > 1 ? 's' : ''}...`);

    let successCount = 0;
    const errors: string[] = [];

    for (const c of selectedClassmates) {
      const reg = c.regNo || c.studentRegNo || c.registerNumber || c.studentId || '';
      const name = c.fullName || c.studentName || c.name || reg;
      if (!reg) continue;

      try {
        const response = await teamService.addMemberByCaptain(reg);
        if (response.data?.success !== false) {
          successCount++;
        } else {
          errors.push(`${name}: ${response.data?.message || 'Failed'}`);
        }
      } catch (err: any) {
        errors.push(`${name}: ${err.response?.data?.message || 'Failed'}`);
      }
    }

    toast.dismiss(toastId);
    if (successCount > 0) {
      toast.success(`${successCount} member${successCount > 1 ? 's' : ''} added successfully!`);
      setIsAddModalOpen(false);
      setSelectedClassmates([]);
      fetchMyGroup();
    }

    if (errors.length > 0) {
      toast.error(`Issues adding some members:\n${errors.slice(0, 2).join('\n')}`);
    }

    setIsSubmittingMembers(false);
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
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-text-primary">
        <RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
        <p className="type-body-sm text-text-secondary font-medium">Loading group details...</p>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto text-text-primary">
        <div className="bg-card rounded-2xl p-10 text-center border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center">
          <div className="w-16 h-16 bg-bg border border-border text-text-muted rounded-2xl flex items-center justify-center mb-6">
            <UserX className="w-8 h-8 text-accent" />
          </div>
          <h2 className="type-h3 font-bold text-text-primary mb-2">No Team Assigned</h2>
          <p className="type-body-sm text-text-secondary max-w-md mb-6">
            You are not assigned to any group yet. Please contact your Class Coordinator for team placement.
          </p>
          <button
            onClick={fetchMyGroup}
            className="type-btn inline-flex items-center px-5 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-xl font-bold shadow-none transition cursor-pointer"
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
  const stageLabel = teamData.stage || 'STAGE 1';
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
    <div className="pb-32 text-text-primary bg-bg min-h-screen">
      {/* Top Sticky Header */}
      <div className="bg-card text-text-primary px-6 py-5 sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex justify-between items-center">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">My Group & Team Leaderboard</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Manage squad roster, track group XP, and view member rankings</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {viewerIsCaptain && (
            <button
              onClick={openAddMemberModal}
              className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-card rounded-xl type-caption font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
              title="Add Member to Team"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
          )}
          <button
            onClick={fetchMyGroup}
            className="p-2 bg-bg hover:bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Team Data"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Team Overview Card */}
        <div className="bg-card border border-border rounded-2xl p-6 text-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Squad Overview</span>
              <h2 className="type-h2 font-black text-text-primary tracking-tight mt-0.5">{teamName}</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg type-caption font-bold uppercase tracking-wider">
              {stageLabel}
            </span>
          </div>

        {/* Sub-chips */}
        <div className="flex flex-wrap gap-2 type-caption">
          <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>{department}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
            <Shield className="w-3.5 h-3.5 text-text-primary" />
            <span>Sec: {section}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span>{academicYear}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
            <span>🚪 {semester}</span>
          </span>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="flex flex-col items-center p-3.5 bg-bg rounded-xl border border-border">
            <Star className="w-5 h-5 text-accent mb-1" />
            <span className="type-h3 font-black text-text-primary">{totalTeamXp} XP</span>
            <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Total Team XP</span>
          </div>

          <div className="flex flex-col items-center p-3.5 bg-bg rounded-xl border border-border">
            <Users className="w-5 h-5 text-text-primary mb-1" />
            <span className="type-h3 font-black text-text-primary">{currentMembers} / {maxMembers}</span>
            <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Team Capacity</span>
          </div>

          <div className="flex flex-col items-center p-3.5 bg-bg rounded-xl border border-border">
            <Shield className="w-5 h-5 text-accent mb-1" />
            <span className="type-h3 font-black text-text-primary">{stageLabel}</span>
            <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Active Stage</span>
          </div>

          <div className="flex flex-col items-center p-3.5 bg-bg rounded-xl border border-border">
            <Calendar className="w-5 h-5 text-text-muted mb-1" />
            <span className="type-h3 font-black text-text-primary">95%+</span>
            <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Attendance Target</span>
          </div>
        </div>

        <div className="h-px bg-border my-2" />

        {/* Captain / Vice Captain Row */}
        <div className="grid grid-cols-2 gap-3 type-caption">
          <div className="p-3 bg-bg rounded-xl border border-border">
            <div className="text-text-muted font-bold type-fine uppercase tracking-wider mb-0.5">Captain</div>
            <div className="font-bold type-body-sm truncate text-text-primary">{captainName}</div>
          </div>
          <div className="p-3 bg-bg rounded-xl border border-border">
            <div className="text-text-muted font-bold type-fine uppercase tracking-wider mb-0.5">Vice Captain</div>
            <div className="font-bold type-body-sm truncate text-text-primary">{viceCaptainName}</div>
          </div>
        </div>
      </div>

      {/* Team Leaderboard Roster Section */}
      <div className="space-y-3">
        <h2 className="type-h4 font-bold text-text-primary">Team Leaderboard</h2>

        {teamMembers.length === 0 ? (
          <div className="bg-card p-8 rounded-2xl text-center text-text-muted border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                  className="bg-card border border-border hover:border-accent/40 rounded-xl p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {rankInTeam === 1 ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-xs">
                          🥇
                        </div>
                      ) : rankInTeam === 2 ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-xs">
                          🥈
                        </div>
                      ) : rankInTeam === 3 ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold text-xs">
                          🥉
                        </div>
                      ) : (
                        <span className="font-bold text-text-muted type-caption">{rankInTeam}</span>
                      )}
                    </div>

                    {/* Member Circle Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-bg border border-border text-text-primary font-black flex items-center justify-center type-body-sm shrink-0">
                      {name[0]?.toUpperCase() || 'S'}
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-primary type-body-sm truncate">{name}</span>
                        {isCaptain && (
                          <span className="type-fine font-bold px-2 py-0.5 rounded bg-accent-tint text-accent border border-accent/20 uppercase tracking-wider">
                            👑 CAPTAIN
                          </span>
                        )}
                        {isViceCaptain && (
                          <span className="type-fine font-bold px-2 py-0.5 rounded bg-bg text-text-secondary border border-border uppercase tracking-wider">
                            🥈 VICE CAPTAIN
                          </span>
                        )}
                      </div>

                      <div className="type-fine text-text-muted font-medium mt-0.5">
                        {memberStage}
                      </div>
                    </div>
                  </div>

                  {/* Score on Right */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <div className="flex items-center gap-1 type-caption font-bold px-2.5 py-1 rounded-lg bg-accent-tint text-accent border border-accent/20">
                      <Star className="w-3.5 h-3.5" />
                      <span>{memberXp} XP</span>
                    </div>
                    {viewerIsCaptain && !isCaptain && memberRegNo && (
                      <button
                        onClick={() => setRemovalTarget({ regNo: memberRegNo, name })}
                        disabled={pendingRegNo === memberRegNo}
                        className="p-2 text-accent hover:bg-accent-tint rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
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
      </div>

      {/* Add Member Modal with Multi-Selection */}
      {isAddModalOpen && (() => {
        const currentCount = teamData?.members?.length || teamData?.teamMembers?.length || 0;
        const maxCapacity = teamData?.maxTeamSize || teamData?.size || 10;
        const availableSlots = Math.max(0, maxCapacity - currentCount);

        const filteredClassmates = availableClassmates.filter((c: any) => {
          if (!debouncedSearchQuery.trim()) return true;
          const q = debouncedSearchQuery.toLowerCase().trim();
          const name = String(c.fullName || c.studentName || c.name || '').toLowerCase();
          const reg = String(c.regNo || c.studentRegNo || c.registerNumber || c.studentId || '').toLowerCase();
          return name.includes(q) || reg.includes(q);
        });

        const allSelected = filteredClassmates.length > 0 && filteredClassmates.every((c: any) => {
          const reg = c.regNo || c.studentRegNo || c.registerNumber || c.studentId || '';
          return selectedClassmates.some((s: any) => (s.regNo || s.studentRegNo || s.registerNumber || s.studentId) === reg);
        });

        const toggleClassmate = (c: any) => {
          const reg = c.regNo || c.studentRegNo || c.registerNumber || c.studentId || '';
          const isSelected = selectedClassmates.some((s: any) => (s.regNo || s.studentRegNo || s.registerNumber || s.studentId) === reg);
          if (isSelected) {
            setSelectedClassmates(prev => prev.filter((s: any) => (s.regNo || s.studentRegNo || s.registerNumber || s.studentId) !== reg));
          } else {
            if (availableSlots > 0 && selectedClassmates.length >= availableSlots) {
              toast.error(`Team capacity limit reached (${availableSlots} available slots).`);
              return;
            }
            setSelectedClassmates(prev => [...prev, c]);
          }
        };

        const toggleSelectAllClassmates = () => {
          if (allSelected) {
            setSelectedClassmates([]);
          } else {
            const toAdd = availableSlots > 0 ? filteredClassmates.slice(0, availableSlots) : filteredClassmates;
            if (availableSlots > 0 && filteredClassmates.length > availableSlots) {
              toast(`Selected ${availableSlots} classmate(s) to match available capacity.`, { icon: 'ℹ️' });
            }
            setSelectedClassmates(toAdd);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-text-primary/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card text-text-primary border border-border rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg text-text-primary flex items-center justify-center border border-border">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="type-h4 font-bold text-text-primary">Add Classmates to Team</h3>
                    <p className="type-caption text-text-secondary font-medium">Select one or more classmates to join your team</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Capacity Banner */}
              <div className="px-5 py-2.5 bg-bg border-b border-border flex items-center justify-between type-caption">
                <span className="font-bold text-text-primary">Capacity: {currentCount}/{maxCapacity} members</span>
                <span className={`font-bold px-2 py-0.5 rounded-md type-fine border ${availableSlots > 0 ? 'bg-success-tint text-success border-success/30' : 'bg-accent-tint text-accent border-accent/30'}`}>
                  {availableSlots > 0 ? `${availableSlots} slot${availableSlots > 1 ? 's' : ''} remaining` : 'Team Full'}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={classmateSearchQuery}
                    onChange={(e) => setClassmateSearchQuery(e.target.value)}
                    placeholder="Search classmates by name or register number..."
                    className="w-full pl-9 pr-8 py-2 bg-bg border border-border rounded-lg type-caption text-text-primary placeholder:text-text-muted focus:border-accent outline-none"
                  />
                  {classmateSearchQuery && (
                    <button
                      onClick={() => setClassmateSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Select All Toolbar */}
                {!isClassmatesLoading && filteredClassmates.length > 0 && (
                  <div className="flex items-center justify-between type-caption px-1 border-b border-border pb-2">
                    <button
                      type="button"
                      onClick={toggleSelectAllClassmates}
                      className="flex items-center gap-2 font-bold text-text-primary hover:text-accent cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${allSelected ? 'bg-accent border-accent text-card' : 'border-border bg-card'}`}>
                        {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>Select All ({filteredClassmates.length} available)</span>
                    </button>
                    <span className="font-bold text-accent bg-accent-tint border border-accent/30 px-2 py-0.5 rounded-md type-fine">
                      {selectedClassmates.length} Selected
                    </span>
                  </div>
                )}

                {/* Classmates List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                  {isClassmatesLoading ? (
                    <div className="flex justify-center py-10">
                      <RefreshCw className="w-6 h-6 animate-spin text-text-muted" />
                    </div>
                  ) : availableClassmates.length === 0 ? (
                    <p className="text-center type-body-sm text-text-muted py-10">
                      No available classmates to add.
                    </p>
                  ) : filteredClassmates.length === 0 ? (
                    <p className="text-center type-body-sm text-text-muted py-10">
                      No classmates matching "{classmateSearchQuery}".
                    </p>
                  ) : (
                    filteredClassmates.map((c: any) => {
                      const cRegNo = c.regNo || c.studentRegNo || c.registerNumber || c.studentId || '';
                      const cName = c.fullName || c.studentName || c.name || 'Student';
                      const isSelected = selectedClassmates.some((s: any) => (s.regNo || s.studentRegNo || s.registerNumber || s.studentId) === cRegNo);

                      return (
                        <div
                          key={cRegNo || cName}
                          onClick={() => toggleClassmate(c)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                              ? 'bg-accent-tint border-accent/40 shadow-xs'
                              : 'bg-card border-border hover:bg-bg'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${isSelected
                                ? 'bg-accent border-accent text-card shadow-xs'
                                : 'border-border bg-bg'
                              }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0">
                              <div className="font-bold type-body-sm text-text-primary truncate">{cName}</div>
                              <div className="type-caption text-text-muted font-medium">{cRegNo}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddMember(cRegNo, cName);
                            }}
                            disabled={pendingRegNo === cRegNo}
                            className="type-btn px-3 py-1 bg-card hover:bg-accent hover:text-card text-text-primary border border-border rounded-lg transition-colors cursor-pointer shrink-0 ml-2 font-bold"
                          >
                            {pendingRegNo === cRegNo ? 'Adding...' : 'Add Now'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="type-btn px-4 py-2 bg-bg border border-border text-text-secondary hover:text-text-primary rounded-lg cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelectedMembers}
                    disabled={isSubmittingMembers || selectedClassmates.length === 0}
                    className="type-btn px-5 py-2 bg-accent text-card rounded-lg hover:bg-accent-hover transition-colors shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    {isSubmittingMembers ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>
                          {selectedClassmates.length > 0
                            ? `Add Selected (${selectedClassmates.length})`
                            : 'Add Selected'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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
