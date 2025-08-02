// functions/index.js

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger                = require("firebase-functions/logger");
const admin                 = require("firebase-admin");
const { Client, Environment } = require("square");
const crypto                = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// === SQUARE TOKEN SETUP ===
// 1) First try the env var (populated via Secret Manager or firebase.json config).
// 2) If that's missing, fall back to the official Square SANDBOX test token
//    so your dev flow won't break.
const squareToken = 
  process.env.SQUARE_ACCESS_TOKEN ||
  "SANDBOX_TEST_TOKEN";  // replace with your real sandbox token if you want

if (!squareToken) {
  logger.error("⚠️  SQUARE_ACCESS_TOKEN is not defined in env vars!");
}

const squareClient = new Client({
  accessToken: squareToken,
  environment: Environment.Sandbox,
});

exports.chargeCard = onCall({ region: "us-central1" }, async (req) => {
  logger.info("🔥 chargeCard handler invoked");

  const { sourceId, amount, customerName, items } = req.data || {};
  logger.info("chargeCard payload:", { sourceId, amount, customerName, items });

  // Basic validation
  if (
    typeof sourceId     !== "string" ||
    typeof amount       !== "number" ||
    typeof customerName !== "string" ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "sourceId, amount, customerName, and items are all required."
    );
  }

  try {
    // Create the payment
    const { paymentsApi } = squareClient;
    const { result } = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: { amount, currency: "USD" },
      note: `Order from ${customerName}`,
    });
    const payment = result.payment;

    // Persist the order in Firestore
    const orderRef = await db.collection("orders").add({
      customerName,
      items,
      amount:     Number(payment.amountMoney.amount),  // in cents
      currency:   payment.amountMoney.currency,
      paymentId:  payment.id,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
      ready:      false,
    });

    // Return both the orderId and payment details
    return {
      success: true,
      orderId: orderRef.id,
      payment: {
        id:       payment.id,
        status:   payment.status,
        amount:   Number(payment.amountMoney.amount),
        currency: payment.amountMoney.currency,
      },
    };
  } catch (err) {
    logger.error("chargeCard error:", err);
    throw new HttpsError("internal", err.message || "Payment failed.");
  }
});
