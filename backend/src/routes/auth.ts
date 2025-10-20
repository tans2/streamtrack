import express from 'express';
import { AuthService } from '../services/auth';

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
  try {
    const updatedUser = await AuthService.upgradeToPremium(req.user.id);

    res.json({
      success: true,
      data: updatedUser,
      message: 'Successfully upgraded to premium!'
    });
  } catch (error: any) {
    console.error('Upgrade premium error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upgrade to premium'
    });
  }
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

export default router;

