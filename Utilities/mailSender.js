const { Resend } = require("resend");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

exports.mailSender = async (email, title, body) => {
  try {
    // ==================== RESEND (Active) ====================
    const fromAddress = process.env.RESEND_FROM || "Ujjain Darshan <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(email) ? email : [email],
      subject: `${title}`,
      html: `${body}`,
    });

    if (error) {
      console.error("Resend Error while sending email:", error);
      return { success: false, error };
    }

    // console.log("Email sent successfully with Resend:", data);
    return data;

    /*
    // ==================== NODEMAILER (Preserved Code) ====================
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let mailsended = await transporter.sendMail({
      from: "K-TECH || by krishna gothwal",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    // console.log(mailsended);
    return mailsended;
    // ======================================================================
    */
  } catch (error) {
    console.error("Error in mailSender:", error);
  }
};

