import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPanel from "./AdminPanel";
import HomePage from "./Homepage";
import MenuPage from "./MenuPage";

function App() {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationId, setConfirmationId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [showNameError, setShowNameError] = useState(false);

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
      price: updatedPrice
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
        price: updatedPrice
      };
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
    if (cart.length === 0) return;
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

  return (
    <Router>
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
            />
          }
        />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <div>

  <ul className="text-sm text-gray-600 space-y-1 ml-1">
    {item.substitution && <li>Substitution: {item.substitution}</li>}

    {item.wingUpgrades && (
  <>
    {item.wingUpgrades.allFlats && <li>All Flats (+$1.00)</li>}
    {item.wingUpgrades.allDrums && <li>All Drums (+$1.00)</li>}
    {item.wingUpgrades.sauced && (
      <li>
        Sauced in {item.wingUpgrades.saucedFlavor || "Unknown"} (+$1.25 per 6)
      </li>
    )}
  </>
)}


    {item.sauces?.length > 0 && (
      <li>
        Sauces: {item.sauces.join(", ")}
        {item.extraSauceCount > 0 && ` (+${item.extraSauceCount} extra)`}
      </li>
    )}

    {item.selectedOptions?.length > 0 && (
      <li>
        Options: {item.selectedOptions.join(", ")}
      </li>
    )}

    <li>Qty: {item.quantity}</li>
    <li className="font-medium text-black">
  Price: ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
</li>

  </ul>
</div>

                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => decreaseQuantity(index)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQuantity(index)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                </div>
              </div>
            ))}
            <input
              type="text"
              className="mt-4 w-full border p-2 rounded"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            {showNameError && <p className="text-red-500 text-sm mt-1">Name is required</p>}
            <div className="mt-4 flex justify-between">
              <button onClick={() => setShowCart(false)} className="px-4 py-2 bg-gray-300 rounded">Close</button>
              <button onClick={handleConfirmOrder} className="px-4 py-2 bg-green-600 text-white rounded">Confirm</button>
            </div>
            <div className="mt-4 text-right text-lg font-semibold">
  Grand Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
</div>

          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="mb-4">Your order has been placed.</p>
            {confirmationId && <p className="text-sm text-gray-500">Order ID: {confirmationId}</p>}
            <button onClick={() => setShowConfirmation(false)} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Close</button>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
