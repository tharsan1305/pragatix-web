export interface ActivityModel {
  id: number;
  name: string;
  description: string;
  ownerDepartment: string;
  departmentId: string;
  teacherId: string;
  ownerSubrole: string;
  evidence: string[];
  xp: string;
  type: string;
  justification: string;
  assignmentSummary: Record<string, any>[];
  xpCategory: string;
  displayOrder: number;
  status: string;
  awardXp: number;
  awardPoints?: number;
  xpReward?: number;
  awardEnabled: boolean;
  penaltyEnabled: boolean;
  penaltyXp: number;
  penaltyPoints?: number;
  awardType: string;
  cap: number;
  maxCap?: number;
  awardFrequency: string;
  frequency?: string;
  awardDays: string[];
  xpType: string;
  activityType?: string;
  assignmentMode: string;
  allowStudentRequest?: boolean;
  streakEnabled?: boolean;
  subgroup?: string | Record<string, any>;
  subgroupId?: number;
  stageId?: number;
}


export interface ExecutionStudentModel {
  id: number;
  fullName: string;
  studentId: string;
  regNo: number;
  departmentName: string;
  sectionName: string;
  totalXp: number;
  score: number;
}

export interface ActivityExecutionDetailModel {
  id: number;
  name: string;
  description: string;
  department: string;
  evidence: string[];
  frequency: string;
  type: string;
  awardEnabled: boolean;
  awardXp: number;
  penaltyEnabled: boolean;
  penaltyXp: number;
  xpCategory: string;
  cap: number;
}

export interface AssignmentExecutionDetailModel {
  id: number;
  assignedBy: string;
  assignedAt: string;
  assignedFacultyName: string;
  assignmentMode: string;
}

export interface MyActivityStudentsResponseModel {
  activity: ActivityExecutionDetailModel;
  students: ExecutionStudentModel[];
  xpLimit: number;
  assignment: AssignmentExecutionDetailModel;
}

export interface Team {
  id: number;
  name: string;
  teacherId: string;
  departmentName: string;
  sectionName: string;
  year: number;
  captainId: string;
  members: any[];
}

export interface ActivityOptionModel {
  id: number;
  name: string;
  description: string;
  awardXp: number;
  awardFrequency: string;
  type: string;
}

export interface GroupedActivityModel {
  subgroup: string;
  activities: ActivityOptionModel[];
}

