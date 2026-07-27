const axios = require('axios');

// Both sandbox and live SSLCommerz environments serve the session-init and
// validation APIs from the same base domain.
const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const BASE_URL = isLive ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';

const isConfigured = () =>
  Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);

// Talks to SSLCommerz's REST API directly rather than through the
// `sslcommerz-lts` package - that package pulls in a `form-data` version
// with an open CRLF-injection advisory that has no available fix (confirmed
// via `npm audit`). The REST shape below is taken directly from SSLCommerz's
// own documented curl examples, so there's no real loss of correctness here,
// just one fewer (vulnerable) dependency.

/**
 * Starts a payment session. `data` should include tran_id, amounts,
 * success/fail/cancel/ipn URLs, and the customer/shipping fields SSLCommerz
 * requires. Returns the parsed JSON response - callers read `.GatewayPageURL`.
 */
const initSession = async (data) => {
  if (!isConfigured()) {
    throw new Error('SSLCommerz is not configured - set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD');
  }

  const params = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
  });
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });

  const { data: response } = await axios.post(`${BASE_URL}/gwprocess/v4/api.php`, params);
  return response;
};

/**
 * Confirms a transaction is genuinely valid before trusting it - called from
 * both the success-redirect handler and the IPN handler. SSLCommerz's own
 * redirect/IPN payloads are not sufficient proof on their own (a browser
 * POST can be forged); this calls their server-to-server Validation API,
 * which is the documented way to confirm a val_id is real.
 */
const validateTransaction = async (valId) => {
  if (!isConfigured()) throw new Error('SSLCommerz is not configured');

  const { data } = await axios.get(`${BASE_URL}/validator/api/validationserverAPI.php`, {
    params: {
      val_id: valId,
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      format: 'json',
    },
  });

  return data;
};

const isValidStatus = (status) => status === 'VALID' || status === 'VALIDATED';

module.exports = { isConfigured, initSession, validateTransaction, isValidStatus };
