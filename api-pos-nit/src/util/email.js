const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    requireTLS: true, // Force TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send Subscription Expiry Reminder Email
 * @param {string} to - Recipient email
 * @param {string} businessName - Name of the business
 * @param {number} daysLeft - Number of days remaining
 */
exports.sendExpiryReminder = async (to, businessName, daysLeft) => {
    try {
        const subject = daysLeft === 0 
            ? `Action Required: Your Subscription for ${businessName} has Expired`
            : `Reminder: Your Subscription for ${businessName} expires in ${daysLeft} days`;

        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1e4a2d;">Subscription Reminder</h2>
                <p>Hello,</p>
                <p>This is a reminder that the subscription for your business <strong>${businessName}</strong> ${daysLeft === 0 ? 'has expired today' : `will expire in <strong>${daysLeft} days</strong>`}.</p>
                <p>To avoid any service interruption or being downgraded to the Free Plan, please renew your subscription as soon as possible.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || 'https://pos-coffee-web-production.up.railway.app'}/my-plan" 
                       style="background: #1e4a2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                       Renew Subscription Now
                    </a>
                </div>
                <p style="font-size: 12px; color: #666;">If you have already renewed, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                <p style="font-size: 11px; color: #999;">Sent by Coffee POS Platform Admin</p>
            </div>
        `;

        const info = await transporter.sendMail({
            from: `"Coffee POS Platform" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });

        console.log(`[EMAIL] Expiry reminder sent to ${to} (${daysLeft} days left). ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("[EMAIL ERROR] Failed to send reminder:", error.message);
        return null;
    }
};

exports.sendWelcomeEmail = async (to, businessName, ownerName, verifyToken) => {
    try {
        const subject = `Welcome to Coffee POS Platform - Please Verify Your Email`;
        const verifyLink = `${process.env.CLIENT_URL || 'https://pos-coffee-web-production.up.railway.app'}/verify-email?token=${verifyToken}&email=${to}`;
        
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1e4a2d;">Welcome to Coffee POS Platform!</h2>
                <p>Hello <strong>${ownerName}</strong>,</p>
                <p>Congratulations! Your business <strong>${businessName}</strong> has been successfully registered.</p>
                <p>To activate your account and start using the platform, please verify your email address by clicking the button below:</p>
                <div style="margin: 30px 0;">
                    <a href="${verifyLink}" 
                       style="background: #1e4a2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                       Verify Email & Activate Account
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="font-size: 12px; color: #666;">${verifyLink}</p>
                <p>Once verified, you can log in with: <strong>${to}</strong></p>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                <p style="font-size: 11px; color: #999;">Sent by Coffee POS Platform Admin</p>
            </div>
        `;

        const info = await transporter.sendMail({
            from: `"Coffee POS Platform" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });

        console.log(`[EMAIL] Welcome email sent to ${to}. ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("[EMAIL ERROR] Failed to send welcome email:", error.message);
        return null;
    }
};
