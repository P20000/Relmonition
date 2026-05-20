import { z, ZodError } from 'zod';

// Auth validation
export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

// Tenant validation
export const createTenantSchema = z.object({
  tenantName: z.string().min(1, 'Tenant name is required').max(100),
  label: z.string().max(100).optional(),
});

export const joinTenantSchema = z.object({
  connectionCode: z.string().length(6, 'Connection code must be exactly 6 characters'),
  label: z.string().max(100).optional(),
});

// Journal validation
export const createJournalSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().max(50).optional(),
});

// AI Configuration validation
export const createAIConfigSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  apiKey: z.string().min(1, 'API key is required'),
  modelName: z.string().min(1, 'Model name is required'),
  settings: z.record(z.string(), z.any()).optional(),
});

// Coach validation
export const uploadChatSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileContent: z.string().min(1, 'File content is required'),
  fileSize: z.number().positive('File size must be positive'),
});

// Generic middleware validation helper
export const validateBody = (schema: z.ZodSchema) => {
  return async (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.issues.map((e: any) => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      next(err);
    }
  };
};
