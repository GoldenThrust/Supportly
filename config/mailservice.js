// services/mail.service.js
import { formatDateForEmail } from "../utils/functions.js";
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

  async sendSessionConfirmation(sessionData) {
    const { 
      customerName, 
      customerEmail, 
      sessionId, 
      subject, 
      category, 
      description, 
      sessionDate 
    } = sessionData;

    const formattedDate = formatDateForEmail(sessionDate);

    const html = await TemplateEngine.render('session-confirmation', {
      appName: this.appName,
      customerName,
      sessionId,
      subject,
      category,
      description,
      sessionDate: formattedDate
    });

    return this.sendEmail({
      to: customerEmail,
      subject: `Session Confirmed - ${subject}`,
      text: `Your support session has been confirmed for ${formattedDate}. Session ID: #${sessionId}`,
      html
    });
  }

  async sendSessionReminder(sessionData) {
    const { 
      to, 
      customerName, 
      agentName, 
      sessionDate, 
      subject, 
      description, 
      category, 
      meetingLink, 
      type,
      customerEmail 
    } = sessionData;

    const formattedDate = formatDateForEmail(sessionDate);

    const templateName = type === 'agent' ? 'session-reminder-agent' : 'session-reminder-customer';
    
    const html = await TemplateEngine.render(templateName, {
      appName: this.appName,
      customerName,
      agentName,
      sessionDate: formattedDate,
      subject,
      description,
      category,
      meetingLink,
      customerEmail
    });

    const emailSubject = type === 'agent' 
      ? `Upcoming Session - ${subject}` 
      : `Your session starts in 15 minutes - ${subject}`;

    return this.sendEmail({
      to,
      subject: emailSubject,
      text: `Session reminder: ${subject} scheduled for ${formattedDate}. Join at: ${meetingLink}`,
      html
    });
  }

  async sendAgentAssignment(sessionData) {
    const { 
      customerName, 
      customerEmail, 
      agentName, 
      sessionId, 
      subject, 
      category, 
      description, 
      sessionDate,
      meetingLink 
    } = sessionData;

    const formattedDate = formatDateForEmail(sessionDate);

    const html = await TemplateEngine.render('session-confirmation', {
      appName: this.appName,
      customerName,
      sessionId,
      subject,
      category,
      description,
      sessionDate: formattedDate,
      agentName,
      meetingLink,
      isAgentAssigned: true
    });

    return this.sendEmail({
      to: customerEmail,
      subject: `Agent Assigned - ${subject}`,
      text: `Great news! ${agentName} has been assigned to your session on ${formattedDate}. Session ID: #${sessionId}`,
      html
    });
  }
}

const mailService = new MailService();
export default mailService;