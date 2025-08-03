// src/App.js

import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import AdminPanel from "./AdminPanel";
import HomePage from "./Homepage";
import MenuPage from "./MenuPage";
import SquareCheckout from "./SquareCheckout";
import Login from "./Login";
import Signup from "./Signup";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  // ─── State Hooks ─────────────────────────────────────────────
  const [ordersPaused, setOrdersPaused] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showNameError, setShowNameError] = useState(false);
  const [showPhoneError, setShowPhoneError] = useState(false);

  const SERVICE_FEE = 1.0;

  // ─── Load admin settings ───────────────────────────────────────
  useEffect(() => {
    const settingsRef = doc(db, "admin", "settings");
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOrdersPaused(data.paused || false);
        setUnavailableItems(data.unavailable || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // ─── Pricing Helpers & Totals ─────────────────────────────────
  const getWingCount = (name) => {
    const m = name.match(/(\d+)\s*(pc\s*)?Wings/i);
    return m ? parseInt(m[1], 10) : 0;
  };

  const calculateUpdatedPrice = (item) => {
    const base = item.basePrice ?? item.price;
    let extraCost = 0;

    // Combo subs
    if (
      (item.category === "Combinations" || /Dinner/i.test(item.name)) &&
      (item.substitution === "Okra" || item.substitution === "Fries")
    ) {
      extraCost += 0.5;
    }

    // Wing upgrades per 6 wings
    const wingCount = getWingCount(item.name);
    const setsOf6 = Math.floor(wingCount / 6);
    if (item.wingUpgrades) {
      if (item.wingUpgrades.allFlats) extraCost += setsOf6 * 1.0;
      if (item.wingUpgrades.allDrums) extraCost += setsOf6 * 1.0;
      if (item.wingUpgrades.sauced)    extraCost += setsOf6 * 1.25;
    }

    // Extra sauces surcharge
    extraCost += item.extraSauceCharge || 0;

    return parseFloat((base + extraCost).toFixed(2));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + calculateUpdatedPrice(item) * item.quantity,
    0
  );
  const tax   = parseFloat((subtotal * 0.07).toFixed(2));
  const total = parseFloat((subtotal + tax + SERVICE_FEE).toFixed(2));

  // ─── Cart Manipulation ────────────────────────────────────────
  const addToCart = (item) => {
    const idx = cart.findIndex((i) =>
      i.name === item.name &&
      (i.substitution || "") === (item.substitution || "") &&
      JSON.stringify(i.wingUpgrades || {}) === JSON.stringify(item.wingUpgrades || {}) &&
      JSON.stringify(i.sauces || []) === JSON.stringify(item.sauces || []) &&
      JSON.stringify(i.selectedOptions || []) === JSON.stringify(item.selectedOptions || {})
    );

    const base = item.basePrice ?? item.price;
    const newItem = {
      ...item,
      basePrice: base,
      price: calculateUpdatedPrice({ ...item, basePrice: base }),
      quantity: 1,
    };

    if (idx !== -1) {
      const updated = [...cart];
      updated[idx].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, newItem]);
    }
  };

  const increaseQuantity = (index) => {
    const updated = [...cart];
    const item = updated[index];
    item.quantity += 1;
    item.price = calculateUpdatedPrice(item);
    setCart(updated);
  };

  const decreaseQuantity = (index) => {
    const updated = [...cart];
    const item = updated[index];
    if (item.quantity > 1) {
      item.quantity -= 1;
      item.price = calculateUpdatedPrice(item);
    } else {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  // ─── Order Validation ────────────────────────────────────────
  const handleConfirmOrder = () => {
    if (ordersPaused) {
      alert("We are currently not accepting orders.");
      return false;
    }
    if (!customerName.trim()) {
      setShowNameError(true);
      return false;
    }
    if (!customerPhone.trim()) {
      setShowPhoneError(true);
      return false;
    }
    if (cart.length === 0) return false;
    return true;
  };

  // ─── Only backend Cloud Function writes to Firestore ─────────
  const handlePaymentSuccess = (payment) => {
    if (!handleConfirmOrder()) return;
    setConfirmationDetails(payment);
    setShowConfirmation(true);
    setShowCart(false);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setShowNameError(false);
    setShowPhoneError(false);
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <AuthProvider>
      <Router>
        {ordersPaused && (
          <div className="bg-yellow-200 text-yellow-800 text-center py-3 font-medium">
            🚫 We are currently not accepting orders. Please check back soon.
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={<HomePage totalItems={totalItems} setShowCart={setShowCart} />}
          />
          <Route
            path="/menu"
            element={
              <MenuPage
                addToCart={addToCart}
                totalItems={totalItems}
                setShowCart={setShowCart}
                unavailableItems={unavailableItems}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-3xl font-bold mb-6">Your Order</h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4 flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <ul className="text-sm text-gray-600 space-y-1 mt-1">
                      {item.substitution && <li>Substitution: {item.substitution}</li>}
                      {item.wingUpgrades?.allFlats && <li>All Flats (+$1.00)</li>}
                      {item.wingUpgrades?.allDrums && <li>All Drums (+$1.00)</li>}
                      {item.wingUpgrades?.sauced && (
                        <li>Sauced in {item.wingUpgrades.saucedFlavor} (+$1.25 per 6)</li>
                      )}
                      {item.sauces?.length > 0 && (
                        <li>
                          Sauces: {item.sauces.join(", ")}
                          {item.extraSauceCount > 0 && ` (+${item.extraSauceCount} extra)`}
                        </li>
                      )}
                      {item.selectedOptions?.length > 0 && (
                        <li>Options: {item.selectedOptions.join(", ")}</li>
                      )}
                      <li>
                        Price: ${item.price.toFixed(2)} × {item.quantity} = $
                        {(item.price * item.quantity).toFixed(2)}
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => increaseQuantity(idx)}
                      className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded text-lg font-semibold"
                    >
                      +
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => decreaseQuantity(idx)}
                      className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded text-lg font-semibold"
                    >
                      –
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="Enter your name"
              className="mt-6 w-full border p-2 rounded"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            {showNameError && <p className="text-red-500 text-sm mt-1">Name is required</p>}

            <input
              type="tel"
              placeholder="Enter your phone (+12345556789)"
              className="mt-4 w-full border p-2 rounded"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            {showPhoneError && <p className="text-red-500 text-sm mt-1">Phone is required</p>}

            <div className="mt-6 text-right space-y-1">
              <p>Subtotal: ${subtotal.toFixed(2)}</p>
              <p>Tax (7%): ${tax.toFixed(2)}</p>
              <p>Service Fee: ${SERVICE_FEE.toFixed(2)}</p>
              <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setShowCart(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Close
              </button>
              <SquareCheckout
                cartItems={cart}
                totalAmount={total}
                customerName={customerName}
                customerPhone={customerPhone}
                onPaymentSuccess={handlePaymentSuccess}
                disabled={cart.length === 0}
              />
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            {ordersPaused ? (
              <>
                <h2 className="text-2xl font-bold text-red-600 mb-2">We're Sorry</h2>
                <p className="text-gray-700">We are not accepting orders at this time.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
                <p className="text-gray-700">Your order has been placed successfully.</p>
                {confirmationDetails && (
                  <p className="text-sm text-gray-500 mt-1">Payment ID: {confirmationDetails.id}</p>
                )}
              </>
            )}
            <button
              onClick={() => setShowConfirmation(false)}
              className="mt-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </Router>
    </AuthProvider>
  );
}
