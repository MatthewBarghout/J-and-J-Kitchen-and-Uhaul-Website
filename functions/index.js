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
exports.chargeCard = onCall({ 
  region: "us-central1",
  secrets: ["SQUARE_ACCESS_TOKEN"]
}, async (req) => {
  logger.info("🔥 chargeCard payload:", req.data);
  const { sourceId, amount, customerName, items } = req.data||{};
  if (!sourceId||!amount||!customerName||!Array.isArray(items)||items.length===0) {
    throw new HttpsError("invalid-argument","Missing payment fields");
  }
  
  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!squareToken) {
    throw new HttpsError("internal", "Square access token not configured");
  }
  
  const squareClient = new Client({
    accessToken: squareToken,
    environment: Environment.Production,
  });
  
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
exports.sendPrepTimeText = onCall({ 
  region: "us-central1",
  secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
}, async (req) => {
  logger.info("sendPrepTimeText called with:", req.data);
  const { phoneNumber, prepTime, name } = req.data||{};
  if (!phoneNumber || !prepTime || !name) {
    throw new HttpsError("invalid-argument","Missing fields");
  }
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !twilioFrom) {
    throw new HttpsError("internal", "Twilio credentials not configured");
  }
  
  const twilioClient = twilio(accountSid, authToken);
  
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

// ─── SQUARE REFUND FUNCTION ───────────────────────────────────
exports.refundPayment = onCall({ 
  region: "us-central1",
  secrets: ["SQUARE_ACCESS_TOKEN"]
}, async (req) => {
  logger.info("refundPayment called with:", req.data);
  const { paymentId, orderId, reason } = req.data || {};
  
  if (!paymentId || !orderId) {
    throw new HttpsError("invalid-argument", "Payment ID and Order ID are required");
  }
  
  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!squareToken) {
    throw new HttpsError("internal", "Square access token not configured");
  }
  
  const squareClient = new Client({
    accessToken: squareToken,
    environment: Environment.Production,
  });
  
  try {
    // Get the original payment details
    const { paymentsApi } = squareClient;
    const { result: paymentResult } = await paymentsApi.getPayment(paymentId);
    const payment = paymentResult.payment;
    
    // Create the refund
    const { refundsApi } = squareClient;
    const { result } = await refundsApi.refundPayment({
      sourceId: paymentId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: payment.amountMoney.amount,
        currency: payment.amountMoney.currency
      },
      reason: reason || "Order cancelled by restaurant"
    });
    
    const refund = result.refund;
    
    // Update order in Firestore to mark as refunded
    await db.collection("orders").doc(orderId).update({
      refunded: true,
      refundId: refund.id,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundReason: reason || "Order cancelled by restaurant"
    });
    
    logger.info("Refund successful:", refund.id);
    return { 
      success: true, 
      refundId: refund.id,
      status: refund.status,
      amount: refund.amountMoney.amount
    };
  } catch(err) {
    logger.error("Refund error:", err);
    throw new HttpsError("internal", `Refund failed: ${err.message}`);
  }
});
