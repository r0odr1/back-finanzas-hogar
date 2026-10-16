import prisma from '../config/prisma';

interface GetMovementsData {
  householdId: string;
  userId: string;
  year: number;
  month: number;
  type?: 'EXPENSE' | 'INCOME';
  memberId?: string;
  accountId?: string;
  categoryId?: string;
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

interface UpdateMovementData {
  householdId: string;
  movementId: string;
  userId: string;
  memberId: string;
  accountId: string;
  categoryId?: string | null;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string;
  occurredAt: Date;
}

interface DeleteMovementData {
  householdId: string;
  movementId: string;
  userId: string;
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
      ...(data.type ? { type: data.type } : {}),
      ...(data.memberId ? { memberId: data.memberId } : {}),
      ...(data.accountId ? { accountId: data.accountId } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
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

export const updateMovement = async (data: UpdateMovementData) => {
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

  const currentMovement = await prisma.movement.findFirst({
    where: {
      id: data.movementId,
      householdId: data.householdId,
      deletedAt: null,
    },
    select: {
      id: true,
      memberId: true,
      accountId: true,
      categoryId: true,
      type: true,
      amount: true,
      description: true,
      occurredAt: true,
    },
  });

  if (!currentMovement) {
    throw new Error('MOVEMENT_NOT_FOUND');
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

  return prisma.$transaction(async (tx) => {
    const movement = await tx.movement.update({
      where: {
        id: data.movementId,
      },
      data: {
        memberId: data.memberId,
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        type: data.type,
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

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'UPDATE',
        entity: 'Movement',
        entityId: data.movementId,
        beforeData: {
          memberId: currentMovement.memberId,
          accountId: currentMovement.accountId,
          categoryId: currentMovement.categoryId,
          type: currentMovement.type,
          amount: Number(currentMovement.amount),
          description: currentMovement.description,
          occurredAt: currentMovement.occurredAt.toISOString(),
        },
        afterData: {
          memberId: data.memberId,
          accountId: data.accountId,
          categoryId: data.categoryId || null,
          type: data.type,
          amount: data.amount,
          description: data.description.trim(),
          occurredAt: data.occurredAt.toISOString(),
        },
      },
    });

    return {
      ...movement,
      amount: Number(movement.amount),
    };
  });
};

export const deleteMovement = async (data: DeleteMovementData) => {
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

  const currentMovement = await prisma.movement.findFirst({
    where: {
      id: data.movementId,
      householdId: data.householdId,
      deletedAt: null,
    },
    select: {
      id: true,
      memberId: true,
      accountId: true,
      categoryId: true,
      type: true,
      source: true,
      amount: true,
      description: true,
      occurredAt: true,
    },
  });

  if (!currentMovement) {
    throw new Error('MOVEMENT_NOT_FOUND');
  }

  const deletedAt = new Date();

  return prisma.$transaction(async (tx) => {
    const movement = await tx.movement.update({
      where: {
        id: data.movementId,
      },
      data: {
        deletedAt,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'DELETE',
        entity: 'Movement',
        entityId: data.movementId,
        beforeData: {
          memberId: currentMovement.memberId,
          accountId: currentMovement.accountId,
          categoryId: currentMovement.categoryId,
          type: currentMovement.type,
          source: currentMovement.source,
          amount: Number(currentMovement.amount),
          description: currentMovement.description,
          occurredAt: currentMovement.occurredAt.toISOString(),
          deletedAt: null,
        },
        afterData: {
          deletedAt: deletedAt.toISOString(),
        },
      },
    });

    return movement;
  });
};