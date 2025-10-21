import { isOrgWithinScope } from './org-scope.util';
import { Role } from './roles.decorator';

describe('isOrgWithinScope', () => {
  it('should allow OWNER to access any organization', async () => {
    const result = await isOrgWithinScope({
      userRole: Role.OWNER,
      userOrgId: 1,
      targetOrgId: 999,
    });

    expect(result).toBe(true);
  });

  it('should allow ADMIN to access their own org', async () => {
    const result = await isOrgWithinScope({
      userRole: Role.ADMIN,
      userOrgId: 1,
      targetOrgId: 1,
    });

    expect(result).toBe(true);
  });

  it('should allow ADMIN to access child org', async () => {
    const isChildOrgFn = jest.fn().mockResolvedValue(true);

    const result = await isOrgWithinScope({
      userRole: Role.ADMIN,
      userOrgId: 1,
      targetOrgId: 2,
      isChildOrgFn,
    });

    expect(result).toBe(true);
    expect(isChildOrgFn).toHaveBeenCalledWith(1, 2);
  });

  it('should deny ADMIN access to unrelated org', async () => {
    const isChildOrgFn = jest.fn().mockResolvedValue(false);

    const result = await isOrgWithinScope({
      userRole: Role.ADMIN,
      userOrgId: 1,
      targetOrgId: 3,
      isChildOrgFn,
    });

    expect(result).toBe(false);
  });

  it('should allow VIEWER to access only their own org', async () => {
    const result = await isOrgWithinScope({
      userRole: Role.VIEWER,
      userOrgId: 1,
      targetOrgId: 1,
    });

    expect(result).toBe(true);
  });

  it('should deny VIEWER access to other orgs', async () => {
    const result = await isOrgWithinScope({
      userRole: Role.VIEWER,
      userOrgId: 1,
      targetOrgId: 2,
    });

    expect(result).toBe(false);
  });
});
