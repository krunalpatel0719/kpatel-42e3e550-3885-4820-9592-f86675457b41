export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer',
}

export interface IUser {
  id: number;
  email: string;
  role: UserRole;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserDto {
  email: string;
  password: string;
  role: UserRole;
  organizationId: number;
}

export interface IUpdateUserDto {
  email?: string;
  role?: UserRole;
  organizationId?: number;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  user: IUser;
}
