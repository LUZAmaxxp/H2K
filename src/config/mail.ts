export const MAIL = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER || "allouchayman70@gmail.com",
    pass: process.env.SMTP_PASS || "kskaxgomcoxvzxqo",
  },
  from: process.env.SMTP_SENDER || "noreply@srm-sm.com",
  logger: true,
  debug: true,
};

// Log configuration for debugging (remove in production)
console.log("MAIL configuration loaded:", {
  host: MAIL.host,
  port: MAIL.port,
  secure: MAIL.secure,
  from: MAIL.from,
  authUser: MAIL.auth.user ? "SET" : "NOT SET",
  authPass: MAIL.auth.pass ? "SET" : "NOT SET",
});
