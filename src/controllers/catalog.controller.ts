import { Request, Response } from 'express';
import { getMovementCatalogs } from '../services/catalog.service';

export const getMovementCatalogsController = async (req: Request, res: Response) => {
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

    const catalogs = await getMovementCatalogs({
      householdId,
      userId,
    });

    return res.status(200).json(catalogs);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_HOUSEHOLD_MEMBER') {
      return res.status(403).json({
        message: 'No perteneces a este hogar.',
      });
    }

    console.error('Error consultando catálogos:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};