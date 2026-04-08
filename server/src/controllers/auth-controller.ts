import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const tenantManager = new TenantDatabaseManager();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-relmonition-key';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, coupleId } = req.body;
    const { client } = await tenantManager.provisionCoupleDatabase(coupleId, 'ap-south-1');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await client.insert(schema.users).values({
      id: crypto.randomUUID(),
      coupleId,
      email,
      passwordHash: hashedPassword,
      createdAt: new Date(),
    }).returning();

    res.status(201).json({ message: 'User created', userId: newUser[0].id });
  } catch (error: any) {
    res.status(500).json({ error: 'Signup failed', details: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, coupleId } = req.body;
    const { client } = await tenantManager.provisionCoupleDatabase(coupleId, 'ap-south-1');

    const user = await client.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    
    if (user.length === 0 || !(await bcrypt.compare(password, user[0].passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user[0].id, coupleId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, coupleId });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};
