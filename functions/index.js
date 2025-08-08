// functions/index.js
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {Client, Environment} = require("square");
const twilio = require("twilio");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// ─── SQUARE PAYMENT FUNCTION ────────────────────────────────
exports.chargeCard = onCall({
  region: "us-central1",
  secrets: ["SQUARE_ACCESS_TOKEN"],
  enforceAppCheck: true,
}, async (req) => {
  // Security: Only log essential info, never sensitive payment data
  logger.info("chargeCard called");

  const {sourceId, amount, customerName, items} = req.data||{};

  // Security: Strict input validation
  if (!sourceId || !amount || !customerName ||
      !Array.isArray(items) || items.length === 0) {
    throw new HttpsError("invalid-argument", "Missing required payment fields");
  }

  if (typeof sourceId !== "string" || sourceId.length > 255) {
    throw new HttpsError("invalid-argument", "Invalid source ID");
  }

  if (typeof amount !== "number" || amount <= 0 || amount > 100000) {
    throw new HttpsError("invalid-argument", "Invalid amount");
  }

  if (typeof customerName !== "string" ||
      customerName.length > 100 || customerName.length < 1) {
    throw new HttpsError("invalid-argument", "Invalid customer name");
  }

  if (items.length > 50) {
    throw new HttpsError("invalid-argument", "Too many items");
  }

  // Security: Validate items structure
  for (const item of items) {
    if (!item || typeof item !== "object" || !item.name ||
        typeof item.name !== "string" || item.name.length > 100) {
      throw new HttpsError("invalid-argument", "Invalid item format");
    }
  }

  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!squareToken) {
    throw new HttpsError("internal", "Payment service not configured");
  }

  const squareClient = new Client({
    accessToken: squareToken,
    environment: Environment.Sandbox,
  });

  try {
    const {paymentsApi} = squareClient;
    const {result} = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {amount, currency: "USD"},
      note: `Order from ${customerName.substring(0, 50)}`,
    });
    const p = result.payment;

    // Security: Use transaction for atomic operation
    const orderRef = await db.runTransaction(async (transaction) => {
      const newOrderRef = db.collection("orders").doc();
      transaction.set(newOrderRef, {
        customerName: customerName.substring(0, 100),
        items: items.map((item) => ({
          name: item.name.substring(0, 100),
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
        })),
        amount: Number(p.amountMoney.amount),
        currency: p.amountMoney.currency,
        paymentId: p.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return newOrderRef;
    });

    // Security: Only log success without sensitive details
    logger.info("Payment processed successfully");
    return {
      success: true,
      orderId: orderRef.id,
      payment: {id: p.id, status: p.status},
    };
  } catch (err) {
    // Security: Log error without exposing sensitive details
    logger.error("Payment processing failed", {
      error: err.message,
      code: err.code || "unknown",
    });

    if (err instanceof HttpsError) {
      throw err;
    }

    throw new HttpsError("internal", "Payment processing failed");
  }
});

// ─── TWILIO SMS FUNCTION ──────────────────────────────────
exports.sendPrepTimeText = onCall({
  region: "us-central1",
  secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
  enforceAppCheck: true,
}, async (req) => {
  // Security: Only log essential info, never phone numbers
  logger.info("sendPrepTimeText called");

  // Security: Validate auth context exists
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const {phoneNumber, prepTime, name} = req.data||{};

  // Security: Strict input validation
  if (!phoneNumber || !prepTime || !name) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  if (typeof phoneNumber !== "string" ||
      phoneNumber.length > 20 || phoneNumber.length < 10) {
    throw new HttpsError("invalid-argument", "Invalid phone number format");
  }

  if (typeof prepTime !== "string" ||
      prepTime.length > 50 || prepTime.length < 1) {
    throw new HttpsError("invalid-argument", "Invalid prep time format");
  }

  if (typeof name !== "string" || name.length > 100 || name.length < 1) {
    throw new HttpsError("invalid-argument", "Invalid name format");
  }

  // Security: Validate phone number format (basic validation)
  const phoneRegex = /^[+]?[0-9-()\s]+$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new HttpsError("invalid-argument", "Invalid phone number characters");
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioFrom) {
    throw new HttpsError("internal", "SMS service not configured");
  }

  const twilioClient = twilio(accountSid, authToken);

  try {
    // Security: Sanitize inputs for SMS body
    const sanitizedName = name.substring(0, 50).replace(/[<>]/g, "");
    const sanitizedPrepTime = prepTime.substring(0, 30).replace(/[<>]/g, "");

    await twilioClient.messages.create({
      body: `Hi ${sanitizedName}, your order will be ready in about ` +
        `${sanitizedPrepTime}. Thanks for ordering from J and J Kitchen!`,
      from: twilioFrom,
      to: phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`,
    });

    // Security: Only log success without sensitive details
    logger.info("SMS sent successfully");
    return {success: true};
  } catch (err) {
    // Security: Log error without exposing sensitive details
    logger.error("SMS operation failed", {
      error: err.message,
      code: err.code || "unknown",
    });

    if (err instanceof HttpsError) {
      throw err;
    }

    throw new HttpsError("internal", "SMS operation failed");
  }
});

// ─── SQUARE REFUND FUNCTION ───────────────────────────────────
exports.refundPayment = onCall({
  region: "us-central1",
  secrets: ["SQUARE_ACCESS_TOKEN"],
  enforceAppCheck: true,
}, async (req) => {
  // Security: Only log essential info, never payment IDs or sensitive data
  logger.info("refundPayment called");

  // Security: Validate auth context exists
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const {paymentId, orderId, reason} = req.data || {};

  // Security: Strict input validation with length limits
  if (!paymentId || !orderId || typeof paymentId !== "string" ||
      typeof orderId !== "string") {
    throw new HttpsError("invalid-argument",
        "Valid Payment ID and Order ID are required");
  }

  if (paymentId.length > 255 || orderId.length > 255) {
    throw new HttpsError("invalid-argument", "Invalid ID format");
  }

  if (reason && (typeof reason !== "string" || reason.length > 500)) {
    throw new HttpsError("invalid-argument", "Invalid reason format");
  }

  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!squareToken) {
    throw new HttpsError("internal", "Payment service not configured");
  }

  const squareClient = new Client({
    accessToken: squareToken,
    environment: Environment.Sandbox,
  });

  try {
    // Security: Verify order ownership before refund
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();
    if (orderData.refunded) {
      throw new HttpsError("failed-precondition", "Order already refunded");
    }

    if (orderData.paymentId !== paymentId) {
      throw new HttpsError("invalid-argument",
          "Payment ID does not match order");
    }

    // Get the original payment details
    const {paymentsApi} = squareClient;
    const {result: paymentResult} = await paymentsApi.getPayment(paymentId);
    const payment = paymentResult.payment;

    // Security: Verify payment is in correct state for refund
    if (payment.status !== "COMPLETED") {
      throw new HttpsError("failed-precondition", "Payment cannot be refunded");
    }

    // Create the refund
    const {refundsApi} = squareClient;
    const {result} = await refundsApi.refundPayment({
      sourceId: paymentId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: payment.amountMoney.amount,
        currency: payment.amountMoney.currency,
      },
      reason: reason || "Order cancelled by restaurant",
    });

    const refund = result.refund;

    // Security: Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection("orders").doc(orderId);
      const currentOrder = await transaction.get(orderRef);

      if (!currentOrder.exists || currentOrder.data().refunded) {
        throw new Error("Order state changed during refund");
      }

      transaction.update(orderRef, {
        refunded: true,
        refundId: refund.id,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundReason: reason || "Order cancelled by restaurant",
        refundedBy: req.auth.uid,
      });
    });

    // Security: Only log success without sensitive details
    logger.info("Refund completed successfully");
    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amountMoney.amount,
    };
  } catch (err) {
    // Security: Log error without exposing sensitive details
    logger.error("Refund operation failed", {
      error: err.message,
      code: err.code || "unknown",
    });

    if (err instanceof HttpsError) {
      throw err;
    }

    throw new HttpsError("internal", "Refund operation failed");
  }
});
