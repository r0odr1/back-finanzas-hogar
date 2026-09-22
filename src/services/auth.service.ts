import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

interface LoginData {
  email: string;
  password: string;
}

export const authenticateUser = async (data: LoginData) => {
  const email = data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const passwordIsValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordIsValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
  };
};