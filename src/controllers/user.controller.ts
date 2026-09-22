import { Request, Response } from 'express';
import { createUser } from '../services/user.service';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({
        message: 'Email, contraseña y nombre son obligatorios.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'La contraseña debe tener mínimo 8 caracteres.',
      });
    }

    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
    });

    return res.status(201).json({
      message: 'Usuario creado correctamente.',
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese correo.',
      });
    }

    console.error('Error registrando usuario:', error);

    return res.status(500).json({
      message: 'Error interno del servidor.',
    });
  }
};