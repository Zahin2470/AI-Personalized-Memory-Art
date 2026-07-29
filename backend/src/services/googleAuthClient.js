const { OAuth2Client } = require('google-auth-library');

const isConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID);

let client = null;
const getClient = () => {
  if (!client) client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return client;
};

/**
 * Verifies a Google ID token (the `credential` returned by Google Identity
 * Services in the browser) and returns its payload - { sub, email, name, ... }.
 * Throws if the token is invalid, expired, or wasn't issued for our client ID.
 */
const verifyIdToken = async (idToken) => {
  if (!isConfigured()) throw new Error('Google sign-in is not configured - set GOOGLE_CLIENT_ID');

  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

module.exports = { isConfigured, verifyIdToken };
