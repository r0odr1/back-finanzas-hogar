import prisma from '../config/prisma';

interface CreateHouseholdData {
  userId: string;
  name: string;
}

export const createHousehold = async (data: CreateHouseholdData) => {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new Error('USER_NOT_FOUND');
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: {
        name: data.name.trim(),
      },
    });

    await tx.householdMember.create({
      data: {
        householdId: household.id,
        userId: user.id,
        displayName,
        role: 'OWNER',
      },
    });

    return household;
  });
};

export const getUserHouseholds = async (userId: string) => {
  return prisma.household.findMany({
    where: {
      members: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      members: {
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          displayName: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};