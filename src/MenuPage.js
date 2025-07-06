import React from "react";
import Menu from "./Menu";
import { Link } from "react-router-dom";

function MenuPage({ addToCart, totalItems, setShowCart }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="sticky top-0 bg-white border-b shadow-sm z-50 py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">J and J Kitchen & U-Haul</h1>
        <div className="space-x-4 text-sm font-medium text-gray-700">
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/admin">Admin</Link>
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

      <main className="max-w-7xl mx-auto p-6">
        <Menu onAddToCart={addToCart} />
      </main>
    </div>
  );
}

export default MenuPage;
