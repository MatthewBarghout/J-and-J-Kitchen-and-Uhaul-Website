import React, { useState } from "react";
import Menu from "./Menu";
import Logo from "./logo.png";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPanel from "./AdminPanel";

function App() {
  const [cart, setCart] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationId, setConfirmationId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [showNameError, setShowNameError] = useState(false);

  const getWingCount = (name) => {
    const match = name.match(/(\d+)\s*(pc\s*)?(Wings)/i);
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
    const existingItemIndex = cart.findIndex(
      (i) =>
        i.name === item.name &&
        (i.substitution || "") === (item.substitution || "") &&
        (i.wingUpgrades?.allFlats || false) === (item.wingUpgrades?.allFlats || false) &&
        (i.wingUpgrades?.allDrums || false) === (item.wingUpgrades?.allDrums || false) &&
        (i.wingUpgrades?.sauced || false) === (item.wingUpgrades?.sauced || false)
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
    newCart[index].quantity += 1;
    setCart(newCart);
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (!customerName.trim()) {
      setShowNameError(true);
      return;
    }
    if (cart.length === 0) {
      console.warn("Tried to submit empty cart");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        createdAt: Timestamp.now(),
        name: customerName,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
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

  if (showSplash) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-green-100 text-center px-4 animate-slide-in">
        <img
          src={Logo}
          alt="Logo"
          className="h-40 w-auto mb-6 rounded-xl border-4 border-green-700 shadow-lg"
        />
        <h1 className="text-4xl font-extrabold text-green-800">
          Welcome to J and J Kitchen & U-Haul
        </h1>
        <p className="text-lg text-gray-700 mt-2">
          Family-run since 2015 serving fresh chicken
        </p>
        <button
          onClick={() => setShowSplash(false)}
          className="mt-6 px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
        >
          Enter Site
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route
          path="/"
          element={
            <>
              <div className="min-h-screen bg-gray-50 font-sans">
                <nav className="sticky top-0 bg-white border-b shadow-sm z-50 py-4 px-6 flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-green-700">J and J Kitchen & U-Haul</h1>
                  <div className="space-x-4 text-sm font-medium text-gray-700">
                    <a href="#menu" className="hover:text-green-600">Menu</a>
                    <a href="#about" className="hover:text-green-600">About</a>
                    <a href="#contact" className="hover:text-green-600">Contact</a>
                    <button onClick={() => setShowCart(true)} className="relative">
                      🛒
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                          {totalItems}
                        </span>
                      )}
                    </button>
                  </div>
                </nav>

                <main className="max-w-7xl mx-auto p-6" id="menu">
                  <Menu onAddToCart={addToCart} />
                </main>

                <footer className="text-center py-4 bg-gray-100 text-sm text-gray-600 border-t">
                  &copy; {new Date().getFullYear()} J and J Kitchen & U-Haul. All rights reserved.
                </footer>
              </div>

              {showCart && (
                <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto rounded-xl shadow-xl max-w-lg mx-auto my-8">
                  <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full mb-2 p-2 border rounded ${showNameError ? 'border-red-500' : ''}`}
                  />
                  {showNameError && <p className="text-sm text-red-600 mb-2">Please enter your name before submitting.</p>}
                  {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                  ) : (
                    <ul className="space-y-4">
                      {cart.map((item, index) => (
                        <li key={index} className="border p-2 rounded">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{item.name} x {item.quantity}</p>
                              <p className="text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => decreaseQuantity(index)} className="px-3 py-1 bg-gray-200 rounded">-</button>
                              <button onClick={() => increaseQuantity(index)} className="px-3 py-1 bg-gray-200 rounded">+</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4">
                    <p className="text-right font-semibold">
                      Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </p>
                    <button
                      onClick={handleConfirmOrder}
                      className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => setShowCart(false)}
                      className="w-full mt-2 text-sm text-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {showConfirmation && (
                <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 text-center px-4 animate-fade-in">
                  <div className="text-green-600 text-6xl mb-4 animate-bounce">✓</div>
                  <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-gray-700 mb-2">Your order has been placed successfully.</p>
                  {confirmationId && <p className="text-xs text-gray-500">Order ID: {confirmationId}</p>}
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                  >
                    Back to Menu
                  </button>
                </div>
              )}
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
