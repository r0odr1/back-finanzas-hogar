import prisma from '../config/prisma';

interface MonthlySummaryData {
  householdId: string;
  userId: string;
  year: number;
  month: number;
}

export const getMonthlySummary = async (data: MonthlySummaryData) => {
  const membership = await prisma.householdMember.findFirst({
    where: {
      householdId: data.householdId,
      userId: data.userId,
      isActive: true,
    },
    select: {
      household: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error('NOT_HOUSEHOLD_MEMBER');
  }

  const startDate = new Date(Date.UTC(data.year, data.month - 1, 1));
  const endDate = new Date(Date.UTC(data.year, data.month, 1));

  const [monthlyIncome, extraIncome, expenses, members] = await Promise.all([
    prisma.monthlyIncome.aggregate({
      where: {
        householdId: data.householdId,
        year: data.year,
        month: data.month,
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.movement.aggregate({
      where: {
        householdId: data.householdId,
        type: 'INCOME',
        deletedAt: null,
        occurredAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.movement.aggregate({
      where: {
        householdId: data.householdId,
        type: 'EXPENSE',
        deletedAt: null,
        occurredAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),

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
  ]);

  const membersSummary = await Promise.all(
    members.map(async (member) => {
      const [baseIncome, extraIncomeMember, expensesMember] = await Promise.all([
        prisma.monthlyIncome.aggregate({
          where: {
            householdId: data.householdId,
            memberId: member.id,
            year: data.year,
            month: data.month,
          },
          _sum: {
            amount: true,
          },
        }),

        prisma.movement.aggregate({
          where: {
            householdId: data.householdId,
            memberId: member.id,
            type: 'INCOME',
            deletedAt: null,
            occurredAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),

        prisma.movement.aggregate({
          where: {
            householdId: data.householdId,
            memberId: member.id,
            type: 'EXPENSE',
            deletedAt: null,
            occurredAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const baseIncomeTotal = Number(baseIncome._sum.amount ?? 0);
      const extraIncomeTotal = Number(extraIncomeMember._sum.amount ?? 0);
      const expenseTotal = Number(expensesMember._sum.amount ?? 0);
      const incomeTotal = baseIncomeTotal + extraIncomeTotal;
      const balanceTotal = incomeTotal - expenseTotal;

      return {
        id: member.id,
        displayName: member.displayName,
        income: {
          base: baseIncomeTotal,
          extra: extraIncomeTotal,
          total: incomeTotal,
        },
        expenses: {
          total: expenseTotal,
        },
        balance: {
          total: balanceTotal,
        },
      };
    }),
  );

  const baseIncomeTotal = Number(monthlyIncome._sum.amount ?? 0);
  const extraIncomeTotal = Number(extraIncome._sum.amount ?? 0);
  const expenseTotal = Number(expenses._sum.amount ?? 0);

  const incomeTotal = baseIncomeTotal + extraIncomeTotal;
  const balanceTotal = incomeTotal - expenseTotal;
  const usagePercentage = incomeTotal > 0
    ? Number(((expenseTotal / incomeTotal) * 100).toFixed(2))
    : 0;

  return {
    household: membership.household,
    period: {
      year: data.year,
      month: data.month,
    },
    income: {
      base: baseIncomeTotal,
      extra: extraIncomeTotal,
      total: incomeTotal,
    },
    expenses: {
      total: expenseTotal,
    },
    balance: {
      total: balanceTotal,
    },
    usagePercentage,
    members: membersSummary,
  };
};