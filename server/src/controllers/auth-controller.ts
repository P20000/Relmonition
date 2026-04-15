import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

// Helper to generate an opaque token for DB storage
const generateToken = () => crypto.randomBytes(32).toString('hex');

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // We get the global client since signups operate on the Identity Layer
    const { client } = tenantManager.getGlobalClient();

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Insert new user
    await client.insert(schema.users).values({
      id: userId,
      email,
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
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
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
    const sessionToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Persist session
    await client.insert(schema.sessions).values({
      id: crypto.randomUUID(),
      token: sessionToken,
      userId: user.id,
      expiresAt,
      createdAt: new Date(),
    });

    res.json({ 
      token: sessionToken, 
      userId: user.id,
      email: user.email,
      accountType: user.billingStatus 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { client } = tenantManager.getGlobalClient();

    // Find session
    const sessionResult = await client
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.token, token))
      .limit(1);

    if (sessionResult.length === 0 || new Date() > sessionResult[0].expiresAt) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const userId = sessionResult[0].userId;

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
      accountType: user.billingStatus,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch session info', details: error.message });
  }
};
