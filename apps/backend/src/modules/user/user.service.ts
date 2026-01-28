import { Injectable, NotFoundException } from '@nestjs/common';

import { db, eq } from '@marcx/db';
import { user } from '@marcx/db/schema';

@Injectable()
export class UserService {
  /**
   * Get user by ID with all related data
   */
  async findOne(id: string) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, id),
      with: {
        company: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    return foundUser;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
      with: {
        company: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    return foundUser;
  }

  /**
   * Update user profile
   */
  async update(id: string, updateData: { name?: string; image?: string }) {
    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }
}
