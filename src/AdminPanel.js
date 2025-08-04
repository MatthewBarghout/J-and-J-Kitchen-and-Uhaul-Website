// src/AdminPanel.js

import React, { useEffect, useState } from "react";
import { db, functions } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "./AuthContext";
import menu from "./menuData";

const sendText = httpsCallable(functions, "sendText");
const refundPayment = httpsCallable(functions, "refundPayment");

export default function AdminPanel() {
  const { currentUser, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [prepTimes, setPrepTimes] = useState({});
  const [orderPaused, setOrderPaused] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [refundingOrders, setRefundingOrders] = useState(new Set());
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Notification functions  
  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const showNotification = (title, body) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'new-order',
        requireInteraction: true
      });
    }
  };

  // subscribe to orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      const newOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activeOrders = newOrders.filter(o => !o.ready && !o.refunded);
      
      // Check for new orders and trigger notification
      if (previousOrderCount > 0 && activeOrders.length > previousOrderCount && notificationsEnabled) {
        playNotificationSound();
        showNotification('New Order Received!', 'A new order has come in.');
      }
      
      setOrders(newOrders);
      setPreviousOrderCount(activeOrders.length);
    });
    return () => unsub();
  }, [previousOrderCount, notificationsEnabled]);

  // subscribe to admin/settings
  useEffect(() => {
    const ref = doc(db, "admin", "settings");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setOrderPaused(snap.data().paused || false);
        setUnavailableItems(snap.data().unavailable || []);
      }
    });
    return () => unsub();
  }, []);

  const handleMarkReady = async (orderId) => {
    // mark ready in Firestore
    await updateDoc(doc(db, "orders", orderId), { ready: true });

    // send SMS
    const order = orders.find(o => o.id === orderId);
    if (order?.customerPhone) {
      try {
        await sendText({
          to: order.customerPhone,
          message: "Your order is ready for pickup."
        });
      } catch (err) {
        console.error("SMS send error:", err);
      }
    }
  };

  const handlePrepTimeChange = async (orderId, value) => {
    setPrepTimes(prev => ({ ...prev, [orderId]: value }));
    await updateDoc(doc(db, "orders", orderId), { prepTime: value });

    const order = orders.find(o => o.id === orderId);
    if (order?.customerPhone) {
      try {
        await sendText({
          to: order.customerPhone,
          message: `Your order will be ready in ${value}.`
        });
      } catch (err) {
        console.error("SMS send error:", err);
      }
    }
  };

  const togglePauseOrders = async () => {
    const ref = doc(db, "admin", "settings");
    await setDoc(ref, { paused: !orderPaused }, { merge: true });
  };

  const toggleUnavailable = async (itemId) => {
    const next = unavailableItems.includes(itemId)
      ? unavailableItems.filter(id => id !== itemId)
      : [...unavailableItems, itemId];
    setUnavailableItems(next);
    await setDoc(doc(db, "admin", "settings"), { unavailable: next }, { merge: true });
  };

  const handleCancelOrder = async (order) => {
    const confirmCancel = window.confirm(
      `Cancel order for ${order.customerName}?\n\nThis will issue a full refund of $${(order.amount / 100).toFixed(2)} to their payment method.`
    );
    
    if (!confirmCancel) return;
    
    try {
      setRefundingOrders(prev => new Set([...prev, order.id]));
      
      const result = await refundPayment({
        paymentId: order.paymentId,
        orderId: order.id,
        reason: "Order cancelled by restaurant"
      });
      
      if (result.data.success) {
        alert(`Order cancelled successfully!\nRefund ID: ${result.data.refundId}\nAmount: $${(result.data.amount / 100).toFixed(2)}`);
      }
    } catch (error) {
      console.error("Refund error:", error);
      alert(`Failed to cancel order: ${error.message}`);
    } finally {
      setRefundingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  const printOrder = (order) => {
    const printContent = `
      <div style="font-family: monospace; width: 300px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
          <h2 style="margin: 0;">J & J KITCHEN</h2>
          <p style="margin: 0;">ORDER RECEIPT</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Order ID:</strong> ${order.id}<br>
          <strong>Customer:</strong> ${order.customerName}<br>
          <strong>Date:</strong> ${new Date(order.createdAt?.toDate?.() || order.timestamp || Date.now()).toLocaleString()}<br>
          ${order.customerPhone ? `<strong>Phone:</strong> ${order.customerPhone}<br>` : ''}
        </div>
        
        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0;">
          <strong>ITEMS ORDERED:</strong><br><br>
          ${order.items.map(item => `
            <div style="margin-bottom: 8px;">
              <strong>${item.quantity}x ${item.name}</strong><br>
              ${item.substitution ? `&nbsp;&nbsp;Sub: ${item.substitution}<br>` : ''}
              ${item.wingUpgrades?.sauced ? `&nbsp;&nbsp;Sauced: ${item.wingUpgrades.saucedFlavor}<br>` : ''}
              ${item.selectedOptions?.length > 0 ? `&nbsp;&nbsp;Options: ${item.selectedOptions.join(', ')}<br>` : ''}
              ${item.sauces?.length > 0 ? `&nbsp;&nbsp;Sauces: ${item.sauces.join(', ')}<br>` : ''}
              &nbsp;&nbsp;$${item.price.toFixed(2)}<br>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 15px; text-align: right;">
          <strong>TOTAL: $${(order.amount / 100).toFixed(2)}</strong>
        </div>
        
        ${order.prepTime ? `
          <div style="margin-top: 15px; text-align: center; border: 1px solid #000; padding: 5px;">
            <strong>PREP TIME: ${order.prepTime}</strong>
          </div>
        ` : ''}
        
        <div style="margin-top: 20px; text-align: center; font-size: 12px;">
          <p>Thank you for your business!</p>
          <p>2022 S Broad St, Winston-Salem, NC 27127</p>
          <p>(336) 283-9609</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order ${order.id}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // group menu items by category
  const groupedMenu = menu[0].reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Notifications:</span>
            <button
              onClick={() => {
                if (notificationsEnabled) {
                  setNotificationsEnabled(false);
                } else {
                  Notification.requestPermission().then(permission => {
                    setNotificationsEnabled(permission === 'granted');
                  });
                }
              }}
              className={`px-3 py-1 rounded text-sm ${
                notificationsEnabled 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {notificationsEnabled ? '🔔 ON' : '🔕 OFF'}
            </button>
          </div>
          <span className="text-sm text-gray-600">Logged in as: {currentUser?.email}</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <button
        onClick={togglePauseOrders}
        className={`mb-6 px-4 py-2 rounded text-white ${orderPaused ? "bg-red-600" : "bg-green-600"}`}
      >
        {orderPaused ? "Resume Orders" : "Pause Orders"}
      </button>

      <h2 className="text-xl font-semibold mb-2">Mark Items Unavailable</h2>
      {Object.entries(groupedMenu).map(([cat, items]) => (
        <div key={cat} className="mb-4 border rounded">
          <button
            onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
            className="w-full text-left px-4 py-2 bg-gray-100 font-semibold"
          >
            {cat}
          </button>
          {expandedCategory === cat && (
            <div className="p-3 space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
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
        {orders.filter(o => !o.ready).map(order => (
          <div key={order.id} className="border rounded p-4 shadow">
            <div className="flex justify-between mb-2">
              <div>
                <h2 className="font-semibold">Order for {order.customerName}</h2>
                <p className="text-sm text-gray-600">Payment ID: {order.paymentId}</p>
                {order.refunded && (
                  <p className="text-sm text-red-600 font-semibold">REFUNDED</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => printOrder(order)}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm"
                  title="Print Order"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => handleMarkReady(order.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  disabled={order.refunded}
                >
                  Mark Ready
                </button>
                {!order.refunded && (
                  <button
                    onClick={() => handleCancelOrder(order)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                    disabled={refundingOrders.has(order.id)}
                  >
                    {refundingOrders.has(order.id) ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>

            {order.items.map((item, i) => (
              <div key={i} className="ml-4 mb-1">
                <p className="font-medium">
                  {item.quantity}× {item.name} @ ${item.price.toFixed(2)}
                </p>
                {item.substitution && <p className="text-sm">Substitution: {item.substitution}</p>}
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
                onChange={e => handlePrepTimeChange(order.id, e.target.value)}
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
              Total: ${(order.amount / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
