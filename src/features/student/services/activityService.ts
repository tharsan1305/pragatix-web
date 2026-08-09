import apiClient from '../../../services/apiClient';
import type { Stage, StageStatus, ActivityStatus, Subgroup, Activity } from '../types/activity';

export class ActivityService {
  /**
   * Fetch all student stages enriched with progress, thresholds, and activity statuses.
   * Uses GET /api/v1/students/stages (Flutter source of truth).
   */
  static async fetchStudentStages(): Promise<Stage[]> {
    let rawStages: any[] = [];

    try {
      const res = await apiClient.get('/api/v1/students/stages');
      if (res.data && (res.data.success || Array.isArray(res.data))) {
        rawStages = Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
    } catch (e) {
      console.warn('Student stages endpoint fallback to admin stages:', e);
      const adminRes = await apiClient.get('/api/v1/admin/stages');
      if (adminRes.data && adminRes.data.success) {
        rawStages = adminRes.data.data || [];
      }
    }

    const stages: Stage[] = [];

    for (const st of rawStages) {
      const rawSubgroups = st.subgroups || [];
      const subgroups: Subgroup[] = [];

      for (const sub of rawSubgroups) {
        const subId = Number(sub.id);
        let activitiesList = sub.activities || [];

        if (!activitiesList || activitiesList.length === 0) {
          try {
            const actRes = await apiClient.get(`/api/v1/students/subgroups/${subId}/activities`);
            if (actRes.data && actRes.data.success) {
              activitiesList = actRes.data.data || [];
            }
          } catch (err) {
            console.error(`Failed to fetch activities for subgroup ${subId}`, err);
          }
        }

        let categoryXp = 0;
        const activities: Activity[] = activitiesList.map((act: any) => {
          const rewardXp = parseInt(act.rewardXp || act.xp || act.xpReward || "0", 10) || 0;
          const awardedXp = (act.awardedXp !== undefined && act.awardedXp !== null) 
            ? (parseInt(act.awardedXp, 10) || 0) 
            : 0;
          const status: ActivityStatus = act.status === 'COMPLETED' || act.isDone 
            ? 'COMPLETED' 
            : (act.status === 'LOCKED' ? 'LOCKED' : 'PENDING');
          const isCompleted = status === 'COMPLETED';

          if (isCompleted) {
            categoryXp += awardedXp;
          }

          const rawEv = act.evidence || act.requiredEvidence;
          const evidenceArr = Array.isArray(rawEv)
            ? rawEv.map(e => String(e))
            : (rawEv ? [String(rawEv)] : []);

          return {
            id: Number(act.id || 0),
            activityName: act.activityName || act.name || 'Activity',
            description: act.description || act.activityDescription || '',
            rewardXp,
            awardedXp,
            status,
            isCompleted,
            buttonEnabled: act.buttonEnabled !== false,
            buttonText: act.buttonText || 'Request Completion',
            requestStatus: act.requestStatus || (isCompleted ? 'APPROVED' : 'NONE'),
            evidenceUrl: act.evidenceUrl || act.proofUrl || '',
            facultyName: act.facultyName || act.faculty || act.owner || act.creatorName || '',
            frequency: act.frequency || act.activityFrequency || '',
            evidence: evidenceArr,
            statusPillText: act.statusPillText || act.status || (isCompleted ? 'COMPLETED' : 'NOT_STARTED'),
            allowStudentRequest: act.allowStudentRequest === true || act.allowRequest === true || act.canRequest === true,
          };
        });

        const threshold = Number(sub.threshold || 0);
        const isPassed = categoryXp >= threshold && threshold > 0;

        subgroups.push({
          id: subId,
          name: sub.name || 'Category',
          threshold,
          categoryXp,
          isPassed,
          activities,
        });
      }

      const stageStatus: StageStatus = st.stageStatus 
        || (st.isCompleted ? 'COMPLETED' : (st.isLocked ? 'LOCKED' : 'ACTIVE'));
      const isCompleted = stageStatus === 'COMPLETED' || st.isCompleted === true;
      const isLocked = stageStatus === 'LOCKED' || st.isLocked === true;
      const percentage = st.overallPercentage !== undefined 
        ? Number(st.overallPercentage) 
        : (isCompleted ? 100 : 0);
      
      const completedSubgroups = st.overallCompletedSubgroups !== undefined 
        ? Number(st.overallCompletedSubgroups) 
        : subgroups.filter(s => s.isPassed).length;
      
      const totalSubgroups = st.overallTotalSubgroups !== undefined 
        ? Number(st.overallTotalSubgroups) 
        : subgroups.length;

      const currentXp = st.currentXp !== undefined 
        ? Number(st.currentXp) 
        : ((Number(st.studentMustXp) || 0) + (Number(st.studentIndividualXp) || 0) + (Number(st.studentGroupXp) || 0));
      
      const expectedXp = Number(st.expectedXp || st.xpTarget || 0);

      stages.push({
        id: Number(st.id),
        name: st.name || 'Stage',
        description: st.description || '',
        displayOrder: Number(st.displayOrder || st.id),
        stageStatus,
        isCompleted,
        isLocked,
        percentage,
        completedSubgroups,
        totalSubgroups,
        currentXp,
        expectedXp,
        subgroups,
      });
    }

    stages.sort((a, b) => (a.displayOrder || a.id) - (b.displayOrder || b.id));
    return stages;
  }

  /**
   * Submit activity completion proof.
   */
  static async submitActivityCompletion(activityId: number, proofUrl?: string, remarks?: string): Promise<boolean> {
    try {
      // Correct backend endpoint: POST /api/activity-requests
      const res = await apiClient.post('/api/activity-requests', {
        activityId,
        proofUrl,
        remarks,
      });
      return res.data?.success === true || res.status === 200 || res.status === 201;
    } catch (e) {
      console.error(`Failed to submit completion for activity ${activityId}:`, e);
      return false;
    }
  }
}
