import { Request, Response } from 'express';
import { authenticateUser } from '../services/auth.service';
import { generateAccessToken } from '../services/token.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email y contraseña son obligatorios.',
      });
    }

    const user = await authenticateUser({ email, password });

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      user,
      token,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        message: 'Email o contraseña incorrectos.',
      });
    }

    console.error('Error iniciando sesión:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};

export const me = (req: Request, res: Response) => {
  return res.status(200).json({
    user: req.user,
  });
};