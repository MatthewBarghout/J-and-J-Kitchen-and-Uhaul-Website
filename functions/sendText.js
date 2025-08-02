// functions/sendText.js

const { onCall } = require("firebase-functions/v2/https");
const logger    = require("firebase-functions/logger");
const twilioLib = require("twilio");

// Tell Cloud Functions to inject those three secrets into process.env
exports.sendText = onCall(
  {
    region: "us-central1",
    // these keys must match the secret IDs you created above
    secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
  },
  async (req) => {
    const { to, message } = req.data || {};

    if (typeof to !== "string" || typeof message !== "string") {
      throw new Error("`to` and `message` are required string fields");
    }

    // now read them from process.env
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !from) {
      logger.error("Twilio secrets not populated in env");
      throw new Error("Twilio is not configured");
    }

    const client = twilioLib(sid, token);

    try {
      const msg = await client.messages.create({
        body:    message,
        from,
        to,
      });
      logger.log("SMS sent:", msg.sid);
      return { success: true };
    } catch (err) {
      logger.error("Twilio send error:", err);
      throw new Error("SMS send failed");
    }
  }
);
