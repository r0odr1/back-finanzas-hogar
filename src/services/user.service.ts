import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export const createUser = async (data: CreateUserData) => {
  const email = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() || null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
    },
  });
};