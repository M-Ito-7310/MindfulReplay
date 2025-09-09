import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'No token provided'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid or expired token'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    return;
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
};