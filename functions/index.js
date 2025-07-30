const functions = require("firebase-functions");
const { Client, Environment } = require("square");
require("dotenv").config();

const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

exports.chargeCard = functions.https.onCall(async (data, context) => {
  const { nonce, amount } = data;

  if (!nonce || !amount) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing payment nonce or amount."
    );
  }

  try {
    const response = await squareClient.paymentsApi.createPayment({
      sourceId: nonce,
      idempotencyKey: `${Date.now()}-${Math.random()}`,
      amountMoney: {
        amount: Math.round(amount * 100), // convert dollars to cents
        currency: "USD",
      },
    });

    return {
      success: true,
      paymentId: response.result.payment.id,
    };
  } catch (err) {
    console.error("💥 Square Payment Error:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
