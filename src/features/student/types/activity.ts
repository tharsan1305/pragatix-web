export type StageStatus = 'COMPLETED' | 'ACTIVE' | 'LOCKED';

export type ActivityStatus = 'COMPLETED' | 'PENDING' | 'LOCKED';

export interface Activity {
  id: number;
  activityId?: number;
  activityName: string;
  description?: string;
  rewardXp: number;
  penaltyXp?: number;
  awardedXp?: number;
  status: ActivityStatus;
  isCompleted: boolean;
  buttonEnabled?: boolean;
  buttonText?: string;
  requestStatus?: string;
  evidenceUrl?: string;
  facultyName?: string;
  frequency?: string;
  evidence?: string[];
  manualEvidenceName?: string;
  statusPillText?: string;
  allowStudentRequest?: boolean;
  category?: string;
  xpType?: string;
}

export interface Subgroup {
  id: number;
  name: string;
  threshold: number;
  categoryXp: number;
  isPassed: boolean;
  activities: Activity[];
}

export interface Stage {
  id: number;
  name: string;
  description?: string;
  displayOrder?: number;
  stageStatus: StageStatus;
  isCompleted: boolean;
  isLocked: boolean;
  percentage: number;
  completedSubgroups: number;
  totalSubgroups: number;
  currentXp: number;
  expectedXp: number;
  subgroups: Subgroup[];
}

export interface ActivitySubmissionPayload {
  activityId: number;
  proofUrl?: string;
  remarks?: string;
}
