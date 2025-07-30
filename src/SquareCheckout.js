import React, { useEffect, useRef, useState } from "react";

const SquareCheckout = ({ totalAmount, onPaymentSuccess }) => {
  const [cardAttached, setCardAttached] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const isTokenizing = useRef(false);

  useEffect(() => {
    let cardInstance = null;

    async function initSquare() {
      try {
        if (!window.Square || cardAttached) return;

        const payments = window.Square.payments(
          "sandbox-sq0idb-80XauowToOuFUbMK06sGDQ", // ✅ Sandbox App ID
          "LEB9GWQ2F3" // ✅ Sandbox Location ID
        );

        cardInstance = await payments.card();

        const alreadyAttached = document.querySelector("#card-container > div");
        if (!alreadyAttached) {
          await cardInstance.attach("#card-container");
          setCardAttached(true);
          cardRef.current = cardInstance;
          console.log("✅ Card attached");
        }
      } catch (err) {
        console.error("❌ Square attach failed:", err);
      }
    }

    initSquare();
  }, [cardAttached]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const card = cardRef.current;
    if (!card || !cardAttached || isTokenizing.current) return;

    try {
      isTokenizing.current = true;
      setLoading(true);

      const result = await card.tokenize();

      if (result.status === "OK") {
        const token = result.token;
        console.log("✅ Tokenize result:", result);

        // 🔁 Replace with actual customer name input later if desired
        const customerName = "Test User";

        const response = await fetch("https://us-central1-j-and-j-f8f66.cloudfunctions.net/chargeCard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            amount: totalAmount,
            customerName,
          }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Payment failed");

        alert("✅ Payment successful!");
        onPaymentSuccess(data.payment);
      } else {
        console.error("❌ Tokenization failed:", result.errors);
        alert("Payment error: " + (result.errors?.[0]?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ chargeCard failed:", error);
      alert("Charge failed: " + error.message);
    } finally {
      isTokenizing.current = false;
      setLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="mt-4">
      <div id="card-container" className="mb-4 border rounded-md px-3 py-2 shadow" />
      <button
        type="submit"
        disabled={!cardAttached || loading}
        className={`w-full py-2 rounded text-white font-medium ${
          cardAttached && !loading
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading
          ? "Processing..."
          : cardAttached
          ? `Pay $${totalAmount?.toFixed(2)}`
          : "Loading card..."}
      </button>
    </form>
  );
};

export default SquareCheckout;

