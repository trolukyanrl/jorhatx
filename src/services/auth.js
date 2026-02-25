import AsyncStorage from '@react-native-async-storage/async-storage';
import { account, databases, functions, DATABASE_ID, USERS_COLLECTION_ID } from './appwrite';
import { ID } from 'react-native-appwrite';

// Storage keys
const STORAGE_KEYS = {
  USER: 'user_data',
  SESSION: 'session_token',
};

const REQUEST_PASSWORD_RESET_OTP_FUNCTION_ID = '699ed8e8000837fc629f';
const VERIFY_OTP_RESET_PASSWORD_FUNCTION_ID = '699ed98600222a69c01f';

const executeAppwriteFunction = async (functionId, payload) => {
  const execution = await functions.createExecution({
    functionId,
    body: JSON.stringify(payload),
    async: false,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  });

  let response = {};
  if (execution?.responseBody) {
    try {
      response = JSON.parse(execution.responseBody);
    } catch (parseError) {
      response = { message: execution.responseBody };
    }
  }

  const failed =
    execution?.status !== 'completed' ||
    (typeof execution?.responseStatusCode === 'number' &&
      execution.responseStatusCode >= 400) ||
    response?.success === false;

  if (failed) {
    const message =
      response?.error ||
      response?.message ||
      execution?.errors ||
      `Function ${functionId} failed`;
    throw new Error(message);
  }

  return response;
};

// Authentication service
export const authService = {
  // Login user
  async login(email, password) {
    try {
      // If a session is already active, replace it with a fresh one.
      try {
        await account.get();
        await account.deleteSession('current');
      } catch (sessionError) {
        // Ignore "not logged in" cases and continue creating session.
      }

      // Create email session
      const session = await account.createEmailPasswordSession({ email, password });

      // Get user details
      const user = await account.get();

      // Store session and user data
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return { success: true, user, session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Register user
  async register(email, password, name) {
    try {
      // Create user account
      const user = await account.create(ID.unique(), email, password, name);

      // Create user document in database with default role
      const userDoc = await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        {
          role: 'user',
          banned: false,
        }
      );

      // Send one-time password (OTP) email for session verification.
      await account.createEmailToken({ userId: user.$id, email });

      return { success: true, userId: user.$id, email };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify email OTP and create session
  async verifyEmailOtp(userId, otp) {
    try {
      // Ensure a clean session state before token-based session creation.
      try {
        await account.deleteSession('current');
      } catch (sessionError) {
        const message = (sessionError?.message || '').toLowerCase();
        const isAlreadyLoggedOut =
          sessionError?.code === 401 ||
          message.includes('role: guests') ||
          message.includes('missing scopes');

        if (!isAlreadyLoggedOut) {
          throw sessionError;
        }
      }

      const session = await account.createSession({ userId, secret: otp });
      const user = await account.get();

      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return { success: true, user, session };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Resend registration OTP email
  async resendEmailOtp(userId, email) {
    try {
      await account.createEmailToken({ userId, email });
      return { success: true };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout() {
    try {
      try {
        await account.deleteSession('current');
      } catch (sessionError) {
        const message = (sessionError?.message || '').toLowerCase();
        const isAlreadyLoggedOut =
          sessionError?.code === 401 ||
          message.includes('role: guests') ||
          message.includes('missing scopes');

        if (!isAlreadyLoggedOut) {
          throw sessionError;
        }
      }

      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const result = await executeAppwriteFunction(
        REQUEST_PASSWORD_RESET_OTP_FUNCTION_ID,
        { email }
      );

      return {
        success: true,
        userId: result?.userId,
        email: result?.email || email,
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password with OTP
  async resetPasswordWithOtp(userId, otp, newPassword) {
    try {
      await executeAppwriteFunction(VERIFY_OTP_RESET_PASSWORD_FUNCTION_ID, {
        userId,
        otp,
        newPassword,
      });

      return { success: true };
    } catch (error) {
      console.error('Reset password with OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  // Resend forgot-password OTP
  async resendForgotPasswordOtp(userId, email) {
    try {
      await executeAppwriteFunction(REQUEST_PASSWORD_RESET_OTP_FUNCTION_ID, {
        userId,
        email,
      });
      return { success: true };
    } catch (error) {
      console.error('Resend forgot-password OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (error) {
      console.error('Get current session error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const session = await this.getCurrentSession();
      if (!session) return false;

      // Verify session is still valid
      try {
        await account.get();
        return true;
      } catch (error) {
        // Session is invalid, clear storage
        await this.clearStorage();
        return false;
      }
    } catch (error) {
      return false;
    }
  },

  // Get user role
  async getUserRole() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      // Get user document from database to check role
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );

      return userDoc.role;
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  },

  // Check if user is banned
  async isUserBanned() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Get user document from database to check ban status
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );

      return userDoc.banned;
    } catch (error) {
      console.error('Check ban status error:', error);
      return false;
    }
  },

  // Clear all stored data
  async clearStorage() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      return true;
    } catch (error) {
      console.error('Clear storage error:', error);
      return false;
    }
  }
};
