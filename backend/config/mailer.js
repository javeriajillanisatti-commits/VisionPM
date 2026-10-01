const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  pool: true,         
  maxConnections: 3,
  maxMessages: 100,
  family: 4,           
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const warmUp = () =>
  transporter
    .verify()
    .then(() => console.log("Mailer ready (SMTP connection warmed up)"))
    .catch((err) => console.error("Mailer warm-up failed:", err.message));

const RETRY_DELAYS = [2000, 5000];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const sendWithRetry = async (mailOptions) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (err) {
      lastError = err;
      
      if (err.responseCode >= 500 && err.responseCode < 600) break;
      if (attempt < RETRY_DELAYS.length) await wait(RETRY_DELAYS[attempt]);
    }
  }
  throw lastError;
};

const sendMailInBackground = (mailOptions, { label = "Email", onSuccess, onError } = {}) => {
  sendWithRetry(mailOptions)
    .then(() => {
      console.log(`${label} sent to: ${mailOptions.to}`);
      if (onSuccess) Promise.resolve(onSuccess()).catch(() => {});
    })
    .catch((err) => {
      console.error(`${label} FAILED (${mailOptions.to}):`, err.message);
      if (onError) Promise.resolve(onError(err)).catch(() => {});
    });
};

module.exports = transporter;
module.exports.warmUp = warmUp;
module.exports.sendMailInBackground = sendMailInBackground;
