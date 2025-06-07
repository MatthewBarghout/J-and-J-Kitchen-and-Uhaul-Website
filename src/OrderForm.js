import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function OrderForm({ cart, onOrderComplete }) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        name: name,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        timestamp: Date.now()
      });
      setSubmitted(true);
      onOrderComplete();
    } catch (err) {
      console.error("Error submitting order:", err);
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 p-4 bg-green-50 border border-greeen-300 rounded">

        <h3 className="text-green-800 font-semibold mb-2">
          Thank you! Your order has been received.
          </h3>
        <button onClick={() => setSubmitted(false)}
          className= "text-sm underline hover: text-blue-800"
          >
            Place another order
          </button>
      </div>
    );
  }
  

  return (
    <form onSubmit={handleSubmit} className= "mt-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Complete Your Order</h2>
      <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">

        Name: 
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          clasName="w-full border-gray-300 rounded px-3 py-2 shadow-sm focus: outline-none focus:ring focus:border-blue-300"
        />
        </div>
    
      
      <button
       type="submit"
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
      Submit Order
       </button>
    </form>
  )};