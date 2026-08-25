import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { Users, RefreshCw, UserX, Calendar, BookOpen, Trophy, Star, Award, Shield } from 'lucide-react';

export default function StudentGroupTab() {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);

  const fetchMyTeam = async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/teams/my-team/details');
      } catch {
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
    fetchMyTeam();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-text-primary">
        <RefreshCw className="w-8 h-8 text-text-primary animate-spin mb-4" />
        <p className="text-text-secondary font-medium type-body-sm">Loading team details...</p>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-text-primary">
        <div className="bg-card rounded-lg p-10 text-center border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col items-center">
          <div className="w-16 h-16 bg-bg border border-border text-text-muted rounded-full flex items-center justify-center mb-6">
            <UserX className="w-8 h-8" />
          </div>
          <h2 className="type-h3 font-bold text-text-primary mb-2">No Team Assigned</h2>
          <p className="text-text-secondary max-w-md mb-6 type-body-sm">
            You are not assigned to any group yet. Please contact your Class Coordinator for team placement.
          </p>
          <button
            onClick={fetchMyTeam}
            className="inline-flex items-center type-btn px-5 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg font-semibold shadow-none transition cursor-pointer"
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
    <div className="bg-bg min-h-screen pb-24 text-text-primary">
      {/* Sticky Page Header */}
      <div className="bg-card text-text-primary sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">My Group</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">View your team details and member standings</p>
          </div>
          <button
            onClick={fetchMyTeam}
            className="p-2 bg-bg hover:bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Team"
          >
            <RefreshCw className="w-4 h-4" />
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

          {/* Info Chips */}
          <div className="flex flex-wrap gap-2 type-caption">
            <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>{department}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
              <Shield className="w-3.5 h-3.5 text-accent" />
              Sec: {section}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              {academicYear}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-bg border border-border text-text-secondary px-3 py-1 rounded-lg font-bold">
              🚪 {semester}
            </span>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg border border-border rounded-xl p-4 flex flex-col items-center">
              <Star className="w-5 h-5 text-accent mb-1.5" />
              <span className="text-2xl font-black text-text-primary">{totalTeamXp} XP</span>
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-0.5">TOTAL TEAM XP</span>
            </div>
            <div className="bg-bg border border-border rounded-xl p-4 flex flex-col items-center">
              <Users className="w-5 h-5 text-text-secondary mb-1.5" />
              <span className="text-2xl font-black text-text-primary">{currentMembers} / {maxMembers}</span>
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-0.5">TEAM CAPACITY</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Captain / Vice Captain Info */}
          <div className="grid grid-cols-2 gap-4 type-caption">
            <div className="bg-bg border border-border rounded-xl p-3">
              <div className="text-text-muted font-bold uppercase tracking-wider text-[11px] mb-1">CAPTAIN</div>
              <div className="font-bold type-body-sm truncate text-text-primary">{captainName}</div>
            </div>
            <div className="bg-bg border border-border rounded-xl p-3">
              <div className="text-text-muted font-bold uppercase tracking-wider text-[11px] mb-1">VICE CAPTAIN</div>
              <div className="font-bold type-body-sm truncate text-accent">{viceCaptainName}</div>
            </div>
          </div>
        </div>

        {/* Team Leaderboard Roster Section */}
        <div className="space-y-3">
          <h2 className="type-h4 font-bold text-text-primary">Team Leaderboard</h2>

          {teamMembers.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl text-center text-text-muted border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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

                return (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {rankInTeam === 1 ? (
                          <Trophy className="w-5 h-5 text-accent" />
                        ) : rankInTeam === 2 ? (
                          <Award className="w-5 h-5 text-text-secondary" />
                        ) : (
                          <span className="font-bold text-text-muted type-body-sm">{rankInTeam}</span>
                        )}
                      </div>

                      {/* Member Avatar */}
                      <div className="w-10 h-10 rounded-full bg-accent-tint border border-accent/20 text-accent font-black flex items-center justify-center type-body-sm shrink-0">
                        {name[0]?.toUpperCase() || 'S'}
                      </div>

                      {/* Member Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-text-primary type-body-sm truncate">{name}</span>
                          {isCaptain && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-accent-tint text-accent border border-accent/30 uppercase tracking-wider">
                              👑 CAPTAIN
                            </span>
                          )}
                          {isViceCaptain && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-bg text-text-secondary border border-border uppercase tracking-wider">
                              🥈 VICE CAPTAIN
                            </span>
                          )}
                        </div>

                        <div className="type-caption text-text-muted font-medium mt-0.5">
                          {memberStage}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 type-body-sm font-bold text-text-secondary shrink-0 ml-3">
                      <Star className="w-4 h-4 text-accent" />
                      <span>{memberXp} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
