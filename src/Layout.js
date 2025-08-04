
import React from "react";
import { Link } from "react-router-dom";

function Layout({ children, totalItems, setShowCart }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="sticky top-0 bg-white border-b shadow-sm z-50 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center">
        <h1 className="text-lg sm:text-2xl font-bold text-green-700">J and J Kitchen & U-Haul</h1>
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm font-medium text-gray-700">
          <Link to="/" className="hover:text-green-700 transition-colors duration-200 py-2 px-1">Home</Link>
          <Link to="/menu" className="hover:text-green-700 transition-colors duration-200 py-2 px-1">Menu</Link>
          <Link to="/admin" className="hover:text-green-700 transition-colors duration-200 py-2 px-1">Admin</Link>
          <button onClick={() => setShowCart(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <span className="text-lg sm:text-xl">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default Layout;
