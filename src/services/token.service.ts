import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: '1h',
  });
};