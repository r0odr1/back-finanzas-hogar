import { Request, Response } from 'express';
import { getMonthlyIncomes, saveMonthlyIncome } from '../services/monthly-income.service';

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

    const result = await getMonthlyIncomes({
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

    console.error('Error consultando ingresos mensuales:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId } = req.params;
    const {
      memberId,
      accountId,
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

    const income = await saveMonthlyIncome({
      householdId,
      userId,
      memberId,
      accountId,
      year: numericYear,
      month: numericMonth,
      amount: numericAmount,
    });

    return res.status(income.created ? 201 : 200).json({
      message: income.created
        ? 'Ingreso mensual registrado correctamente.'
        : 'Ingreso mensual actualizado correctamente.',
      income,
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
    }

    console.error('Error guardando ingreso mensual:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};