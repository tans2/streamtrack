import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from './database';
import { TMDBService } from './tmdb';

// Fail closed: a missing secret must never silently fall back to a known
// default, which would let anyone forge a token for any user. Resolved through
// an IIFE so the exported type is a definite `string` rather than
// `string | undefined` (jsonwebtoken's overloads reject the latter).
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start with an insecure default — ' +
      'set JWT_SECRET to a long random string in the environment.'
    );
  }
  return secret;
})();
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'premium';
  region: string;
  connected_platforms: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
    new_episodes: boolean;
    new_seasons: boolean;
  };
  privacy_settings: {
    data_export_enabled: boolean;
    data_delete_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
}

export class AuthService {
  // Register new user with email/password
  static generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  static async register(email: string, password: string, name?: string, initialShows?: number[], referredByUserId?: string) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('An account already exists with this email address. Please try logging in or reset your password if you forgot it.');
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user in database
      const referralCode = this.generateReferralCode();
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash,
          name: name || email.split('@')[0],
          subscription_tier: 'free',
          region: 'US',
          connected_platforms: [],
          notification_preferences: {
            email: true,
            push: false,
            new_episodes: true,
            new_seasons: true
          },
          privacy_settings: {
            data_export_enabled: true,
            data_delete_enabled: true
          },
          referral_code: referralCode,
          ...(referredByUserId ? { referred_by_user_id: referredByUserId } : {}),
        })
        .select()
        .single();

      if (userError) throw userError;

      // Add initial shows if provided
      if (initialShows && initialShows.length > 0) {
        await this.addInitialShows(user.id, initialShows);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_tier: user.subscription_tier,
          region: user.region,
          connected_platforms: user.connected_platforms,
          notification_preferences: user.notification_preferences,
          privacy_settings: user.privacy_settings
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user with email/password
  static async login(email: string, password: string) {
    try {
      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new Error('No account found with this email address. Please create an account first.');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Incorrect password. Please try again.');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_tier: user.subscription_tier,
          region: user.region,
          connected_platforms: user.connected_platforms,
          notification_preferences: user.notification_preferences,
          privacy_settings: user.privacy_settings
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Verify JWT token
  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_tier: user.subscription_tier,
        region: user.region,
        connected_platforms: user.connected_platforms,
        notification_preferences: user.notification_preferences,
        privacy_settings: user.privacy_settings
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Add initial shows for new user
  static async addInitialShows(userId: string, tmdbIds: number[]) {
    try {
      const showPromises = tmdbIds.map(async (tmdbId) => {
        // Get show details from TMDB
        const showDetails = await TMDBService.getShowDetails(tmdbId);
        if (!showDetails) return null;

        // Upsert show in database
        const { data: show, error: showError } = await supabase
          .from('shows')
          .upsert(showDetails, { onConflict: 'tmdb_id' })
          .select()
          .single();

        if (showError || !show) return null;

        // Add to user's watchlist
        const { error: followError } = await supabase
          .from('user_shows')
          .upsert({
            user_id: userId,
            show_id: show.id,
            is_following: true,
            watch_status: 'want_to_watch'
          }, { onConflict: 'user_id,show_id' });

        if (followError) {
          console.error(`Error following show ${tmdbId}:`, followError);
        }

        return show;
      });

      await Promise.all(showPromises);
    } catch (error) {
      console.error('Error adding initial shows:', error);
      throw error;
    }
  }

  // Update user preferences
  static async updatePreferences(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Get user's followed shows
  static async getUserShows(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .select(`
          *,
          shows (*)
        `)
        .eq('user_id', userId)
        .eq('is_following', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user shows:', error);
      throw error;
    }
  }

  // Upgrade to premium
  static async upgradeToPremium(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          subscription_tier: 'premium',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  }
}

