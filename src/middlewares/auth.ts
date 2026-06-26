import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret') as {
      _id: string;
      email: string;
      role: string;
      isPremium: boolean;
    };

    const user = await User.findById(decoded._id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired.', tokenExpired: true });
      return;
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret') as {
      _id: string;
      email: string;
      role: string;
      isPremium: boolean;
    };

    const user = await User.findById(decoded._id).select('-password');
    if (user) {
      req.user = {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      };
    }

    next();
  } catch {
    next();
  }
};
