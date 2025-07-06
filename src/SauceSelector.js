// SauceSelector.jsx
import React, { useState, useEffect } from "react";

export default function SauceSelector({ freeSauceCount, availableFlavors, onChange }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const extras = Math.max(0, selected.length - freeSauceCount);
    const extrasPrice = parseFloat((extras * 0.56).toFixed(2));
    onChange({ sauces: selected, extras, extrasPrice });
  }, [selected, freeSauceCount, onChange]);

  const toggleSauce = (flavor) => {
    setSelected((prev) =>
      prev.includes(flavor)
        ? prev.filter((s) => s !== flavor)
        : [...prev, flavor]
    );
  };

  return (
    <div className="mt-2">
      <label className="text-sm font-medium text-gray-700">
        Choose Sauces (Free: {freeSauceCount}):
      </label>
      <div className="flex flex-wrap gap-2 mt-1">
        {availableFlavors?.map((flavor) => (
          <button
            key={flavor}
            onClick={() => toggleSauce(flavor)}
            className={`px-2 py-1 text-sm border rounded ${
              selected.includes(flavor)
                ? "bg-green-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {flavor}
          </button>
        ))}
      </div>
      {selected.length > freeSauceCount && (
        <p className="text-sm text-red-500 mt-1">
          {selected.length - freeSauceCount} extra sauce(s) +${(selected.length - freeSauceCount) * 0.56}
        </p>
      )}
    </div>
  );
}
