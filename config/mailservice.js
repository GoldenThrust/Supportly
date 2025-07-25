// services/mail.service.js
import { createTransport } from "nodemailer";
import { TemplateEngine } from "../utils/template-engine.js";
import { DEV, apiUrl } from "../utils/constants.js";
import process from "process";

class MailService {
  constructor() {
    this.apiUrl = apiUrl;
    this.appName = "Supportly - support made easy";
    this.transporter = createTransport(this.getConfig());
  }

  getConfig() {
    return DEV ? {
      host: '0.0.0.0',
      port: 1025,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    } : {
      service: "Gmail",
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    };
  }

  async sendEmail(mailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.appName}" <${process.env.MAIL_USERNAME}>`,
        ...mailOptions
      });
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendEmailVerification(user, token) {
    const link = `${this.apiUrl}/api/auth/verify-email/${token}`;
    console.log("Verification link:", link);

    const html = await TemplateEngine.render('verify-email', {
      appName: this.appName,
      user,
      link
    });

    return this.sendEmail({
      to: user.email,
      subject: "Verify Your Email Address",
      text: `Please use this link to verify your email: ${link}`,
      html
    });
  }

  async sendResetPassword(user, token) {
    const resetLink = `${this.apiUrl}/auth/reset-password/${token}/`;
    
    const html = await TemplateEngine.render('reset-password', {
      appName: this.appName,
      user,
      resetLink
    });

    return this.sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: `Click to reset your password: ${resetLink}`,
      html
    });
  }
}

const mailService = new MailService();
export default mailService;