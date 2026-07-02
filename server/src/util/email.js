const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

/**
 * យើងប្រើប្រាស់ Brevo HTTP API (Port 443 HTTPS) ជំនួសឲ្យ SMTP (Port 587/465) 
 * ដើម្បីជៀសវាងការបិទ Port ពីសំណាក់ cloud hosting providers និងដើម្បីអាចផ្ញើទៅកាន់ Personal Email បានយ៉ាងងាយស្រួល។
 */

const PLATFORM_SENDER_EMAIL = process.env.SENDER_EMAIL || "pongchiva257@gmail.com";
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SMTP_PASS; // Fallback to SMTP_PASS if it's the API key

const sendBrevoAPI = async ({ to, subject, htmlContent, senderName }) => {
    try {
        if (!BREVO_API_KEY) {
            console.error("[EMAIL ERROR] BREVO_API_KEY is missing!");
            return false;
        }

        const data = {
            sender: { email: PLATFORM_SENDER_EMAIL, name: senderName || "Coffee POS Platform" },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent
        };

        const response = await axios.post("https://api.brevo.com/v3/smtp/email", data, {
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            }
        });

        console.log(`[BREVO API] Email sent to ${to}. Message ID:`, response.data.messageId);
        return true;
    } catch (error) {
        console.error("[BREVO API ERROR]:", error.response ? error.response.data : error.message);
        return false;
    }
};

exports.sendExpiryReminder = async (to, businessName, daysLeft) => {
    const subject = daysLeft === 0 
        ? `Action Required: Your Subscription for ${businessName} has Expired`
        : `Reminder: Your Subscription for ${businessName} expires in ${daysLeft} days`;

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #1e4a2d;">Subscription Reminder</h2>
            <p>Hello,</p>
            <p>This is a reminder that the subscription for your business <strong>${businessName}</strong> ${daysLeft === 0 ? 'has expired today' : `will expire in <strong>${daysLeft} days</strong>`}.</p>
            <p>To avoid any service interruption, please renew your subscription.</p>
            <div style="margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/my-plan" 
                   style="background: #1e4a2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                   Renew Subscription Now
                </a>
            </div>
            <p style="font-size: 11px; color: #999;">Sent by Coffee POS Platform Admin</p>
        </div>
    `;

    return sendBrevoAPI({ to, subject, htmlContent });
};

exports.sendWelcomeEmail = async (to, businessName, ownerName, verifyToken) => {
    const subject = `Welcome to Coffee POS Platform - Please Verify Your Email`;
    const verifyLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}&email=${to}`;
    
    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #1e4a2d;">Welcome to Coffee POS Platform!</h2>
            <p>Hello <strong>${ownerName}</strong>,</p>
            <p>Congratulations! Your business <strong>${businessName}</strong> has been successfully registered.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background-color: #a4c9a8; color: #1e4a2d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email & Activate Account</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">Sent by Coffee POS Platform Admin</p>
        </div>
    `;

    return sendBrevoAPI({ to, subject, htmlContent });
};

exports.sendPasswordResetEmail = async (to, name, otpCode) => {
    const subject = `Password Reset OTP - Coffee POS Platform`;
    
    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; text-align: center;">
            <h2 style="color: #1e4a2d;">Reset Your Password</h2>
            <p style="text-align: left;">Hello <strong>${name}</strong>,</p>
            <p style="text-align: left;">We received a request to reset your password for your Coffee POS Platform account.</p>
            <p style="text-align: left;">Please use the 6-digit OTP code below to proceed with the password reset. <strong>This code will expire in 1 hour.</strong></p>
            
            <div style="background: #f8fcf9; border: 2px dashed #1e4a2d; border-radius: 12px; padding: 24px; margin: 30px 0; display: inline-block; min-width: 200px;">
                <span style="font-size: 36px; font-weight: 800; color: #1e4a2d; letter-spacing: 12px;">${otpCode}</span>
            </div>

            <p style="text-align: left;">If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">Sent by Coffee POS Platform Admin</p>
        </div>
    `;

    return sendBrevoAPI({ to, subject, htmlContent, senderName: "Coffee POS Support" });
};
