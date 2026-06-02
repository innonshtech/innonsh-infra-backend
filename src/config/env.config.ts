import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

let validatedEnv;
try {
  validatedEnv = envSchema.parse(process.env);
} catch (error: any) {
  console.error('❌ Environment Validation Error:', JSON.stringify(error.errors, null, 2));
  throw error;
}

export const env = validatedEnv!;
