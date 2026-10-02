import prisma from '../config/prisma';

interface GetMovementCatalogsData {
  householdId: string;
  userId: string;
}

export const getMovementCatalogs = async (data: GetMovementCatalogsData) => {
  const membership = await prisma.householdMember.findFirst({
    where: {
      householdId: data.householdId,
      userId: data.userId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new Error('NOT_HOUSEHOLD_MEMBER');
  }

  const [members, accounts, categories] = await Promise.all([
    prisma.householdMember.findMany({
      where: {
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),

    prisma.account.findMany({
      where: {
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),

    prisma.category.findMany({
      where: {
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  return {
    members,
    accounts,
    categories,
  };
};