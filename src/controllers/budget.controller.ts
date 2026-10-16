import { Request, Response } from 'express';
import { createBudget, deleteBudget, getBudgets, updateBudget } from '../services/budget.service';

export const list = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: 'Usuario no autenticado.',
      });
    }

    if (typeof householdId !== 'string' || !householdId) {
      return res.status(400).json({
        message: 'Hogar inválido.',
      });
    }

    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        message: 'Año inválido.',
      });
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({
        message: 'Mes inválido.',
      });
    }

    const result = await getBudgets({
      householdId,
      userId,
      year,
      month,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'NOT_HOUSEHOLD_MEMBER'
    ) {
      return res.status(403).json({
        message: 'No perteneces a este hogar.',
      });
    }

    console.error('Error consultando presupuestos:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId } = req.params;

    const {
      memberId,
      categoryId,
      scope,
      year,
      month,
      amount,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: 'Usuario no autenticado.',
      });
    }

    if (typeof householdId !== 'string' || !householdId) {
      return res.status(400).json({
        message: 'Hogar inválido.',
      });
    }

    if (typeof categoryId !== 'string' || !categoryId) {
      return res.status(400).json({
        message: 'Categoría inválida.',
      });
    }

    if (scope !== 'HOUSEHOLD' && scope !== 'MEMBER') {
      return res.status(400).json({
        message: 'Alcance de presupuesto inválido.',
      });
    }

    if (
      scope === 'MEMBER' &&
      (typeof memberId !== 'string' || !memberId)
    ) {
      return res.status(400).json({
        message: 'Debes seleccionar una persona.',
      });
    }

    const numericYear = Number(year);
    const numericMonth = Number(month);
    const numericAmount = Number(amount);

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 2000 ||
      numericYear > 2100
    ) {
      return res.status(400).json({
        message: 'Año inválido.',
      });
    }

    if (
      !Number.isInteger(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {
      return res.status(400).json({
        message: 'Mes inválido.',
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Valor inválido.',
      });
    }

    const budget = await createBudget({
      householdId,
      userId,
      memberId:
        scope === 'MEMBER'
          ? memberId
          : null,
      categoryId,
      scope,
      year: numericYear,
      month: numericMonth,
      amount: numericAmount,
    });

    return res.status(201).json({
      message: 'Presupuesto creado correctamente.',
      budget,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'CATEGORY_NOT_FOUND') {
        return res.status(400).json({
          message: 'La categoría no pertenece al hogar.',
        });
      }

      if (error.message === 'MEMBER_NOT_FOUND') {
        return res.status(400).json({
          message: 'El miembro no pertenece al hogar.',
        });
      }

      if (error.message === 'BUDGET_ALREADY_EXISTS') {
        return res.status(409).json({
          message: 'Ya existe un presupuesto para esa combinación.',
        });
      }
    }

    console.error('Error creando presupuesto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId, budgetId } = req.params;

    const {
      memberId,
      categoryId,
      scope,
      amount,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: 'Usuario no autenticado.',
      });
    }

    if (typeof householdId !== 'string' || !householdId) {
      return res.status(400).json({
        message: 'Hogar inválido.',
      });
    }

    if (typeof budgetId !== 'string' || !budgetId) {
      return res.status(400).json({
        message: 'Presupuesto inválido.',
      });
    }

    if (typeof categoryId !== 'string' || !categoryId) {
      return res.status(400).json({
        message: 'Categoría inválida.',
      });
    }

    if (scope !== 'HOUSEHOLD' && scope !== 'MEMBER') {
      return res.status(400).json({
        message: 'Alcance de presupuesto inválido.',
      });
    }

    if (
      scope === 'MEMBER' &&
      (typeof memberId !== 'string' || !memberId)
    ) {
      return res.status(400).json({
        message: 'Debes seleccionar una persona.',
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Valor inválido.',
      });
    }

    const budget = await updateBudget({
      householdId,
      budgetId,
      userId,
      memberId:
        scope === 'MEMBER'
          ? memberId
          : null,
      categoryId,
      scope,
      amount: numericAmount,
    });

    return res.status(200).json({
      message: 'Presupuesto actualizado correctamente.',
      budget,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({
          message: 'Presupuesto no encontrado.',
        });
      }

      if (error.message === 'CATEGORY_NOT_FOUND') {
        return res.status(400).json({
          message: 'La categoría no pertenece al hogar.',
        });
      }

      if (error.message === 'MEMBER_NOT_FOUND') {
        return res.status(400).json({
          message: 'El miembro no pertenece al hogar.',
        });
      }

      if (error.message === 'BUDGET_ALREADY_EXISTS') {
        return res.status(409).json({
          message: 'Ya existe un presupuesto para esa combinación.',
        });
      }
    }

    console.error('Error actualizando presupuesto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId, budgetId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: 'Usuario no autenticado.',
      });
    }

    if (typeof householdId !== 'string' || !householdId) {
      return res.status(400).json({
        message: 'Hogar inválido.',
      });
    }

    if (typeof budgetId !== 'string' || !budgetId) {
      return res.status(400).json({
        message: 'Presupuesto inválido.',
      });
    }

    await deleteBudget({
      householdId,
      budgetId,
      userId,
    });

    return res.status(200).json({
      message: 'Presupuesto eliminado correctamente.',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({
          message: 'Presupuesto no encontrado.',
        });
      }
    }

    console.error('Error eliminando presupuesto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};