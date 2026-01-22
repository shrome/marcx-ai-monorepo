import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../db';
import { eq } from '@marcx/db';
import { company } from '@marcx/db/schema';
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

  async findAll() {
    return await db.query.company.findMany({
      with: {
        users: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const foundCompany = await db.query.company.findFirst({
      where: eq(company.id, id),
      with: {
        users: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
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
        users: {
          where: (user, { eq }) => eq(user.id, userId),
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
        users: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    if (!foundCompany) {
      throw new NotFoundException('Company not found');
    }

    return foundCompany.users;
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
