import prisma from '../config/prisma';

interface AddHouseholdMemberData {
  householdId: string;
  userId: string;
  displayName: string;
}

export const addHouseholdMember = async (data: AddHouseholdMemberData) => {
  const requester = await prisma.householdMember.findFirst({
    where: {
      householdId: data.householdId,
      userId: data.userId,
      isActive: true,
    },
  });

  if (!requester) {
    throw new Error('NOT_HOUSEHOLD_MEMBER');
  }

  if (requester.role !== 'OWNER') {
    throw new Error('FORBIDDEN');
  }

  const displayName = data.displayName.trim();

  const existingMember = await prisma.householdMember.findUnique({
    where: {
      householdId_displayName: {
        householdId: data.householdId,
        displayName,
      },
    },
  });

  if (existingMember) {
    throw new Error('MEMBER_ALREADY_EXISTS');
  }

  return prisma.householdMember.create({
    data: {
      householdId: data.householdId,
      displayName,
      role: 'MEMBER',
    },
    select: {
      id: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

export const getHouseholdMembers = async (householdId: string, userId: string) => {
  const requester = await prisma.householdMember.findFirst({
    where: {
      householdId,
      userId,
      isActive: true,
    },
  });

  if (!requester) {
    throw new Error('NOT_HOUSEHOLD_MEMBER');
  }

  return prisma.householdMember.findMany({
    where: {
      householdId,
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};