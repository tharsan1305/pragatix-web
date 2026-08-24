import { logger } from '../../../../utils/logger';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Award, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../../services/apiClient';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';

interface Props {
  activityId?: number;
  assignmentId?: number;
  onBack?: () => void;
}

export default function GroupActivityExecutionPage({ activityId: propActivityId, assignmentId: propAssignmentId, onBack: propOnBack }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activityId = propActivityId || (params.activityId ? Number(params.activityId) : undefined);
  const assignmentId = propAssignmentId || (params.assignmentId ? Number(params.assignmentId) : undefined);

  const { year, dept, section } = location.state || {};
  const handleBack = propOnBack || (() => navigate(-1));

  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(assignmentId || null);

  const [scoringTeam, setScoringTeam] = useState<any>(null);
  const [xpValue, setXpValue] = useState<number>(10);
  const [remarks, setRemarks] = useState<string>('');
  const [isEqualDistribution, setIsEqualDistribution] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmAwardXp, setConfirmAwardXp] = useState<any>(null);

  useEffect(() => {
    if (activeAssignmentId) {
      fetchTeamsForAssignment(activeAssignmentId);
    } else if (activityId) {
      fetchAssignmentAndTeams(activityId);
    } else {
      setIsLoading(false);
    }
  }, [activityId, activeAssignmentId]);

  const fetchAssignmentAndTeams = async (actId: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/activities/${actId}`);
      if (res.data?.success && res.data.data?.assignments?.length > 0) {
        const assId = res.data.data.assignments[0].id;
        setActiveAssignmentId(assId);
        await fetchTeamsForAssignment(assId);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      logger.error("Failed to fetch assignment:", e);
      setIsLoading(false);
    }
  };

  const fetchTeamsForAssignment = async (assId: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/group-activities/assignments/${assId}/teams`);
      if (res.data?.success) {
        setTeams(res.data.data || []);
      }
    } catch (e) {
      logger.error("Failed to fetch teams:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardXpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringTeam || !activeAssignmentId) return;

    setConfirmAwardXp({
      team: scoringTeam,
      xp: Number(xpValue),
      remarks: remarks.trim(),
      isEqual: isEqualDistribution
    });
  };

  const handleConfirmAwardXp = async () => {
    if (!confirmAwardXp || !activeAssignmentId) return;

    setIsSubmitting(true);
    const toastId = toast.loading(`Awarding XP to ${confirmAwardXp.team.name || 'team'}...`);
    try {
      const payload = {
        assignmentId: activeAssignmentId,
        equalDistribution: confirmAwardXp.isEqual,
        xp: confirmAwardXp.xp,
        remarks: confirmAwardXp.remarks
      };

      const res = await apiClient.post(`/api/v1/group-activities/teams/${confirmAwardXp.team.id}/award-xp`, payload);
      toast.dismiss(toastId);
      if (res.status === 200 || res.data?.success) {
        toast.success('XP awarded to team successfully!');
        setScoringTeam(null);
        setRemarks('');
        setConfirmAwardXp(null);
        if (activeAssignmentId) {
          fetchTeamsForAssignment(activeAssignmentId);
        }
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error("Failed to award XP:", e);
      toast.error(e.response?.data?.message || 'Failed to award XP to team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="type-h3">Group Activity Execution</h1>
            <p className="type-caption text-slate-400 mt-0.5">
              Evaluate groups, award XP points
              {year?.yearName ? ` • ${year.yearName}` : ''}
              {dept?.deptName || dept?.name ? ` • ${dept.deptName || dept.name}` : ''}
              {section?.sectionName || section?.name ? ` • Sec ${section.sectionName || section.name}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No teams found for this activity assignment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold type-h5 border border-indigo-200/60 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="type-h5 text-slate-900">{t.name || t.teamName || 'Group Team'}</h3>
                      <p className="type-caption text-slate-500 font-medium">Captain: <span className="font-semibold text-slate-700">{t.captainName || 'Not Assigned'}</span> ({t.captainRegNo || t.captainId || 'N/A'})</p>
                      <p className="type-fine text-slate-400 mt-0.5">Total Members: {t.size || t.members?.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    {t.isAwarded ? (
                      <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-semibold type-caption border border-slate-200 cursor-not-allowed">
                        XP Already Awarded
                      </span>
                    ) : (
                      <button
                        onClick={() => setScoringTeam(t)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl type-btn transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>Award XP</span>
                      </button>
                    )}
                  </div>
                </div>

                {t.members && t.members.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="type-caption font-bold text-slate-500 uppercase tracking-wider mb-2">Group Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {t.members.map((m: any, idx: number) => (
                        <span key={m.id || idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 type-caption rounded-lg border border-slate-200">
                          {m.fullName || m.studentName} ({m.regNo || m.registerNumber})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Modal */}
      {scoringTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-indigo-600" />
              <h3 className="type-h4 text-slate-900">Award XP to {scoringTeam.name}</h3>
            </div>

            <form onSubmit={handleAwardXpSubmit} className="space-y-4">
              <div>
                <label className="type-form-label text-slate-600 mb-1 block">XP Points *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={xpValue}
                  onChange={e => setXpValue(Number(e.target.value))}
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 type-body-sm bg-white"
                />
              </div>

              <div>
                <label className="type-form-label text-slate-600 mb-1 block">Remarks / Comments</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter remarks for group activity evaluation..."
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 type-body-sm bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="type-caption text-slate-700">Equal Distribution to Members</span>
                <label className="relative inline-flex items-center cursor-pointer type-form-label">
                  <input
                    type="checkbox"
                    checked={isEqualDistribution}
                    onChange={e => setIsEqualDistribution(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScoringTeam(null)}
                  className="px-4 py-2 text-slate-600 type-btn hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-semibold type-btn hover:bg-indigo-700 rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <span>Confirm Award</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAwardXp && (
        <ConfirmationModal
          isOpen={!!confirmAwardXp}
          title="Confirm XP Award"
          description={`Award ${confirmAwardXp.xp} XP to ${confirmAwardXp.team.name}?${confirmAwardXp.remarks ? ` Remarks: ${confirmAwardXp.remarks}` : ''}`}
          confirmText="Award XP"
          onConfirm={handleConfirmAwardXp}
          onCancel={() => setConfirmAwardXp(null)}
          isDangerous={false}
        />
      )}
    </div>
  );
}
