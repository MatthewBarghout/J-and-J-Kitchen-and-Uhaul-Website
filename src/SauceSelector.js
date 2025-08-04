// SauceSelector.jsx
import React, { useState, useEffect } from "react";

export default function SauceSelector({ freeSauceCount, availableFlavors, onChange }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const extras = Math.max(0, selected.length - freeSauceCount);
    const extrasPrice = parseFloat((extras * 0.56).toFixed(2));
    onChange({ sauces: selected, extras, extrasPrice });
  }, [selected, freeSauceCount, onChange]); // ✅ all deps included
  
  

  const toggleSauce = (flavor) => {
    setSelected((prev) =>
      prev.includes(flavor)
        ? prev.filter((s) => s !== flavor)
        : [...prev, flavor]
    );
  };

  return (
    <div className="mt-2">
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
        Choose Sauces (Free: {freeSauceCount}):
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
        {availableFlavors?.map((flavor) => (
          <button
            key={flavor}
            onClick={() => toggleSauce(flavor)}
            className={`px-2 py-1 text-xs sm:text-sm border rounded transition-colors ${
              selected.includes(flavor)
                ? "bg-green-500 text-white border-green-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-green-300"
            }`}
          >
            {flavor}
          </button>
        ))}
      </div>
      {selected.length > freeSauceCount && (
        <p className="text-xs sm:text-sm text-red-500 mt-1 font-medium">
          {selected.length - freeSauceCount} extra sauce(s) +${((selected.length - freeSauceCount) * 0.56).toFixed(2)}
        </p>
      )}
    </div>
  );
}
