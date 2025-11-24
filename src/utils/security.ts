/**
 * Security utilities for input sanitization and validation
 */

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load environment variables
loadEnv();

/**
 * Environment variable schema
 */
const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().optional(),
  POLYMIND_PROVIDER: z.enum(['gemini', 'claude', 'gpt', 'ollama']).default('gemini'),
  MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(10),
  MAX_TOKENS_PER_REQUEST: z.coerce.number().int().positive().default(4000),
  DEBUG: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): { success: boolean; errors?: string[] } {
  const result = EnvSchema.safeParse(process.env);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Check if at least one API key is configured
  const env = result.data;
  const hasApiKey = env.GEMINI_API_KEY || env.CLAUDE_API_KEY || env.OPENAI_API_KEY || env.OLLAMA_BASE_URL;
  
  if (!hasApiKey) {
    return {
      success: false,
      errors: ['No API keys configured. Please set at least one provider API key in .env'],
    };
  }

  return { success: true };
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim excessive whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  // Limit length
  const MAX_INPUT_LENGTH = 10000;
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH);
  }
  
  return sanitized;
}

/**
 * Validate user input
 */
export function validateInput(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (input.length > 10000) {
    return { valid: false, error: 'Input too long (max 10,000 characters)' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\x00/, // Null bytes
    /[\x01-\x08\x0B-\x0C\x0E-\x1F]/, // Control characters (excluding \t, \n, \r)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { valid: false, error: 'Input contains invalid characters' };
    }
  }

  return { valid: true };
}

/**
 * Redact sensitive information from strings
 */
export function redactSensitive(text: string): string {
  // Redact API keys (40+ character alphanumeric strings)
  let redacted = text.replace(/[a-zA-Z0-9_-]{40,}/g, '[REDACTED]');
  
  // Redact email addresses
  redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  
  // Redact URLs with credentials
  redacted = redacted.replace(/https?:\/\/[^:]+:[^@]+@/g, 'https://[CREDENTIALS_REDACTED]@');
  
  return redacted;
}

/**
 * Simple rate limiter
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number = 10, windowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  /**
   * Check if request is allowed
   */
  check(): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    
    // Remove old requests outside window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    this.requests.push(now);
    return { allowed: true };
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string, provider: string): boolean {
  switch (provider) {
    case 'gemini':
      // Google API keys typically start with AIzaSy and are 39 chars
      return /^AIzaSy[A-Za-z0-9_-]{33}$/.test(key);
    
    case 'claude':
      // Anthropic keys start with sk-ant-
      return /^sk-ant-[A-Za-z0-9_-]+$/.test(key);
    
    case 'gpt':
      // OpenAI keys start with sk-
      return /^sk-[A-Za-z0-9]{48}$/.test(key);
    
    default:
      // Generic validation - at least 20 chars, alphanumeric with dashes/underscores
      return /^[A-Za-z0-9_-]{20,}$/.test(key);
  }
}

/**
 * Safe error message for users (no stack traces or sensitive info)
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Redact sensitive info from error message
    return redactSensitive(error.message);
  }
  return 'An unexpected error occurred';
}
