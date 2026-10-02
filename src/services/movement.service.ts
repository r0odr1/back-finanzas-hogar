import prisma from '../config/prisma';

interface GetMovementsData {
  householdId: string;
  userId: string;
  year: number;
  month: number;
}

interface CreateMovementData {
  householdId: string;
  userId: string;
  memberId: string;
  accountId: string;
  categoryId?: string | null;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string;
  occurredAt: Date;
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

export const createMovement = async (data: CreateMovementData) => {
  const requester = await prisma.householdMember.findFirst({
    where: {
      householdId: data.householdId,
      userId: data.userId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!requester) {
    throw new Error('NOT_HOUSEHOLD_MEMBER');
  }

  const [member, account, category] = await Promise.all([
    prisma.householdMember.findFirst({
      where: {
        id: data.memberId,
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
      },
    }),

    prisma.account.findFirst({
      where: {
        id: data.accountId,
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
      },
    }),

    data.categoryId
      ? prisma.category.findFirst({
          where: {
            id: data.categoryId,
            householdId: data.householdId,
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!member) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  if (!account) {
    throw new Error('ACCOUNT_NOT_FOUND');
  }

  if (data.categoryId && !category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  const movement = await prisma.movement.create({
    data: {
      householdId: data.householdId,
      memberId: data.memberId,
      accountId: data.accountId,
      categoryId: data.categoryId || null,
      type: data.type,
      source: 'APP',
      amount: data.amount,
      description: data.description.trim(),
      occurredAt: data.occurredAt,
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
  });

  return {
    ...movement,
    amount: Number(movement.amount),
  };
};