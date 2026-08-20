export interface RecycleBinItem {
  id: number;
  entityType: 'STUDENT' | 'TEACHER' | 'FACULTY' | 'DEPARTMENT' | 'ACTIVITY' | 'TEAM' | 'USER' | string;
  entityName: string;
  deletedAt?: string;
  permanentDeleteAt?: string;
  deletedBy?: string;
}
