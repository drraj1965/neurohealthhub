// Notification service for sending emails and WhatsApp messages
import { MailService } from '@sendgrid/mail';

// Initialize SendGrid
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface WhatsAppParams {
  to: string;
  body: string;
}

// SendGrid email service
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is not set');
      return false;
    }
    
    console.log('Sending email to:', params.to);
    
    const msg = {
      to: params.to,
      from: 'neurohealthhub@gmail.com', // Using Gmail - replace with your verified sender
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    };
    
    await mailService.send(msg);
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Twilio WhatsApp service
export async function sendWhatsApp(params: WhatsAppParams): Promise<boolean> {
  try {
    // We'll log the WhatsApp message for now as we don't have Twilio credentials
    console.log('Would send WhatsApp message:', params);
    
    // For future implementation with Twilio
    // Currently just returning success to avoid blocking the workflow
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}
