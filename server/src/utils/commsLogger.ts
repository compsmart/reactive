import * as fs from 'fs';
import * as path from 'path';

// Base logs directory (relative to server root)
const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const EMAIL_LOGS_DIR = path.join(LOGS_DIR, 'email');
const SMS_LOGS_DIR = path.join(LOGS_DIR, 'sms');

// Ensure directories exist
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Generate a slug from text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Generate timestamp for filename
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .substring(0, 19);
}

// Email log structure
interface EmailLogData {
  to: string;
  subject: string;
  body: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

// SMS log structure
interface SmsLogData {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an email to a JSON file instead of sending
 */
export function logEmail(data: EmailLogData): string {
  ensureDirectoryExists(EMAIL_LOGS_DIR);
  
  const timestamp = getTimestamp();
  const subjectSlug = slugify(data.subject);
  const filename = `${timestamp}_${subjectSlug}.json`;
  const filepath = path.join(EMAIL_LOGS_DIR, filename);
  
  const logEntry = {
    type: 'email',
    timestamp: new Date().toISOString(),
    to: data.to,
    subject: data.subject,
    body: data.body,
    html: data.html,
    metadata: data.metadata || {},
  };
  
  fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));
  
  console.log(`📧 [TEST MODE] Email logged to: ${filepath}`);
  return filepath;
}

/**
 * Log an SMS to a JSON file instead of sending
 */
export function logSms(data: SmsLogData): string {
  ensureDirectoryExists(SMS_LOGS_DIR);
  
  const timestamp = getTimestamp();
  const phoneSlug = data.to.replace(/\D/g, '').slice(-10);
  const filename = `${timestamp}_${phoneSlug}.json`;
  const filepath = path.join(SMS_LOGS_DIR, filename);
  
  const logEntry = {
    type: 'sms',
    timestamp: new Date().toISOString(),
    to: data.to,
    message: data.message,
    metadata: data.metadata || {},
  };
  
  fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));
  
  console.log(`📱 [TEST MODE] SMS logged to: ${filepath}`);
  return filepath;
}

/**
 * Log a job outreach (both email and SMS) for a contractor
 */
export function logJobOutreach(params: {
  contractorName: string;
  contractorEmail?: string | null;
  contractorPhone?: string | null;
  jobTitle: string;
  jobDescription: string;
  jobLocation: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}): { emailPath?: string; smsPath?: string } {
  const result: { emailPath?: string; smsPath?: string } = {};
  
  // Log email if contractor has email
  if (params.contractorEmail) {
    const emailSubject = `New Job Request: ${params.jobTitle}`;
    const emailBody = `
Hello ${params.contractorName},

You have received a new job request through Reactive:

Job: ${params.jobTitle}
Location: ${params.jobLocation}

Description:
${params.jobDescription}

${params.customerName ? `Customer: ${params.customerName}` : ''}
${params.customerEmail ? `Email: ${params.customerEmail}` : ''}
${params.customerPhone ? `Phone: ${params.customerPhone}` : ''}

Please log in to your dashboard to respond to this request.

Best regards,
The Reactive Team
    `.trim();

    result.emailPath = logEmail({
      to: params.contractorEmail,
      subject: emailSubject,
      body: emailBody,
      metadata: {
        contractorName: params.contractorName,
        jobTitle: params.jobTitle,
        jobLocation: params.jobLocation,
      },
    });
  }
  
  // Log SMS if contractor has phone
  if (params.contractorPhone) {
    const smsMessage = `Reactive: New job request "${params.jobTitle}" in ${params.jobLocation}. Log in to view details and respond.`;
    
    result.smsPath = logSms({
      to: params.contractorPhone,
      message: smsMessage,
      metadata: {
        contractorName: params.contractorName,
        jobTitle: params.jobTitle,
        jobLocation: params.jobLocation,
      },
    });
  }
  
  return result;
}

