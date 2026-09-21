import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      api: 'Finanzas Hogar',
      database: 'connected',
    });
  } catch (error) {
    console.error('Error verificando la base de datos:', error);

    res.status(500).json({
      status: 'error',
      api: 'Finanzas Hogar',
      database: 'disconnected',
    });
  }
};