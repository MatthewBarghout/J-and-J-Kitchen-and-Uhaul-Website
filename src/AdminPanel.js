import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import menu from "./menuData"; // your existing menu import

function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [prepTimes, setPrepTimes] = useState({});
  const [orderPaused, setOrderPaused] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const pauseRef = doc(db, "admin", "settings");
    const unsub = onSnapshot(pauseRef, (snap) => {
      if (snap.exists()) {
        setOrderPaused(snap.data().paused || false);
        setUnavailableItems(snap.data().unavailable || []);
      }
    });
    return () => unsub();
  }, []);

  const handleMarkReady = async (id) => {
    await updateDoc(doc(db, "orders", id), { ready: true });
  };

  const handlePrepTimeChange = async (id, value) => {
    setPrepTimes((prev) => ({ ...prev, [id]: value }));
    await updateDoc(doc(db, "orders", id), { prepTime: value });
  };

  const togglePauseOrders = async () => {
    const settingsRef = doc(db, "admin", "settings");
    await setDoc(settingsRef, { paused: !orderPaused }, { merge: true });
  };

  const toggleUnavailable = async (itemId) => {
    const newList = unavailableItems.includes(itemId)
      ? unavailableItems.filter((id) => id !== itemId)
      : [...unavailableItems, itemId];
    setUnavailableItems(newList);
    await setDoc(doc(db, "admin", "settings"), { unavailable: newList }, { merge: true });
  };

  // Group menu by category
  const groupedMenu = menu[0].reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      <button
        onClick={togglePauseOrders}
        className={`mb-6 px-4 py-2 rounded text-white ${orderPaused ? "bg-red-600" : "bg-green-600"}`}
      >
        {orderPaused ? "Resume Orders" : "Pause Orders"}
      </button>

      <h2 className="text-xl font-semibold mb-2">Mark Items Unavailable</h2>

      {Object.entries(groupedMenu).map(([category, items]) => (
        <div key={category} className="mb-4 border rounded">
          <button
            onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            className="w-full text-left px-4 py-2 bg-gray-100 font-semibold"
          >
            {category}
          </button>
          {expandedCategory === category && (
            <div className="p-3 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <input
                    type="checkbox"
                    checked={unavailableItems.includes(item.id)}
                    onChange={() => toggleUnavailable(item.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <h2 className="text-xl font-semibold mt-8 mb-2">Live Orders</h2>
      <div className="space-y-4">
        {orders.filter((o) => !o.ready).map((order) => (
          <div key={order.id} className="border rounded p-4 shadow">
            <div className="flex justify-between mb-2">
              <h2 className="font-semibold">Order for {order.name}</h2>
              <button
                onClick={() => handleMarkReady(order.id)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Mark Ready
              </button>
            </div>

            {order.items.map((item, index) => (
              <div key={index} className="ml-4 mb-1">
                <p className="font-medium">{item.name} × {item.quantity}</p>
                {item.substitution && <p className="text-sm">Sub: {item.substitution}</p>}
                {item.wingUpgrades?.sauced && (
                  <p className="text-sm">Sauced in: {item.wingUpgrades.saucedFlavor}</p>
                )}
                {item.selectedOptions?.length > 0 && (
                  <p className="text-sm">Options: {item.selectedOptions.join(", ")}</p>
                )}
                {item.sauces?.length > 0 && (
                  <p className="text-sm">Sauces: {item.sauces.join(", ")}</p>
                )}
              </div>
            ))}

            <div className="mt-2">
              <label className="text-sm font-medium">Prep Time:</label>
              <select
                value={prepTimes[order.id] || ""}
                onChange={(e) => handlePrepTimeChange(order.id, e.target.value)}
                className="ml-2 border rounded px-2 py-1 text-sm"
              >
                <option value="">Select</option>
                <option value="5 min">5 min</option>
                <option value="10 min">10 min</option>
                <option value="15 min">15 min</option>
                <option value="20 min">20 min</option>
                <option value="30+ min">30+ min</option>
              </select>
            </div>

            <p className="mt-2 text-gray-600 text-sm">
              Total: ${order.total?.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;

