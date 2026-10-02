import prisma from '../config/prisma';

interface GetMovementsData {
  householdId: string;
  userId: string;
  year: number;
  month: number;
}

export const getMovements = async (data: GetMovementsData) => {
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

  const startDate = new Date(Date.UTC(data.year, data.month - 1, 1));
  const endDate = new Date(Date.UTC(data.year, data.month, 1));

  const movements = await prisma.movement.findMany({
    where: {
      householdId: data.householdId,
      deletedAt: null,
      occurredAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      id: true,
      type: true,
      source: true,
      amount: true,
      description: true,
      occurredAt: true,
      createdAt: true,
      member: {
        select: {
          id: true,
          displayName: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        occurredAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });

  return movements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    source: movement.source,
    amount: Number(movement.amount),
    description: movement.description,
    occurredAt: movement.occurredAt,
    createdAt: movement.createdAt,
    member: movement.member,
    account: movement.account,
    category: movement.category,
  }));
};