import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db, eq } from '@marcx/db';
import { company, companyMember } from '@marcx/db/schema';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompanyService {
  async create(createCompanyDto: CreateCompanyDto) {
    const [newCompany] = await db
      .insert(company)
      .values(createCompanyDto)
      .returning();

    return newCompany;
  }

  async register(createCompanyDto: CreateCompanyDto, userId: string) {
    // Create the company
    const [newCompany] = await db
      .insert(company)
      .values(createCompanyDto)
      .returning();

    // Create CompanyMember record linking the user as OWNER
    const [membership] = await db
      .insert(companyMember)
      .values({ userId, companyId: newCompany.id, role: 'OWNER' })
      .returning();

    return {
      company: newCompany,
      user: {
        companyId: membership.companyId,
        role: membership.role,
      },
    };
  }

  async findAll() {
    return await db.query.company.findMany({
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const foundCompany = await db.query.company.findFirst({
      where: eq(company.id, id),
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
              },
            },
          },
        },
        sessions: {
          limit: 10,
          orderBy: (session, { desc }) => [desc(session.createdAt)],
        },
      },
    });

    if (!foundCompany) {
      throw new NotFoundException('Company not found');
    }

    return foundCompany;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
    userRole: string,
  ) {
    // Verify company exists
    const existingCompany = await db.query.company.findFirst({
      where: eq(company.id, id),
      with: {
        members: {
          where: (member, { eq }) => eq(member.userId, userId),
        },
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Company not found');
    }

    // Only ADMIN or COMPANY_OWNER can update
    if (userRole !== 'ADMIN' && userRole !== 'COMPANY_OWNER') {
      throw new ForbiddenException(
        'Only admins and company owners can update company details',
      );
    }

    const [updatedCompany] = await db
      .update(company)
      .set({
        ...updateCompanyDto,
        updatedAt: new Date(),
      })
      .where(eq(company.id, id))
      .returning();

    return updatedCompany;
  }

  async remove(id: string, userId: string, userRole: string) {
    // Verify company exists
    const existingCompany = await db.query.company.findFirst({
      where: eq(company.id, id),
    });

    if (!existingCompany) {
      throw new NotFoundException('Company not found');
    }

    // Only ADMIN can delete companies
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete companies');
    }

    await db.delete(company).where(eq(company.id, id));

    return { message: 'Company deleted successfully' };
  }

  async getCompanyUsers(id: string) {
    const foundCompany = await db.query.company.findFirst({
      where: eq(company.id, id),
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!foundCompany) {
      throw new NotFoundException('Company not found');
    }

    return foundCompany.members.map((m) => ({ ...m.user, role: m.role }));
  }

  async getCompanySessions(id: string) {
    const foundCompany = await db.query.company.findFirst({
      where: eq(company.id, id),
      with: {
        sessions: {
          with: {
            creator: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: (session, { desc }) => [desc(session.createdAt)],
        },
      },
    });

    if (!foundCompany) {
      throw new NotFoundException('Company not found');
    }

    return foundCompany.sessions;
  }
}
