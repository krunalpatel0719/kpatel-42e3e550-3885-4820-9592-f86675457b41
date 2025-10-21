import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../database/entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Role, isOrgWithinScope } from '@task-management-system/auth';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    // Validate two-level hierarchy constraint
    if (dto.parentId) {
      const parent = await this.organizationRepository.findOne({
        where: { id: dto.parentId },
        relations: ['parent'],
      });

      if (!parent) {
        throw new BadRequestException('Parent organization not found');
      }

      // Prevent nesting beyond two levels
      if (parent.parent) {
        throw new BadRequestException(
          'Cannot create organization: maximum hierarchy depth is 2 levels (parent -> child only)',
        );
      }
    }

    const organization = this.organizationRepository.create({
      name: dto.name,
      parent: dto.parentId ? { id: dto.parentId } as Organization : null,
    });

    return this.organizationRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      relations: ['parent', 'children'],
    });
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(
    id: number,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findOne(id);

    // Validate two-level hierarchy if changing parent
    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        const parent = await this.organizationRepository.findOne({
          where: { id: dto.parentId },
          relations: ['parent'],
        });

        if (!parent) {
          throw new BadRequestException('Parent organization not found');
        }

        // Prevent nesting beyond two levels
        if (parent.parent) {
          throw new BadRequestException(
            'Cannot update organization: maximum hierarchy depth is 2 levels',
          );
        }

        // Prevent circular reference (org cannot be its own parent)
        if (parent.id === id) {
          throw new BadRequestException(
            'Organization cannot be its own parent',
          );
        }
      }

      organization.parent = dto.parentId
        ? ({ id: dto.parentId } as Organization)
        : null;
    }

    if (dto.name) {
      organization.name = dto.name;
    }

    return this.organizationRepository.save(organization);
  }

  async remove(id: number): Promise<void> {
    const organization = await this.findOne(id);
    await this.organizationRepository.remove(organization);
  }

  /**
   * Check if childId is a direct child of parentId
   */
  async isDirectChild(parentId: number, childId: number): Promise<boolean> {
    const child = await this.organizationRepository.findOne({
      where: { id: childId },
      relations: ['parent'],
    });

    return child?.parent?.id === parentId;
  }

  /**
   * Check if user has access to target organization based on role and hierarchy
   */
  async checkOrgAccess(
    userRole: Role,
    userOrgId: number,
    targetOrgId: number,
  ): Promise<boolean> {
    return isOrgWithinScope({
      userRole,
      userOrgId,
      targetOrgId,
      isChildOrgFn: (parentId, childId) => this.isDirectChild(parentId, childId),
    });
  }

  /**
   * Get all organizations accessible by a user based on their role and org
   */
  async getAccessibleOrgs(
    userRole: Role,
    userOrgId: number,
  ): Promise<Organization[]> {
    // Owner can see all orgs
    if (userRole === Role.OWNER) {
      return this.findAll();
    }

    // Admin can see own org and its direct children
    if (userRole === Role.ADMIN) {
      const userOrg = await this.findOne(userOrgId);
      return [userOrg, ...userOrg.children];
    }

    // Viewer can only see their own org
    const userOrg = await this.findOne(userOrgId);
    return [userOrg];
  }
}
