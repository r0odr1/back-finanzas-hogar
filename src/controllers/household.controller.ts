import { Request, Response } from 'express';
import { createHousehold } from '../services/household.service';

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: 'Usuario no autenticado.',
      });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'El nombre del hogar es obligatorio.',
      });
    }

    const household = await createHousehold({
      userId,
      name,
    });

    return res.status(201).json({
      message: 'Hogar creado correctamente.',
      household,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        message: 'Usuario no encontrado.',
      });
    }

    console.error('Error creando hogar:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};