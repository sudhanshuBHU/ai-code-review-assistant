// lib/githubUtils.js

import * as crypto from 'crypto';

/**
 * Verifies the signature of an incoming GitHub webhook payload.
 * This is a CRITICAL security measure to ensure the request is from GitHub.
 * 
 * @param {Request} request The incoming Next.js Request object.
 * @param {string} payload The raw request body as a string.
 * @returns {boolean} A boolean indicating if the signature is valid.
 */
export function verifyWebhookSignature(request, payload) {
  const signatureHeader = request.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signatureHeader) {
    console.error("SecurityError: Webhook request is missing the x-hub-signature-256 header.");
    return false;
  }
  if (!secret) {
    // This is a server configuration error, so we should fail safe.
    console.error("ConfigurationError: GITHUB_WEBHOOK_SECRET is not set. Cannot verify webhook.");
    return false;
  }
  
  const signature = signatureHeader.replace('sha256=', '');
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timingSafeEqual to prevent timing attacks.
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    // This can happen if the signatures have different lengths, which is a clear sign of a mismatch.
    console.error("SecurityError: Webhook signature mismatch (timingSafeEqual failed).", error.message);
    return false;
  }
}