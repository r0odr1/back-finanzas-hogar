import { Request, Response } from 'express';
import { getMonthlySummary } from '../services/dashboard.service';

export const monthlySummary = async (req: Request, res: Response) => {
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

    const summary = await getMonthlySummary({
      householdId,
      userId,
      year,
      month,
    });

    return res.status(200).json({
      summary,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_HOUSEHOLD_MEMBER') {
      return res.status(403).json({
        message: 'No perteneces a este hogar.',
      });
    }

    console.error('Error consultando resumen mensual:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};