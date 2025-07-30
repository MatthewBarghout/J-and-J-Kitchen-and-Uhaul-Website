import React, { useState, useEffect } from "react";
import { collection, addDoc, Timestamp, doc,onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPanel from "./AdminPanel";
import HomePage from "./Homepage";
import MenuPage from "./MenuPage";
import SquareCheckout from "./SquareCheckout";





function App() {
  const [ordersPaused, setOrdersPaused] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);

  useEffect(() => {
    const settingsRef = doc(db, "admin", "settings");
  
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOrdersPaused(data.paused || false);
        setUnavailableItems(data.unavailable || []);
      }
    });
  
    return () => unsubscribe(); // cleanup on unmount
  }, []);
  
  

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationId, setConfirmationId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [showNameError, setShowNameError] = useState(false);
  const SERVICE_FEE=1.00;

  const getWingCount = (item) => {
    if (!item?.name) return 0;
    const match = item.name.match(/(\d+)\s*(pc\s*)?(Wings)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const calculateUpdatedPrice = (item) => {
    let extraCost = 0;
    const wingCount = getWingCount(item.name);
    const setsOf6 = Math.floor(wingCount / 6);

    if (item.substitution === "Okra" || item.substitution === "Fries") {
      extraCost += 0.50;
    }

    if (item.category?.includes("Wing") && wingCount >= 6) {
      if (item.wingUpgrades?.allFlats && wingCount === 6) extraCost += setsOf6 * 1.0;
      if (item.wingUpgrades?.allDrums && wingCount === 6) extraCost += setsOf6 * 1.0;
      if (item.wingUpgrades?.sauced) extraCost += setsOf6 * 1.25;
    }

    return parseFloat(((item.basePrice ?? item.price) + extraCost).toFixed(2));
  };

  const addToCart = (item) => {
    const existingItemIndex = cart.findIndex((i) =>
      i.name === item.name &&
      (i.substitution || "") === (item.substitution || "") &&
      JSON.stringify(i.wingUpgrades || {}) === JSON.stringify(item.wingUpgrades || {}) &&
      JSON.stringify(i.sauces || []) === JSON.stringify(item.sauces || []) &&
      JSON.stringify(i.selectedOptions || []) === JSON.stringify(item.selectedOptions || [])
    );

    const base = item.basePrice ?? item.price;
    const updatedItem = {
      ...item,
      basePrice: base,
      price: calculateUpdatedPrice({ ...item, basePrice: base }),
      quantity: 1,
    };

    if (existingItemIndex !== -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, updatedItem]);
    }
  };

  const increaseQuantity = (index) => {
    const newCart = [...cart];
    const item = newCart[index];
    const updatedPrice = calculateUpdatedPrice(item);
    newCart[index] = {
      ...item,
      quantity: item.quantity + 1,
      price: updatedPrice,
    };
    setCart(newCart);
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];
    const item = newCart[index];
    if (item.quantity > 1) {
      const updatedPrice = calculateUpdatedPrice(item);
      newCart[index] = {
        ...item,
        quantity: item.quantity - 1,
        price: updatedPrice,
      };
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (ordersPaused) {
      alert("We are currently not accepting orders.");
      return;
    }
    if (!customerName.trim()) {
      setShowNameError(true);
      return;
    }
    if (cart.length === 0) return;
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        createdAt: Timestamp.now(),
        name: customerName,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.07 + SERVICE_FEE,

      });
      setConfirmationId(docRef.id);
    } catch (error) {
      console.error("Error adding order to Firestore:", error);
    } finally {
      setShowCart(false);
      setShowConfirmation(true);
      setCart([]);
      setCustomerName("");
      setShowNameError(false);
    }
  };

  return (
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
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>

     {/* 🛒 CART MODAL */}
{showCart && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
      <h2 className="text-3xl font-bold mb-6">Your Order</h2>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {cart.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <ul className="text-sm text-gray-600 space-y-1 mt-1">
                {item.substitution && <li>Substitution: {item.substitution}</li>}
                {item.wingUpgrades && (
                  <>
                    {item.wingUpgrades.allFlats && <li>All Flats (+$1.00)</li>}
                    {item.wingUpgrades.allDrums && <li>All Drums (+$1.00)</li>}
                    {item.wingUpgrades.sauced && (
                      <li>Sauced in {item.wingUpgrades.saucedFlavor || "Unknown"} (+$1.25 per 6)</li>
                    )}
                  </>
                )}
                {item.sauces?.length > 0 && (
                  <li>Sauces: {item.sauces.join(", ")}{item.extraSauceCount > 0 && ` (+${item.extraSauceCount} extra)`}</li>
                )}
                {item.selectedOptions?.length > 0 && (
                  <li>Options: {item.selectedOptions.join(", ")}</li>
                )}
                <li>
                  <span className="text-gray-700">Price:</span>{" "}
                  ${item.price.toFixed(2)} × {item.quantity} ={" "}
                  <span className="font-medium text-black">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => increaseQuantity(index)}
                className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded text-lg font-semibold"
              >
                +
              </button>
              <span className="text-base">{item.quantity}</span>
              <button
                onClick={() => decreaseQuantity(index)}
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
        className="mt-6 w-full border p-2 rounded"
        placeholder="Enter your name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />
      {showNameError && <p className="text-red-500 text-sm mt-1">Name is required</p>}

      <div className="mt-6 text-right space-y-1">
  <p className="text-gray-700">
    Subtotal: $
    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
  </p>
  <p className="text-gray-700">
    Tax (7%): $
    {(cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.07).toFixed(2)}
  </p>
  <p className="text-gray-700">
    Service Fee: ${SERVICE_FEE.toFixed(2)}
  </p>
  <p className="text-lg font-semibold">
    Total: $
    {(
      cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.07 +
      SERVICE_FEE
    ).toFixed(2)}
  </p>
</div>


      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setShowCart(false)}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Close
        </button>
        <SquareCheckout
  totalAmount={
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.07 +
    SERVICE_FEE
  }
  onPaymentSuccess={(token) => {
    // Optionally store token, then confirm order
    handleConfirmOrder();
  }}
/>

      </div>
    </div>
  </div>
)}

{/* ✅ CONFIRMATION MODAL */}
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
          {confirmationId && (
            <p className="text-sm text-gray-500 mt-2">Order ID: {confirmationId}</p>
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
  );
}

export default App;
