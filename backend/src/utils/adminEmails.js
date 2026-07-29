// ADMIN_EMAILS is a comma-separated list in .env, e.g.
// ADMIN_EMAILS=you@example.com,cofounder@example.com
const isAdminEmail = (email) => {
  if (!email || !process.env.ADMIN_EMAILS) return false;
  const admins = process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
};

module.exports = { isAdminEmail };
