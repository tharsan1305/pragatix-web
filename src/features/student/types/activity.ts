export type StageStatus = 'COMPLETED' | 'ACTIVE' | 'LOCKED';

export type ActivityStatus = 'COMPLETED' | 'PENDING' | 'LOCKED';

export interface Activity {
  id: number;
  activityName: string;
  description?: string;
  rewardXp: number;
  awardedXp?: number;
  status: ActivityStatus;
  isCompleted: boolean;
  buttonEnabled?: boolean;
  buttonText?: string;
  requestStatus?: string;
  evidenceUrl?: string;
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
