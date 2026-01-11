import { z, ZodSchema } from 'zod';

// Reusable schemas
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Allowed roles for self-registration (ADMIN cannot self-register)
const selfRegisterRoleSchema = z.enum([
  'EMPLOYEE',
  'SUBCONTRACTOR',
  'CUST_RESIDENTIAL',
  'CUST_COMMERCIAL'
], {
  errorMap: () => ({ message: 'Invalid role. ADMIN accounts cannot be self-registered.' })
});

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: selfRegisterRoleSchema,
  // Contractor fields (optional, validated conditionally)
  skills: z.array(z.string()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  hourlyRate: z.number().positive().optional(),
  // Customer fields (optional, validated conditionally)
  address: z.string().max(500).optional(),
  billingInfo: z.string().max(1000).optional(),
}).refine((data) => {
  // If SUBCONTRACTOR, skills should be provided
  if (data.role === 'SUBCONTRACTOR') {
    return data.skills && data.skills.length > 0;
  }
  return true;
}, {
  message: 'Contractors must provide at least one skill',
  path: ['skills']
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Job schemas
export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  budget: z.number().positive().optional(),
  location: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const placeBidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
  notes: z.string().max(1000).optional(),
});

export const assignJobSchema = z.object({
  contractorId: z.number().int().positive('Invalid contractor ID'),
});

// Type exports for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export type AssignJobInput = z.infer<typeof assignJobSchema>;

// Validation result type - discriminated union for proper type narrowing
type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; errors: string[] };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// Validation helper with proper typing
export function validate<T extends ZodSchema>(
  schema: T, 
  data: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`),
  };
}
