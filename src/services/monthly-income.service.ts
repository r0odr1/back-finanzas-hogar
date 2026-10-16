import prisma from '../config/prisma';

interface GetMonthlyIncomesData {
  householdId: string;
  userId: string;
  year: number;
  month: number;
}

interface SaveMonthlyIncomeData {
  householdId: string;
  userId: string;
  memberId: string;
  accountId: string;
  year: number;
  month: number;
  amount: number;
}

export const getMonthlyIncomes = async (data: GetMonthlyIncomesData) => {
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

  const incomes = await prisma.monthlyIncome.findMany({
    where: {
      householdId: data.householdId,
      year: data.year,
      month: data.month,
    },
    select: {
      id: true,
      year: true,
      month: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
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
    },
    orderBy: [
      {
        member: {
          displayName: 'asc',
        },
      },
      {
        account: {
          name: 'asc',
        },
      },
    ],
  });

  const monthlyIncomes = incomes.map((income) => ({
    ...income,
    amount: Number(income.amount),
  }));

  const total = monthlyIncomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );

  return {
    incomes: monthlyIncomes,
    total,
  };
};

export const saveMonthlyIncome = async (data: SaveMonthlyIncomeData) => {
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

  const [member, account] = await Promise.all([
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
  ]);

  if (!member) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  if (!account) {
    throw new Error('ACCOUNT_NOT_FOUND');
  }

  const existingIncome = await prisma.monthlyIncome.findUnique({
    where: {
      memberId_accountId_year_month: {
        memberId: data.memberId,
        accountId: data.accountId,
        year: data.year,
        month: data.month,
      },
    },
    select: {
      id: true,
      amount: true,
    },
  });

  return prisma.$transaction(async (tx) => {
    const income = await tx.monthlyIncome.upsert({
      where: {
        memberId_accountId_year_month: {
          memberId: data.memberId,
          accountId: data.accountId,
          year: data.year,
          month: data.month,
        },
      },
      create: {
        householdId: data.householdId,
        memberId: data.memberId,
        accountId: data.accountId,
        year: data.year,
        month: data.month,
        amount: data.amount,
      },
      update: {
        amount: data.amount,
      },
      select: {
        id: true,
        year: true,
        month: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
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
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: existingIncome ? 'UPDATE' : 'CREATE',
        entity: 'MonthlyIncome',
        entityId: income.id,
        beforeData: existingIncome
          ? {
              amount: Number(existingIncome.amount),
            }
          : undefined,
        afterData: {
          memberId: data.memberId,
          accountId: data.accountId,
          year: data.year,
          month: data.month,
          amount: data.amount,
        },
      },
    });

    return {
      ...income,
      amount: Number(income.amount),
      created: !existingIncome,
    };
  });
};