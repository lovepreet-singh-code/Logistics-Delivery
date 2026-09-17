import * as nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use Standard SMTP if credentials exist
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("📧 Mailer initialized with custom SMTP configuration");
  } else {
    // Fallback to Ethereal Email for dev testing
    console.log("📧 Creating Ethereal test account for emails...");
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log(`📧 Mailer initialized with Ethereal SMTP (Test mode)`);
  }
};

export const sendMail = async (options: MailOptions) => {
  try {
    if (!transporter) {
      await initMailer();
    }
    
    const info = await transporter!.sendMail({
      from: '"LogiCore Delivery" <no-reply@logicore.com>', // sender address
      to: options.to, // list of receivers
      subject: options.subject, // Subject line
      html: options.html, // html body
    });

    console.log(`✉️ Email sent to ${options.to}: ${info.messageId}`);
    
    // Preview URL will only be available if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`👀 Preview URL: ${previewUrl}`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};
