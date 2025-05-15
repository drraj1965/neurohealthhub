import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
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
    // Check if SendGrid API key is available
    if (!sendgridApiKey) {
      console.error('SendGrid API key is not set');
      return false;
    }

    console.log('Sending email to:', params.to);

    const msg = {
      to: params.to,
      from: 'noreply@sendgrid.net', // Ensure this email is a verified sender in SendGrid
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    };

    await sgMail.send(msg); // Send the email using SendGrid
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);  // Detailed error logging
    return false;
  }
}

// Twilio WhatsApp service (placeholder for future implementation)
export async function sendWhatsApp(params: WhatsAppParams): Promise<boolean> {
  try {
    // Log the WhatsApp message for now as we don't have Twilio credentials yet
    console.log('Would send WhatsApp message:', params);
    
    // In the future, you can implement the Twilio logic here
    
    return true; // Returning true to avoid blocking workflow in the meantime
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);  // Detailed error logging
    return false;
  }
}