// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger                = require("firebase-functions/logger");
const admin                 = require("firebase-admin");
const { Client, Environment } = require("square");
const twilio                = require("twilio");
const crypto                = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// ─── SQUARE PAYMENT FUNCTION ────────────────────────────────
const squareToken = process.env.SQUARE_ACCESS_TOKEN;
if (!squareToken) logger.error("⚠️ SQUARE_ACCESS_TOKEN not set!");
const squareClient = new Client({
  accessToken: squareToken,
  environment: Environment.Sandbox,
});

exports.chargeCard = onCall({ region: "us-central1" }, async (req) => {
  logger.info("🔥 chargeCard payload:", req.data);
  const { sourceId, amount, customerName, items } = req.data||{};
  if (!sourceId||!amount||!customerName||!Array.isArray(items)||items.length===0) {
    throw new HttpsError("invalid-argument","Missing payment fields");
  }
  try {
    const { paymentsApi } = squareClient;
    const { result } = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: { amount, currency: "USD" },
      note: `Order from ${customerName}`
    });
    const p = result.payment;
    // persist order
    const orderRef = await db.collection("orders").add({
      customerName, items,
      amount: Number(p.amountMoney.amount),
      currency: p.amountMoney.currency,
      paymentId: p.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success:true, orderId:orderRef.id, payment:{ id:p.id, status:p.status }};
  } catch(err) {
    logger.error("chargeCard error:", err);
    throw new HttpsError("internal", err.message);
  }
});

// ─── TWILIO SMS FUNCTION ──────────────────────────────────
// make sure you’ve set these three env‐vars (see next step)
const accountSid     = process.env.TWILIO_ACCOUNT_SID;
const authToken      = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom     = process.env.TWILIO_PHONE_NUMBER;
if (!accountSid||!authToken||!twilioFrom) logger.error("⚠️ Twilio env vars missing!");

const twilioClient = twilio(accountSid, authToken);

exports.sendPrepTimeText = onCall({ region: "us-central1" }, async (req) => {
  logger.info("sendPrepTimeText called with:", req.data);
  const { phoneNumber, prepTime, name } = req.data||{};
  if (!phoneNumber || !prepTime || !name) {
    throw new HttpsError("invalid-argument","Missing fields");
  }
  try {
    await twilioClient.messages.create({
      body: `Hi ${name}, your order will be ready in about ${prepTime}. Thanks for ordering from J and J Kitchen!`,
      from: twilioFrom,
      to: phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`
    });
    return { success:true };
  } catch(err) {
    logger.error("SMS Error:", err);
    throw new HttpsError("internal","SMS failed");
  }
});
