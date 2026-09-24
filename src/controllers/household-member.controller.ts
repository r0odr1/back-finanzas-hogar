import { Request, Response } from 'express';
import { addHouseholdMember, getHouseholdMembers } from '../services/household-member.service';

export const addMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { householdId } = req.params;
    const { displayName } = req.body;

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

    if (typeof displayName !== 'string' || !displayName.trim()) {
      return res.status(400).json({
        message: 'El nombre del miembro es obligatorio.',
      });
    }

    const member = await addHouseholdMember({
      householdId,
      userId,
      displayName,
    });

    return res.status(201).json({
      message: 'Miembro agregado correctamente.',
      member,
    });
  } catch (error) {
    return handleHouseholdMemberError(error, res);
  }
};

export const listMembers = async (req: Request, res: Response) => {
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

    const members = await getHouseholdMembers(householdId, userId);

    return res.status(200).json({
      members,
    });
  } catch (error) {
    return handleHouseholdMemberError(error, res);
  }
};

const handleHouseholdMemberError = (error: unknown, res: Response) => {
  if (error instanceof Error) {
    if (error.message === 'NOT_HOUSEHOLD_MEMBER') {
      return res.status(403).json({
        message: 'No perteneces a este hogar.',
      });
    }

    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción.',
      });
    }

    if (error.message === 'MEMBER_ALREADY_EXISTS') {
      return res.status(409).json({
        message: 'Ya existe un miembro con ese nombre en el hogar.',
      });
    }
  }

  console.error('Error gestionando miembros del hogar:', error);

  return res.status(500).json({
    message: 'Error interno del servidor.',
  });
};