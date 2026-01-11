import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { config } from '../utils/config';
import { registerSchema, loginSchema, validate, RegisterInput, LoginInput } from '../utils/validation';
import { logEmail } from '../utils/commsLogger';

export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = validate(registerSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const { email, password, role, skills, latitude, longitude, hourlyRate, address, billingInfo } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password with strong salt rounds
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: 'PENDING', // Require admin approval in production
        ...(role === 'SUBCONTRACTOR' && {
          contractorProfile: {
            create: {
              skills: skills || [],
              latitude: latitude || null,
              longitude: longitude || null,
              hourlyRate: hourlyRate || null,
            }
          }
        }),
        ...((role === 'CUST_RESIDENTIAL' || role === 'CUST_COMMERCIAL') && {
          customerProfile: {
            create: {
              address: address || null,
              billingInfo: billingInfo || null,
              type: role === 'CUST_RESIDENTIAL' ? 'Residential' : 'Commercial'
            }
          }
        })
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration. Please try again.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = validate(loginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Use constant-time comparison to prevent timing attacks
    if (!user) {
      // Still hash to prevent timing attacks that reveal if email exists
      await bcrypt.hash(password, 12);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        contractorProfile: true,
        customerProfile: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'An error occurred while fetching your profile' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      // Simulate processing time to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.json({ 
        message: 'If an account with that email exists, you will receive a password reset link shortly.' 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save hashed token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Generate reset URL (frontend URL)
    const resetUrl = `http://localhost:3020/auth/reset-password?token=${resetToken}`;

    // Send email (or log in test mode)
    const emailBody = `
Hello,

You requested a password reset for your Reactive account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email. Your password will remain unchanged.

Best regards,
The Reactive Team
    `.trim();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #E86A33, #d45a28); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>You requested a password reset for your Reactive account.</p>
    <p>Click the button below to reset your password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
    <div class="footer">
      <p>Best regards,<br>The Reactive Team</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    if (config.TEST_MODE) {
      logEmail({
        to: email,
        subject: 'Reset Your Reactive Password',
        body: emailBody,
        html: emailHtml,
        metadata: {
          userId: user.id,
          resetToken: resetToken, // Include for testing purposes
          resetUrl: resetUrl,
        },
      });
    } else {
      // TODO: Implement real email sending (SendGrid, AWS SES, etc.)
      console.log(`Would send password reset email to ${email}`);
    }

    res.json({ 
      message: 'If an account with that email exists, you will receive a password reset link shortly.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Log the password change for security audit
    console.log(`Password reset completed for user ${user.id} (${user.email})`);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};
