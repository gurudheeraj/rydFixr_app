require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: `"RydFixr" <${process.env.EMAIL_USER}>`,
  to: 'your_email@example.com', // <- replace with your actual email to receive test
  subject: 'Test Email from RydFixr',
  text: 'This is a test email to verify Gmail setup.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Error sending test email:', error);
  } else {
    console.log('✅ Email sent:', info.response);
  }
});
