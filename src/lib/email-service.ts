import nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize SMTP transporter only
    this.initializeSMTP();
  }

  private initializeSMTP() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.error('EmailService: SMTP credentials not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('EmailService: SMTP transporter initialized');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM || 'noreply@srm-sm.com';

      // Use SMTP only
      if (this.transporter) {
        console.log('EmailService: Attempting to send via SMTP');

        const smtpOptions = {
          from,
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments?.map(attachment => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
          })),
        };

        const result = await this.transporter.sendMail(smtpOptions);
        console.log('EmailService: SMTP email sent successfully:', result.messageId);
        return true;
      }

      console.error('EmailService: No email service available');
      return false;
    } catch (error) {
      console.error('EmailService: Failed to send email:', error);
      return false;
    }
  }

  async sendReportEmail(
    to: string[],
    subject: string,
    reportBuffer: Buffer,
    fileName: string,
    reportType: 'intervention' | 'reclamation'
  ): Promise<boolean> {
    console.log(`EmailService: Sending ${reportType} report to:`, to);

    const emailOptions: EmailOptions = {
      to,
      subject,
      text: `Please find the attached ${reportType} report.`,
      attachments: [
        {
          filename: fileName,
          content: reportBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
    };

    return this.sendEmail(emailOptions);
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
