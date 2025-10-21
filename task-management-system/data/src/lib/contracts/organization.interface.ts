export interface IOrganization {
  id: number;
  name: string;
  parentId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganizationDto {
  name: string;
  parentId?: number | null;
}

export interface IUpdateOrganizationDto {
  name?: string;
  parentId?: number | null;
}
