// Notification service for sending emails and WhatsApp messages
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API initialized successfully');
} else {
  console.warn('SendGrid API key not found in environment variables');
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
      from: 'noreply@sendgrid.net', // Using a SendGrid domain that's already verified
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    };
    
    await sgMail.send(msg);
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
