import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth';
import { DatabaseService } from '../services/database';
import { EmailService } from '../services/email';

const router = express.Router();

// Middleware to verify JWT token
export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const user = await AuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, initialShows } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your email address and password.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long for security.'
      });
    }

    const result = await AuthService.register(email, password, name, initialShows);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your email address and password.'
      });
    }

    const result = await AuthService.login(email, password);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const { region, connected_platforms, notification_preferences, privacy_settings } = req.body;
    
    const updates: any = {};
    if (region) updates.region = region;
    if (connected_platforms) updates.connected_platforms = connected_platforms;
    if (notification_preferences) updates.notification_preferences = notification_preferences;
    if (privacy_settings) updates.privacy_settings = privacy_settings;

    const updatedUser = await AuthService.updatePreferences(req.user.id, updates);

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update preferences'
    });
  }
});

// Get user's followed shows
router.get('/shows', authenticateToken, async (req: any, res) => {
  try {
    const shows = await AuthService.getUserShows(req.user.id);

    res.json({
      success: true,
      data: shows
    });
  } catch (error: any) {
    console.error('Get user shows error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user shows'
    });
  }
});

// Upgrade to premium
router.post('/upgrade-premium', authenticateToken, async (req: any, res) => {
  res.status(403).json({
    success: false,
    error: 'Premium is coming soon.'
  });
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req: any, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement a token blacklist here if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Request password reset (forgot password)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your email address.'
      });
    }

    // Check if user exists (but don't reveal this to the client for security)
    const user = await DatabaseService.getUserByEmail(email);

    if (user) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Save token to database
      await DatabaseService.setPasswordResetToken(email, token, expiresAt);

      // Send reset email
      await EmailService.sendPasswordResetEmail(email, user.name || '', token);
    }

    // Always return success message (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request. Please try again.'
    });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Reset token is required.'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a new password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.'
      });
    }

    // Find user by reset token (also checks expiration)
    const user = await DatabaseService.getUserByResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset link. Please request a new password reset.'
      });
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const updated = await DatabaseService.updatePassword(user.id, passwordHash);

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update password. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.'
    });
  }
});

export default router;

