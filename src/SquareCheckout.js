import React, { useEffect, useRef, useState } from "react";
import { functions } from "./firebase";
import { httpsCallable } from "firebase/functions";

export default function SquareCheckout({
  cartItems,
  totalAmount,
  customerName,
  customerPhone,
  onPaymentSuccess,
}) {
  const [cardAttached, setCardAttached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    let card;
    async function init() {
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      const container = document.getElementById("card-container");
      if (container) container.innerHTML = "";
      try {
        const payments = window.Square.payments(
          process.env.REACT_APP_SQUARE_APP_ID,
          "production"
        );
        card = await payments.card();
        await card.attach("#card-container");
        cardRef.current = card;
        setCardAttached(true);
      } catch (err) {
        console.error("Square init error:", err);
        setError("Failed to load payment form. Please refresh.");
      }
    }
    init();
    return () => {
      if (card) card.destroy();
      hasInitialized.current = false;
      const cleanup = document.getElementById("card-container");
      if (cleanup) cleanup.innerHTML = "";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Please enter your name and phone above.");
      return;
    }
    if (!cardRef.current) {
      setError("Payment form not ready.");
      return;
    }
    setLoading(true);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") {
        throw new Error(result.errors?.[0]?.message || "Card tokenization failed.");
      }
      const payload = {
        sourceId:     result.token,
        amount:       Math.round(totalAmount * 100),
        customerName: customerName,
        customerPhone: customerPhone,
        items:        cartItems,
      };
      console.log("🔍 chargeCard payload:", payload);
      const charge = httpsCallable(functions, "chargeCard");
      const res = await charge(payload);
      onPaymentSuccess(res.data.payment);
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div id="card-container" className="rounded-md border px-4 py-3 shadow-sm" />
      <button
        type="submit"
        disabled={!cardAttached || loading || cartItems.length === 0}
        className={`w-full py-3 text-white font-semibold rounded-md ${
          !cardAttached || loading || cartItems.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Processing…" : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
}
