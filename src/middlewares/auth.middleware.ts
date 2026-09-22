import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token de autenticación requerido.',
    });
  }

  const token = authorization.substring(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({
      message: 'Token inválido o expirado.',
    });
  }
};