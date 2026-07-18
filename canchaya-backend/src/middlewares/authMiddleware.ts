import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  usuarioUser?: { id: number; rol: 'CLIENTE' | 'ADMIN' };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ClaveSecretaDefault') as { id: number; rol: 'CLIENTE' | 'ADMIN' };
    req.usuarioUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

export const roleMiddleware = (rolRequerido: 'ADMIN') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuarioUser || req.usuarioUser.rol !== rolRequerido) {
      return res.status(403).json({ error: 'Permisos insuficientes para realizar esta acción.' });
    }
    next();
  };
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ClaveSecretaDefault') as { id: number; rol: 'CLIENTE' | 'ADMIN' };
      req.usuarioUser = decoded;
    } catch (error) {
      // Si el token es inválido o expiró, se ignora req.usuarioUser sin bloquear la consulta pública
    }
  }
  next();
};