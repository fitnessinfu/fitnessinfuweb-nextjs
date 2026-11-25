import nodemailer from 'nodemailer';

/**
 * Configure SMTP transporter using environment variables.
 * Falls back to console logging if SMTP settings are not provided.
 */
function getEmailTransporter() {
  const rawHost = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();

  if (!user || !rawPass) {
    return null;
  }

  // Clean password (strips spaces if pasted from Google App Password format "xxxx xxxx xxxx xxxx")
  const pass = rawPass.replace(/\s+/g, '');

  // Check if Gmail is used
  const isGmail = (user && user.toLowerCase().endsWith('@gmail.com')) || (rawHost && rawHost.toLowerCase().includes('gmail'));

  if (isGmail) {
    // Nodemailer's built-in 'gmail' service is optimized for Google's SMTP infrastructure
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  const host = rawHost && rawHost !== 'smtp.example.com' ? rawHost : null;
  if (!host) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generate HTML template for the 4-digit OTP email.
 */
function getOtpEmailHtml({ otp, name }) {
  const digits = String(otp).split('');
  const recipientName = name ? name.trim() : 'Athlete';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fitnessinfu Email Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #06101e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #06101e;
      padding: 40px 16px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #0d1b35;
      border: 1px solid #1a2f55;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #091322 0%, #102140 100%);
      padding: 30px 32px 24px;
      border-bottom: 2px solid #f07c20;
      text-align: center;
    }
    .brand-title {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .brand-accent {
      color: #f07c20;
    }
    .tagline {
      margin: 6px 0 0;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 28px;
    }
    .otp-card {
      background: #071120;
      border: 1px solid #23395d;
      border-radius: 6px;
      padding: 24px 16px;
      text-align: center;
      margin: 0 0 28px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #f07c20;
      margin-bottom: 12px;
    }
    .otp-digits {
      display: inline-block;
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #ffffff;
      padding-left: 12px;
      font-family: 'Courier New', Courier, monospace;
    }
    .expiry-note {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 10px;
    }
    .security-notice {
      background: rgba(240, 124, 32, 0.08);
      border-left: 3px solid #f07c20;
      padding: 12px 14px;
      font-size: 12px;
      line-height: 1.5;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .footer {
      background: #071120;
      padding: 20px 32px;
      border-top: 1px solid #1a2f55;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">FITNESS<span class="brand-accent">INFU</span></h1>
        <p class="tagline">Learn · Perform · Transform</p>
      </div>
      <div class="content">
        <p class="greeting">Welcome, ${recipientName}!</p>
        <p class="message">
          Thank you for signing up with Fitnessinfu Performance & Wellness.
          To complete your athlete registration and secure your account, please enter the 4-digit verification code below:
        </p>

        <div class="otp-card">
          <div class="otp-label">Email Verification Code</div>
          <div class="otp-digits">${digits.join('')}</div>
          <div class="expiry-note">Valid for 10 minutes</div>
        </div>

        <div class="security-notice">
          <strong>Security Notice:</strong> Never share this code with anyone. Fitnessinfu coaches or support will never ask you for your verification code.
        </div>

        <p class="message" style="margin-bottom: 0; font-size: 12px; color: #94a3b8;">
          If you did not initiate this registration, please disregard this email.
        </p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Fitnessinfu. All rights reserved.<br>
        Elevate your athletic potential with science-backed training.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send 4-digit OTP email to recipient.
 * Falls back to formatted console log when SMTP is not configured or in dev.
 */
export async function sendOtpEmail({ toEmail, otp, name }) {
  const normalizedEmail = (toEmail || '').trim().toLowerCase();
  const transporter = getEmailTransporter();
  const fromAddress = process.env.SMTP_FROM || `"Fitnessinfu" <${process.env.SMTP_USER || 'no-reply@fitnessinfu.com'}>`;

  // Always log OTP in terminal for immediate developer convenience
  console.log('\n======================================================');
  console.log('⚡ [FITNESSINFU EMAIL SERVICE]');
  console.log(`✉️  Recipient : ${normalizedEmail}`);
  console.log(`🔑 4-Digit OTP: >>> ${otp} <<<`);
  console.log('⏳ Expires in : 10 minutes');
  console.log('======================================================\n');

  if (!transporter) {
    return {
      success: true,
      mode: 'console',
      message: 'OTP logged to server console (SMTP not configured in environment).',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: normalizedEmail,
      subject: `${otp} is your Fitnessinfu verification code`,
      text: `Hello ${name || 'Athlete'},\n\nYour 4-digit Fitnessinfu email verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nLearn · Perform · Transform\nFitnessinfu Team`,
      html: getOtpEmailHtml({ otp, name }),
    });

    console.log(`✅ [EMAIL DELIVERED] Successfully sent to ${normalizedEmail} (Message ID: ${info.messageId})`);

    return {
      success: true,
      mode: 'smtp',
      messageId: info.messageId,
    };
  } catch (error) {
    console.warn('\n⚠️  [GMAIL SMTP AUTHENTICATION NOTICE]');
    console.warn(`Error: ${error.message}`);
    console.warn('Reason: Google rejected the credentials for', process.env.SMTP_USER);
    console.warn('To resolve for live inbox delivery:');
    console.warn('1. Ensure 2-Step Verification is ON in your Google Account.');
    console.warn('2. Visit: https://myaccount.google.com/apppasswords');
    console.warn('3. Create a new App Password (16 characters).');
    console.warn('4. Update SMTP_PASS in .env.local.\n');

    return {
      success: false,
      mode: 'fallback-console',
      warning: `SMTP delivery failed (${error.message}). Code logged to console.`,
      error: error.message,
    };
  }
}
