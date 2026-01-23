import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock user for demo purposes
const DEMO_USER = {
  email: 'sankalp@whizunik.com',
  password: 'Sankalp@8jan1983', // In production, this would be hashed
  name: 'Sankalp',
  role: 'admin',
  id: '1'
};

// Login endpoint
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Check credentials against demo user
      if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          role: DEMO_USER.role
        },
        process.env.JWT_SECRET || 'whizunik-factoring-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
            role: DEMO_USER.role
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'whizunik-factoring-secret') as any;
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        }
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;