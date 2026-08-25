export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'HOD';

export interface RoleConfig {
  navItems: string[];              // which sidebar items are visible
  dataScope: 'institution' | 'year' | 'department';
  canManageAdmins: boolean;
  canViewAllDepartments: boolean;
  canApproveRequests: boolean;
  roleDisplayName: string;
  portalTitle: string;
}

export const ROLE_ACCESS: Record<Role, RoleConfig> = {
  SUPER_ADMIN: {
    navItems: ['overview', 'activity', 'attendance', 'groups', 'requests', 'admins', 'leaderboard', 'profile'],
    dataScope: 'institution',
    canManageAdmins: true,
    canViewAllDepartments: true,
    canApproveRequests: true,
    roleDisplayName: 'Super Admin',
    portalTitle: 'Super Admin Portal',
  },
  ADMIN: {
    navItems: ['overview', 'activity', 'attendance', 'groups', 'requests', 'leaderboard', 'profile'], // no "admins" tab
    dataScope: 'year',
    canManageAdmins: false,
    canViewAllDepartments: true,
    canApproveRequests: true,
    roleDisplayName: 'Year Admin',
    portalTitle: 'Admin Portal',
  },
  HOD: {
    navItems: ['overview', 'activity', 'attendance', 'groups', 'requests', 'leaderboard', 'profile'],
    dataScope: 'department',
    canManageAdmins: false,
    canViewAllDepartments: false,
    canApproveRequests: true,
    roleDisplayName: 'Head of Department (HOD)',
    portalTitle: 'HOD Portal',
  },
};

export function getEffectiveRole(
  user: any,
  auth: {
    isSuperAdmin?: boolean;
    isHOD?: boolean;
    isAdmin?: boolean;
    role?: string | null;
    subRoles?: string[];
  }
): Role {
  if (
    auth.isSuperAdmin ||
    user?.isSuperAdmin === true ||
    (user?.roles && (user.roles.includes('ROLE_SUPERADMIN') || user.roles.includes('SUPER_ADMIN') || user.roles.includes('SUPERADMIN') || user.roles.includes('ROLE_SUPER_ADMIN'))) ||
    user?.userType === 'SUPER_ADMIN' ||
    user?.userType === 'SUPERADMIN' ||
    auth.role === 'SUPER_ADMIN' ||
    auth.role === 'SUPERADMIN'
  ) {
    return 'SUPER_ADMIN';
  }

  if (
    auth.isHOD ||
    (auth.subRoles && auth.subRoles.includes('HOD')) ||
    (user?.subRoles && user.subRoles.includes('HOD')) ||
    user?.role === 'HOD' ||
    (user?.roles && (user.roles.includes('ROLE_HOD') || user.roles.includes('HOD'))) ||
    user?.userType === 'HOD'
  ) {
    return 'HOD';
  }

  return 'ADMIN';
}
