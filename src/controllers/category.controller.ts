import { Request, Response } from 'express';
import { createCategory, disableCategory, getCategories, updateCategory } from '../services/category.service';

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

    const categories = await getCategories({
      householdId,
      userId,
    });

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'NOT_HOUSEHOLD_MEMBER'
    ) {
      return res.status(403).json({
        message: 'No perteneces a este hogar.',
      });
    }

    console.error('Error consultando categorías:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId } = req.params;
    const { name } = req.body;

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

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'El nombre de la categoría es obligatorio.',
      });
    }

    const category = await createCategory({
      householdId,
      userId,
      name,
    });

    return res.status(201).json({
      message: 'Categoría creada correctamente.',
      category,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'CATEGORY_ALREADY_EXISTS') {
        return res.status(409).json({
          message: 'Ya existe una categoría con ese nombre.',
        });
      }

      if (error.message === 'CATEGORY_INACTIVE_EXISTS') {
        return res.status(409).json({
          message: 'Ya existe una categoría inactiva con ese nombre.',
        });
      }
    }

    console.error('Error creando categoría:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId, categoryId } = req.params;
    const { name } = req.body;

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

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'El nombre de la categoría es obligatorio.',
      });
    }

    const category = await updateCategory({
      householdId,
      categoryId,
      userId,
      name,
    });

    return res.status(200).json({
      message: 'Categoría actualizada correctamente.',
      category,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'CATEGORY_NOT_FOUND') {
        return res.status(404).json({
          message: 'Categoría no encontrada.',
        });
      }

      if (error.message === 'CATEGORY_ALREADY_EXISTS') {
        return res.status(409).json({
          message: 'Ya existe una categoría con ese nombre.',
        });
      }

      if (error.message === 'CATEGORY_INACTIVE_EXISTS') {
        return res.status(409).json({
          message: 'Ya existe una categoría inactiva con ese nombre.',
        });
      }
    }

    console.error('Error actualizando categoría:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId, categoryId } = req.params;

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

    await disableCategory({
      householdId,
      categoryId,
      userId,
    });

    return res.status(200).json({
      message: 'Categoría desactivada correctamente.',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
        return res.status(403).json({
          message: 'No perteneces a este hogar.',
        });
      }

      if (error.message === 'CATEGORY_NOT_FOUND') {
        return res.status(404).json({
          message: 'Categoría no encontrada.',
        });
      }
    }

    console.error('Error desactivando categoría:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};