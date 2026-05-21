import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getAuthCookieConfig } from '../utils/cookie-config';
import { AuthenticatedRequest } from '../middleware/auth';

const tenantManager = new TenantDatabaseManager();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_fallback_key_12345';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // We get the global client since signups operate on the Identity Layer
    const { client } = tenantManager.getGlobalClient();

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Use email prefix as default name
    const defaultName = email.split('@')[0];

    // Insert new user
    await client.insert(schema.users).values({
      id: userId,
      email,
      name: defaultName,
      passwordHash: hashedPassword,
      createdAt: new Date(),
    });

    // Create default preferences row
    await client.insert(schema.userPreferences).values({
      userId,
      darkMode: true,
      notifications: true,
      dataSharing: false,
      updatedAt: new Date(),
    });

    res.status(201).json({ message: 'User created successfully', userId });
  } catch (error: any) {
    const msg = error.message || String(error);
    const isUniqueConstraint = 
      msg.includes('UNIQUE') || 
      msg.includes('constraint failed') || 
      msg.includes('Constraint failed') || 
      error.code === 'SQLITE_CONSTRAINT' || 
      error.code === 'SQLITE_CONSTRAINT_UNIQUE';

    if (isUniqueConstraint) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Signup failed', details: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { client } = tenantManager.getGlobalClient();

    // Verify User
    const userResult = await client.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    
    if (userResult.length === 0 || !(await bcrypt.compare(password, userResult[0].passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult[0];
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Persist session
    await client.insert(schema.sessions).values({
      id: sessionId,
      token: sessionToken,
      userId: user.id,
      expiresAt,
      createdAt: new Date(),
    });

    // Sign JWT
    const jwtToken = jwt.sign(
      { userId: user.id, sessionId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HttpOnly Cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieConfig = getAuthCookieConfig({ isProduction }, 7 * 24 * 60 * 60 * 1000);
    res.cookie('access_token', jwtToken, cookieConfig);

    res.json({ 
      token: sessionToken, 
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      accountType: user.billingStatus 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { client } = tenantManager.getGlobalClient();

    if (authReq.user?.sessionId) {
      await client
        .delete(schema.sessions)
        .where(eq(schema.sessions.id, authReq.user.sessionId));
    } else {
      const token = req.cookies?.access_token;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { sessionId: string };
          await client
            .delete(schema.sessions)
            .where(eq(schema.sessions.id, decoded.sessionId));
        } catch (e) {
          // Token is invalid/expired, nothing to delete from DB
        }
      }
    }
  } catch (error) {
    console.error('Logout db session cleanup error:', error);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieConfig = getAuthCookieConfig({ isProduction }, 0);
  res.clearCookie('access_token', cookieConfig);

  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { client } = tenantManager.getGlobalClient();
    const userId = authReq.user.userId;

    // Find user
    const userResult = await client
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      accountType: user.billingStatus,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch session info', details: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = authReq.user.userId;
    const { name } = req.body;
    const { client } = tenantManager.getGlobalClient();

    await client
      .update(schema.users)
      .set({ name })
      .where(eq(schema.users.id, userId));

    res.json({ message: 'Profile updated successfully', name });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
};
