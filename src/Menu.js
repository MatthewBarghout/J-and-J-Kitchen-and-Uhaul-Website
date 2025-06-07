import React, { useState } from "react";
import menu from "./menuData";

export default function Menu({ onAddToCart }) {
  const[drawerOpen, setDrawerOpen] = useState(false);
  // Group menu by category
  const groupedMenu = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const [comboChoices, setComboChoices] = useState({});
  const [wingChoices, setWingChoices] = useState({});

  
  const isWing = (item) => item.category.includes("Wing");

  const getWingCount = (item) => {
    const match = item.name.match(/(\d+)\s*(pc\s*)?(Wings)/i);
    return match ? parseInt(match[1]) : 0;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border space-y-6">
      <h2 className="text-3xl font-bold mb-4">J and J Kitchen Menu</h2>
     {/* Drawer Toggle Button (styled like DoorDash) */}
{/* Menu Header with Browse + Hours */}
<div className="sticky top-0 z-40 bg-white flex justify-between items-center py-2 px-4 border-b shadow-sm">

  <button
    onClick={() => setDrawerOpen(true)}
    className="inline-flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium text-sm px-3 py-1 rounded border border-gray-300 shadow-sm bg-white"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
    Browse Menu
  </button>

  {/* Store Hours */}
  <div className="flex items-center gap-1 text-sm text-gray-600">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15z" />
    </svg>
    11:00 am – 6:10 pm
  </div>
</div>

{/* Drawer (slides from left) */}
{drawerOpen && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-start">
    <div className="w-72 bg-white h-full shadow-lg p-4 space-y-4 relative">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-xl font-bold">Full Menu</h3>
        <button
          onClick={() => setDrawerOpen(false)}
          className="text-gray-600 hover:text-black text-2xl"
          aria-label="Close Drawer"
        >
          ✕
        </button>
      </div>

      <ul className="divide-y text-sm">
        {Object.entries(groupedMenu)
          .filter(([cat]) => cat !== "Most Ordered" && cat !== "Desserts")
          .map(([category, items]) => (
            <li key={category} className="py-2 flex justify-between items-center">
              <button
                onClick={() => {
                  const el = document.getElementById(category);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  setDrawerOpen(false);
                }}
                className="text-gray-700 hover:text-green-600 text-left"
              >
                {category}
              </button>
              <span className="text-gray-400">{items.length}</span>
            </li>
          ))}
      </ul>
    </div>
  </div>
)}




      {/* Sticky Category Navigation */}
      <div className="sticky top-0 z-10 bg-white py-2 shadow-sm border-b flex items-center">
  <div
    id="category-scroll"
    className="overflow-x-auto flex-1 flex space-x-4 px-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 scroll-smooth"
  >
    {Object.keys(groupedMenu).map((category) => (
      <button
        key={category}
        onClick={() => {
          const el = document.getElementById(category);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className="text-sm font-medium text-gray-700 hover:text-green-700 px-2 py-1 border-b-2 border-transparent hover:border-green-500 whitespace-nowrap"
      >
        {category}
      </button>
    ))}
  </div>

  <button
    onClick={() => {
      document.getElementById("category-scroll")?.scrollBy({ left: 150, behavior: "smooth" });
    }}
    className="px-3 text-2xl text-gray-700 hover:text-green-600"
  >
    &gt;
  </button>
</div>



      {/* Grouped Menu */}
      {Object.entries(groupedMenu).map(([category, items]) => (
        <div key={category} id={category} className="scroll-mt-24">
          <h3 className="text-2xl font-semibold text-green-700 mb-3 border-b pb-1">{category}</h3>

          <div className="space-y-4">
            {items.map((item) => {
              const numWings = getWingCount(item);

              return (
                <div
                  key={item.id}
                  className="bg-gray-50 border rounded-lg p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="text-gray-800 font-semibold text-base">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                 {/* Substitution Dropdown for Combos OR Dinners */}
{(item.category === "Combinations" || /Dinner/i.test(item.name)) && (
  <div className="mt-2">
    <label className="text-sm text-gray-700">Substitution:</label>
    <select
      value={comboChoices[item.id] || ""}
      onChange={(e) =>
        setComboChoices((prev) => ({
          ...prev,
          [item.id]: e.target.value
        }))
      }
      className="ml-2 border rounded px-2 py-1 text-sm"
    >
      <option value="">No Substitution</option>
      <option value="Okra">Okra (+$0.50)</option>
      <option value="Fries">Fries (+$0.50)</option>
    </select>
  </div>
)}

{/* Wing Options — Only for EXACTLY 6 Wings */}
{isWing(item) && getWingCount(item) >= 6 && (
  <div className="mt-2 space-y-1">
    <label className="text-sm font-medium text-gray-700">Wing Options:</label>
    <div className="flex gap-3 flex-wrap text-sm">

      {/* Flats (only if exactly 6) */}
      {getWingCount(item) === 6 && (
        <label>
          <input
            type="checkbox"
            onChange={(e) =>
              setWingChoices((prev) => ({
                ...prev,
                [item.id]: {
                  ...prev[item.id],
                  allFlats: e.target.checked
                }
              }))
            }
          />
          <span className="ml-1">All Flats (+$1.00)</span>
        </label>
      )}

      {/* Drums (only if exactly 6) */}
      {getWingCount(item) === 6 && (
        <label>
          <input
            type="checkbox"
            onChange={(e) =>
              setWingChoices((prev) => ({
                ...prev,
                [item.id]: {
                  ...prev[item.id],
                  allDrums: e.target.checked
                }
              }))
            }
          />
          <span className="ml-1">All Drums (+$1.00)</span>
        </label>
      )}

      {/* Sauced (available for 6, 12, 18...) */}
      <label>
        <input
          type="checkbox"
          onChange={(e) =>
            setWingChoices((prev) => ({
              ...prev,
              [item.id]: {
                ...prev[item.id],
                sauced: e.target.checked
              }
            }))
          }
        />
        <span className="ml-1">Sauced (+$1.25 per 6)</span>
      </label>

    </div>
  </div>
)}


{/* Add to Cart Button */}
<div className="mt-4 text-right">
  <button
    onClick={() => {
      const comboSub = comboChoices[item.id];
      const wingOpts = wingChoices[item.id] || {};
      

      let extraCost = 0;

      // Combo substitutions: valid for "Combinations" or "Dinner"
      if (
        (item.category === "Combinations" || /Dinner/i.test(item.name)) &&
        (comboSub === "Okra" || comboSub === "Fries")
      ) {
        extraCost += 0.50;
      }

      // Wing upsells: all flats or drums only if exactly 6 wings
      if (isWing(item) && numWings === 6) {
        if (wingOpts.allFlats) extraCost += 1.00;
        if (wingOpts.allDrums) extraCost += 1.00;
      }

      // Sauced: applies $1.25 for every 6 wings (e.g., 6, 12, 18...)
      if (isWing(item) && wingOpts.sauced && numWings >= 6) {
        const setsOf6 = Math.floor(numWings / 6);
        extraCost += setsOf6 * 1.25;
      }

      const finalItem = {
        ...item,
        substitution: comboSub || null,
        wingUpgrades: wingOpts,
        price: parseFloat((item.price + extraCost).toFixed(2))
      };

      onAddToCart(finalItem);
    }}
    className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-green-700 transition"
  >
    Add to Cart
  </button>
</div>

              
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
    </div>
  );
}


