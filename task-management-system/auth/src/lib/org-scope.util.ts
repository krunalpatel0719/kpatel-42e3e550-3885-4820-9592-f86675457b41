import { Role } from './roles.decorator';

export interface OrgScopeCheckParams {
  userRole: Role;
  userOrgId: number;
  targetOrgId: number;
  isChildOrgFn?: (parentId: number, childId: number) => Promise<boolean> | boolean;
}

/**
 * Checks if a user has access to a target organization based on their role and org hierarchy
 * @param params - Parameters for org scope checking
 * @returns Promise<boolean> or boolean - true if user has access to target org
 */
export async function isOrgWithinScope(
  params: OrgScopeCheckParams
): Promise<boolean> {
  const { userRole, userOrgId, targetOrgId, isChildOrgFn } = params;

  if (userRole === Role.OWNER) {
    return true;
  }

  if (userRole === Role.ADMIN) {
    if (targetOrgId === userOrgId) {
      return true;
    }

    if (isChildOrgFn) {
      const isChild = await isChildOrgFn(userOrgId, targetOrgId);
      return isChild;
    }

    return false;
  }

  if (userRole === Role.VIEWER) {
    return targetOrgId === userOrgId;
  }

  return false;
}

