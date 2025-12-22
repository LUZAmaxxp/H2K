import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import {MongoClient} from "mongodb";  
import { MAIL } from "@/config/mail";
import { organization, magicLink } from "better-auth/plugins";
const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
const db = client.db();
export const auth = betterAuth({
  plugins: [
    organization({
      teams: {
        enabled: true,
        maximumTeams: 10,
        allowRemovingAllTeams: false,
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Use nodemailer to send the magic link email
        const nodemailer = await import("nodemailer");

        const transporter = nodemailer.createTransport({
          host: MAIL.host,
          port: MAIL.port,
          secure: MAIL.secure,
          auth: MAIL.auth,
        });

        // Format timestamp for subject line
        const now = new Date();
        const timeString = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const dateString = now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        await transporter.sendMail({
          from: MAIL.from || "no_reply@notify.srm-sm.io",
          to: email,
          subject: `SRM-SM - Magic Link Sign In (${dateString} at ${timeString})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Magic Link Sign In - SRM-SM</title>
            </head>
            <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background:#ffffff;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.1);">
                  <img src="${url.split("/api")[0]}/LOGO-SOUSS-MASSA-1033x308px-removebg-preview.png" alt="SRM-SM" style="width:120px;height:auto;margin-bottom:24px;" />
                  <h1 style="color:#333333;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Magic Link Sign In</h1>
                  <p style="color:#666666;margin:12px 0 0 0;font-size:16px;">Secure passwordless access to your account</p>
                </div>
                
                <!-- Content -->
                <div style="padding:40px 32px;">
                  <h2 style="color:#333333;margin:0 0 20px 0;font-size:24px;font-weight:600;">Sign In to Your Account</h2>
                  
                  <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                    You requested a magic link to sign in to the <strong>Srm-Sm</strong> platform. 
                    Click the button below to access your account instantly - no password required!
                  </p>
                  
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${url}" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:25px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(239,68,68,0.4);transition:all 0.3s ease;">
                      Sign In with Magic Link
                    </a>
                  </div>
                  
                  <div style="background:rgba(255,240,245,0.3);border-radius:12px;border-left:4px solid #ef4444;padding:24px;margin:32px 0;">
                    <h3 style="color:#333333;margin:0 0 16px 0;font-size:18px;font-weight:600;">Quick Access Awaits</h3>
                    <p style="color:#333333;margin:0 0 16px 0;font-size:14px;line-height:1.7;">
                      Once you click the link, you'll have immediate access to:
                    </p>
                    <ul style="color:#333333;margin:0;padding-left:20px;line-height:1.8;font-size:14px;">
                      <li>Dashboard access</li>
                      <li>downloading excel file</li>
                      <li>Creation of reclamations and interventions</li>
                    
                    </ul>
                  </div>
                  
                  <p style="color:#333333;font-size:14px;line-height:1.6;margin:24px 0 0 0;font-style:italic;">
                    "Experience the convenience of passwordless authentication while maintaining the highest security standards."
                  </p>
                  
                  <div style="border-top:1px solid rgba(0,0,0,0.1);padding-top:24px;margin-top:32px;">
                    <p style="color:#666666;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
                      <strong>Security Note:</strong> This magic link will expire in 10 minutes for your security.
                    </p>
                    <p style="color:#666666;font-size:14px;line-height:1.6;margin:0;">
                      If you didn't request this sign-in link, you can safely ignore this email. If you have any questions, contact us at 
                      <a href="https://www.linkedin.com/in/ayman-allouch-9019b52a0/" style="color:#ef4444;text-decoration:none;">allouchayman21@gmail.com</a>
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background:rgba(255,240,245,0.3);padding:24px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.1);">
                  <p style="color:#666666;font-size:12px;margin:0 0 8px 0;">
                    © Ayman ALLOUCH. All rights reserved.
                  </p>
                  <p style="color:#666666;font-size:12px;margin:0;">
                    This email was sent to ${email}
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      },
    }),
  ],
  database: mongodbAdapter(db, {
   client
    
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Temporarily disable email verification for testing
    sendResetPassword: async (
      { user, url }: { user: Record<string, unknown>; url: string }
    ) => {
      // Extract token from the API URL and construct frontend URL
      const urlObj = new URL(url);
      const pathnameParts = urlObj.pathname.split('/');
      const token = pathnameParts[pathnameParts.length - 1];
      const finalUrl = `${urlObj.origin}/auth/reset-password?token=${token}&email=${user.email}`;
      // Use nodemailer to send the reset password email
      const nodemailer = await import("nodemailer");

      const transporter = nodemailer.createTransport({
        host: MAIL.host,
        port: MAIL.port,
        secure: MAIL.secure,
        auth: MAIL.auth,
      });

      // Format timestamp for subject line
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const dateString = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      await transporter.sendMail({
        from: MAIL.from || "no_reply@notify.srm-sm.io",
        to: user.email as string,
        subject: `SRM-SM - Password Reset Request (${dateString} at ${timeString})`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - SRM-SM</title>
          </head>
          <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background:#ffffff;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.1);">
                <img src="${url.split("/api")[0]}/LOGO-SOUSS-MASSA-1033x308px-removebg-preview.png" alt="SRM-SM" style="width:120px;height:auto;margin-bottom:24px;" />
                <h1 style="color:#333333;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Password Reset Request</h1>
                <p style="color:#666666;margin:12px 0 0 0;font-size:16px;">Secure password recovery for your account</p>
              </div>
              
              <!-- Content -->
              <div style="padding:40px 32px;">
                <h2 style="color:#333333;margin:0 0 20px 0;font-size:24px;font-weight:600;">Reset Your Password</h2>
                
                <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  We received a request to reset the password for your <strong>SRM-SM</strong> account. 
                  Click the button below to create a new password and regain access to your account.
                </p>
                
                <div style="text-align:center;margin:32px 0;">
                  <a href="${finalUrl}" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:25px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(239,68,68,0.4);transition:all 0.3s ease;">
                    Reset My Password
                  </a>
                </div>
                
                <div style="background:rgba(255,240,245,0.3);border-radius:12px;border-left:4px solid #ef4444;padding:24px;margin:32px 0;">
                  <h3 style="color:#333333;margin:0 0 16px 0;font-size:18px;font-weight:600;">Security Information</h3>
                  <p style="color:#333333;margin:0 0 16px 0;font-size:14px;line-height:1.7;">
                    For your security, please note:
                  </p>
                  <ul style="color:#333333;margin:0;padding-left:20px;line-height:1.8;font-size:14px;">
                    <li>This password reset link will expire in 10 minutes</li>
                    <li>You can only use this link once</li>
                    <li>After resetting, you'll need to sign in with your new password</li>
                    <li>We'll never ask for your password via email or phone</li>
                  </ul>
                </div>
                
                <p style="color:#333333;font-size:14px;line-height:1.6;margin:24px 0 0 0;font-style:italic;">
                  "Your account security is our top priority. Take a moment to choose a strong, unique password that you haven't used elsewhere."
                </p>
                
                <div style="border-top:1px solid rgba(0,0,0,0.1);padding-top:24px;margin-top:32px;">
                  <p style="color:#666666;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
                    <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. 
                    Your account remains secure and no changes have been made.
                  </p>
                  <p style="color:#666666;font-size:14px;line-height:1.6;margin:0;">
                    If you have any questions or concerns, contact us at 
                    <a href="https://www.linkedin.com/in/ayman-allouch-9019b52a0/" style="color:#ef4444;text-decoration:none;">Ayman ALLOUCH</a>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background:rgba(255,240,245,0.3);padding:24px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.1);">
                <p style="color:#666666;font-size:12px;margin:0 0 8px 0;">
                  © Ayma ALLOUCH. All rights reserved.
                  </p>
                  <p style="color:#666666;font-size:12px;margin:0;">
                    This email was sent to ${user.email}
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Use nodemailer to send the verification email
      const nodemailer = await import("nodemailer");

      const transporter = nodemailer.createTransport({
        host: MAIL.host,
        port: MAIL.port,
        secure: MAIL.secure,
        auth: MAIL.auth,
      });

      await transporter.sendMail({
        from: MAIL.from || "no_reply@notify.SRM-SM.io",
        to: user.email as string,
        subject: "Welcome to SRM-SM - Verify Your Email Address",
        text: `
Welcome to Sociéte Regionale Multiservices - SOUSS MASSA!

Thank you for joining our research platform. To complete your registration and secure your account, please verify your email address by clicking the link below:

${url}

This verification link will expire in 24 hours for security reasons.

Once verified, you'll have access to:
• Dashboard access
• Downloading excel file
• Creation of reclamations and interventions




If you didn't create this account, you can safely ignore this email.

Best regards,
Ayman ALLOUCH
Need help? Contact us at  allouchayman21@gmail.com
        `,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to SRM-SM</title>
          </head>
          <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background:#ffffff;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.1);">
                <img src="${url.split("/api")[0]}/LOGO-SOUSS-MASSA-1033x308px-removebg-preview.png" alt="SRM-SM" style="width:120px;height:auto;margin-bottom:24px;" />
                <h1 style="color:#333333;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Welcome to SRM-SM!</h1>
                <p style="color:#666666;margin:12px 0 0 0;font-size:16px;">Sociéte Regionale Multiservices - SOUSS MASSA</p>
              </div>
              
              <!-- Content -->
              <div style="padding:40px 32px;">
                <h2 style="color:#333333;margin:0 0 20px 0;font-size:24px;font-weight:600;">Verify Your Email Address</h2>
                
                <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  Thank you for joining the <strong>SRM-SM</strong>! To complete your registration and secure your account, please verify your email address.
                </p>
                
                <div style="text-align:center;margin:32px 0;">
                  <a href="${url}" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:25px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(239,68,68,0.4);transition:all 0.3s ease;">
                    Verify Email Address
                  </a>
                </div>
                
                
                
                <div style="border-top:1px solid rgba(0,0,0,0.1);padding-top:24px;margin-top:32px;">
                  <p style="color:#666666;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
                    <strong>Security Note:</strong> This verification link will expire in 24 hours for your security.
                  </p>
                  <p style="color:#666666;font-size:14px;line-height:1.6;margin:0;">
                    If you didn't create this account, you can safely ignore this email. If you have any questions, contact us at 
                    <a href="https://www.linkedin.com/in/ayman-allouch-9019b52a0/" style="color:#ef4444;text-decoration:none;">Ayman ALLOUCH</a>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background:rgba(255,240,245,0.3);padding:24px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.1);">
                <p style="color:#666666;font-size:12px;margin:0 0 8px 0;">
                  © 2024 Ayman ALLOUCH. All rights reserved.
                </p>
                <p style="color:#666666;font-size:12px;margin:0;">
                  This email was sent to ${user.email}
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    },
  },
  resetPassword: {
    enabled: true,
    redirectTo: "/auth/reset-password",
  },
  emailProvider: {
    host: MAIL.host,
    port: MAIL.port,
    secure: MAIL.secure,
    auth: {
      user: MAIL.auth.user,
      pass: MAIL.auth.pass,
    },
    from: MAIL.from || "no-reply@fevertokens.io",
  },
  socialProviders: {
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
  },
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "your-super-secret-key-here-minimum-32-characters-for-testing",
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
});

console.log("Better-auth initialized successfully");

export const GET = auth.handler;
export const POST = auth.handler;
