import prisma from '../config/prisma';

interface GetCategoriesData {
  householdId: string;
  userId: string;
}

interface CreateCategoryData {
  householdId: string;
  userId: string;
  name: string;
}

interface UpdateCategoryData {
  householdId: string;
  categoryId: string;
  userId: string;
  name: string;
}

interface DeleteCategoryData {
  householdId: string;
  categoryId: string;
  userId: string;
}

export const getCategories = async (data: GetCategoriesData) => {
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

  return prisma.category.findMany({
    where: {
      householdId: data.householdId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};

export const createCategory = async (data: CreateCategoryData) => {
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

  const name = data.name.trim();

  const existingCategory = await prisma.category.findFirst({
    where: {
      householdId: data.householdId,
      name,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (existingCategory) {
    if (existingCategory.isActive) {
      throw new Error('CATEGORY_ALREADY_EXISTS');
    }

    throw new Error('CATEGORY_INACTIVE_EXISTS');
  }

  return prisma.$transaction(async (tx) => {
    const category = await tx.category.create({
      data: {
        householdId: data.householdId,
        name,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'CREATE',
        entity: 'Category',
        entityId: category.id,
        afterData: {
          name: category.name,
          isActive: category.isActive,
        },
      },
    });

    return category;
  });
};

export const updateCategory = async (data: UpdateCategoryData) => {
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

  const currentCategory = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      householdId: data.householdId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  if (!currentCategory) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  const name = data.name.trim();

  const duplicatedCategory = await prisma.category.findFirst({
    where: {
      householdId: data.householdId,
      name,
      id: {
        not: data.categoryId,
      },
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (duplicatedCategory) {
    if (duplicatedCategory.isActive) {
      throw new Error('CATEGORY_ALREADY_EXISTS');
    }

    throw new Error('CATEGORY_INACTIVE_EXISTS');
  }

  return prisma.$transaction(async (tx) => {
    const category = await tx.category.update({
      where: {
        id: data.categoryId,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'UPDATE',
        entity: 'Category',
        entityId: data.categoryId,
        beforeData: {
          name: currentCategory.name,
          isActive: currentCategory.isActive,
        },
        afterData: {
          name: category.name,
          isActive: category.isActive,
        },
      },
    });

    return category;
  });
};

export const deleteCategory = async (data: DeleteCategoryData) => {
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

  const currentCategory = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      householdId: data.householdId,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  if (!currentCategory) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  const [movementsCount, budgetsCount] = await Promise.all([
    prisma.movement.count({
      where: {
        categoryId: data.categoryId,
      },
    }),

    prisma.budget.count({
      where: {
        categoryId: data.categoryId,
      },
    }),
  ]);

  if (movementsCount > 0 || budgetsCount > 0) {
    throw new Error('CATEGORY_IN_USE');
  }

  return prisma.$transaction(async (tx) => {
    await tx.category.delete({
      where: {
        id: data.categoryId,
      },
    });

    await tx.auditLog.create({
      data: {
        householdId: data.householdId,
        userId: data.userId,
        action: 'DELETE',
        entity: 'Category',
        entityId: data.categoryId,
        beforeData: {
          name: currentCategory.name,
          isActive: currentCategory.isActive,
        },
      },
    });

    return currentCategory;
  });
};