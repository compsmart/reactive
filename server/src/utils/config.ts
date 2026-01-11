import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`❌ FATAL: Environment variable ${name} is required but not set.`);
  }
  return value || '';
}

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security - REQUIRED, no fallbacks
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // External APIs
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY || '',
  
  // Test mode - logs comms to files instead of sending
  TEST_MODE: process.env.TEST_MODE === 'true',
};

