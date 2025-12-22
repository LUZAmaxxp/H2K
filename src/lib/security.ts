import { NextRequest, NextResponse } from 'next/server';


// Security utilities and middleware

/**
 * Validate environment variables
 */
export function validateEnvironmentVariables() {
  const requiredVars = [
    'MONGODB_URI',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate file content using magic numbers
 */
export function validateFileContent(buffer: Buffer, allowedTypes: string[]): boolean {
  if (buffer.length < 4) return false;

  const magicNumbers: { [key: string]: number[] } = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
  };

  return allowedTypes.some(type => {
    const magic = magicNumbers[type];
    if (!magic) return false;

    return magic.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Security middleware for API routes
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded-proto',
    'x-forwarded-host',
  ];

  for (const header of suspiciousHeaders) {
    if (request.headers.get(header)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }

  // Check request size (max 10MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Request too large' },
      { status: 413 }
    );
  }

  return null; // Continue processing
}

/**
 * Enhanced error response that doesn't leak sensitive information
 */
export function createSecureErrorResponse(
  message: string = 'Internal server error',
  status: number = 500
): NextResponse {
  // Log the actual error for debugging (in production, use proper logging)
  console.error('Secure error response:', message);

  return NextResponse.json(
    { error: 'An error occurred. Please try again later.' },
    { status }
  );
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords (basic check)
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Audit logging
 */
export function logSecurityEvent(
  event: string,
  userId?: string,
  details?: Record<string, unknown>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId: userId || 'anonymous',
    ip: 'N/A', // Would need to be passed from middleware
    userAgent: 'N/A', // Would need to be passed from middleware
    ...details,
  };

  console.log('SECURITY EVENT:', JSON.stringify(logEntry));

  // In production, this should be sent to a logging service
  // like Winston, DataDog, or similar
}
