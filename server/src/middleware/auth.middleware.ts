import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';

interface JwtPayload {
  userId: number;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired. Please login again.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to access this resource.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }
    next();
  };
};

// Alias for authenticate
export const authenticateToken = authenticate;

// Optional authentication - doesn't fail if no token, just sets req.user if valid
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next(); // No token, continue without user
  }

  const token = authHeader.substring(7);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    // Token invalid, continue without user
  }
  
  next();
};