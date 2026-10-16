import prisma from '../config/prisma';

interface GetBudgetsData {
  householdId: string;
  userId: string;
  year: number;
  month: number;
}

interface CreateBudgetData {
  householdId: string;
  userId: string;
  memberId?: string | null;
  categoryId: string;
  scope: 'HOUSEHOLD' | 'MEMBER';
  year: number;
  month: number;
  amount: number;
}

interface UpdateBudgetData {
  householdId: string;
  budgetId: string;
  userId: string;
  memberId?: string | null;
  categoryId: string;
  scope: 'HOUSEHOLD' | 'MEMBER';
  amount: number;
}

interface DeleteBudgetData {
  householdId: string;
  budgetId: string;
  userId: string;
}

export const getBudgets = async (data: GetBudgetsData) => {
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

  const budgets = await prisma.budget.findMany({
    where: {
      householdId: data.householdId,
      year: data.year,
      month: data.month,
    },
    select: {
      id: true,
      scope: true,
      year: true,
      month: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      member: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
    orderBy: [
      {
        category: {
          name: 'asc',
        },
      },
      {
        member: {
          displayName: 'asc',
        },
      },
    ],
  });

  const monthlyBudgets = budgets.map((budget) => ({
    ...budget,
    amount: Number(budget.amount),
  }));

  const total = monthlyBudgets.reduce(
    (sum, budget) => sum + budget.amount,
    0,
  );

  return {
    budgets: monthlyBudgets,
    total,
  };
};

export const createBudget = async (data: CreateBudgetData) => {
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

  const [category, member] = await Promise.all([
    prisma.category.findFirst({
      where: {
        id: data.categoryId,
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
      },
    }),

    data.scope === 'MEMBER' && data.memberId
      ? prisma.householdMember.findFirst({
          where: {
            id: data.memberId,
            householdId: data.householdId,
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  if (data.scope === 'MEMBER' && !member) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  const existingBudget = await prisma.budget.findFirst({
    where: {
      householdId: data.householdId,
      categoryId: data.categoryId,
      scope: data.scope,
      memberId:
        data.scope === 'MEMBER'
          ? data.memberId || null
          : null,
      year: data.year,
      month: data.month,
    },
    select: {
      id: true,
    },
  });

  if (existingBudget) {
    throw new Error('BUDGET_ALREADY_EXISTS');
  }

  return prisma.$transaction(async (tx) => {
    const budget = await tx.budget.create({
      data: {
        householdId: data.householdId,
        memberId:
          data.scope === 'MEMBER'
            ? data.memberId || null
            : null,
        categoryId: data.categoryId,
        scope: data.scope,
        year: data.year,
        month: data.month,
        amount: data.amount,
      },
      select: {
        id: true,
        scope: true,
        year: true,
        month: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'CREATE',
        entity: 'Budget',
        entityId: budget.id,
        afterData: {
          memberId:
            data.scope === 'MEMBER'
              ? data.memberId || null
              : null,
          categoryId: data.categoryId,
          scope: data.scope,
          year: data.year,
          month: data.month,
          amount: data.amount,
        },
      },
    });

    return {
      ...budget,
      amount: Number(budget.amount),
    };
  });
};

export const updateBudget = async (data: UpdateBudgetData) => {
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

  const currentBudget = await prisma.budget.findFirst({
    where: {
      id: data.budgetId,
      householdId: data.householdId,
    },
    select: {
      id: true,
      memberId: true,
      categoryId: true,
      scope: true,
      year: true,
      month: true,
      amount: true,
    },
  });

  if (!currentBudget) {
    throw new Error('BUDGET_NOT_FOUND');
  }

  const [category, member] = await Promise.all([
    prisma.category.findFirst({
      where: {
        id: data.categoryId,
        householdId: data.householdId,
        isActive: true,
      },
      select: {
        id: true,
      },
    }),

    data.scope === 'MEMBER' && data.memberId
      ? prisma.householdMember.findFirst({
          where: {
            id: data.memberId,
            householdId: data.householdId,
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  if (data.scope === 'MEMBER' && !member) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  const duplicatedBudget = await prisma.budget.findFirst({
    where: {
      householdId: data.householdId,
      categoryId: data.categoryId,
      scope: data.scope,
      memberId:
        data.scope === 'MEMBER'
          ? data.memberId || null
          : null,
      year: currentBudget.year,
      month: currentBudget.month,
      id: {
        not: data.budgetId,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicatedBudget) {
    throw new Error('BUDGET_ALREADY_EXISTS');
  }

  return prisma.$transaction(async (tx) => {
    const budget = await tx.budget.update({
      where: {
        id: data.budgetId,
      },
      data: {
        memberId:
          data.scope === 'MEMBER'
            ? data.memberId || null
            : null,
        categoryId: data.categoryId,
        scope: data.scope,
        amount: data.amount,
      },
      select: {
        id: true,
        scope: true,
        year: true,
        month: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'UPDATE',
        entity: 'Budget',
        entityId: data.budgetId,
        beforeData: {
          memberId: currentBudget.memberId,
          categoryId: currentBudget.categoryId,
          scope: currentBudget.scope,
          amount: Number(currentBudget.amount),
        },
        afterData: {
          memberId:
            data.scope === 'MEMBER'
              ? data.memberId || null
              : null,
          categoryId: data.categoryId,
          scope: data.scope,
          amount: data.amount,
        },
      },
    });

    return {
      ...budget,
      amount: Number(budget.amount),
    };
  });
};

export const deleteBudget = async (data: DeleteBudgetData) => {
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

  const currentBudget = await prisma.budget.findFirst({
    where: {
      id: data.budgetId,
      householdId: data.householdId,
    },
    select: {
      id: true,
      memberId: true,
      categoryId: true,
      scope: true,
      year: true,
      month: true,
      amount: true,
    },
  });

  if (!currentBudget) {
    throw new Error('BUDGET_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    await tx.budget.delete({
      where: {
        id: data.budgetId,
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'DELETE',
        entity: 'Budget',
        entityId: data.budgetId,
        beforeData: {
          memberId: currentBudget.memberId,
          categoryId: currentBudget.categoryId,
          scope: currentBudget.scope,
          year: currentBudget.year,
          month: currentBudget.month,
          amount: Number(currentBudget.amount),
        },
      },
    });

    return currentBudget;
  });
};