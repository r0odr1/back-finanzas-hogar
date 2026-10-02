import { Request, Response } from 'express';
import { createMovement, getMovements } from '../services/movement.service';

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

    const movements = await getMovements({
      householdId,
      userId,
      year,
      month,
    });

    return res.status(200).json({
      movements,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_HOUSEHOLD_MEMBER') {
      return res.status(403).json({
        message: 'No perteneces a este hogar.',
      });
    }

    console.error('Error consultando movimientos:', error);

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
      accountId,
      categoryId,
      type,
      amount,
      description,
      occurredAt,
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

    if (typeof memberId !== 'string' || !memberId) {
      return res.status(400).json({
        message: 'Miembro inválido.',
      });
    }

    if (typeof accountId !== 'string' || !accountId) {
      return res.status(400).json({
        message: 'Cuenta inválida.',
      });
    }

    if (categoryId !== undefined && categoryId !== null && typeof categoryId !== 'string') {
      return res.status(400).json({
        message: 'Categoría inválida.',
      });
    }

    if (type !== 'EXPENSE' && type !== 'INCOME') {
      return res.status(400).json({
        message: 'Tipo de movimiento inválido.',
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Valor inválido.',
      });
    }

    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        message: 'La descripción es obligatoria.',
      });
    }

    const movementDate = new Date(occurredAt);

    if (!occurredAt || Number.isNaN(movementDate.getTime())) {
      return res.status(400).json({
        message: 'Fecha inválida.',
      });
    }

    const movement = await createMovement({
      householdId,
      userId,
      memberId,
      accountId,
      categoryId: categoryId || null,
      type,
      amount: numericAmount,
      description,
      occurredAt: movementDate,
    });

    return res.status(201).json({
      message: 'Movimiento registrado correctamente.',
      movement,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'MEMBER_NOT_FOUND') {
        return res.status(400).json({
          message: 'El miembro no pertenece al hogar.',
        });
      }

      if (error.message === 'ACCOUNT_NOT_FOUND') {
        return res.status(400).json({
          message: 'La cuenta no pertenece al hogar.',
        });
      }

      if (error.message === 'CATEGORY_NOT_FOUND') {
        return res.status(400).json({
          message: 'La categoría no pertenece al hogar.',
        });
      }
    }

    console.error('Error registrando movimiento:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};