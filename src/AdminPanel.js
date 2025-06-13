import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

function AdminPanel() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    };

    fetchOrders();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-green-700">Admin Panel - Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded shadow border">
              <p className="text-sm text-gray-500">Order ID: {order.id}</p>
              <p className="text-lg font-semibold">{order.name}</p>
              <p className="text-gray-600 text-sm mb-2">
                {order.createdAt?.toDate().toLocaleString() || "Unknown time"}
              </p>
              <ul className="list-disc ml-6 mb-2">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.quantity} — ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="text-right font-bold text-green-700">
                Total: ${order.total.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
