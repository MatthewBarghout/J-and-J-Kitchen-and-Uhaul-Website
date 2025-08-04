import React, { useState, useRef } from "react";
import rawMenu from "./menuData";
import SauceSelector from "./SauceSelector";

const defaultFlavors = [
  "Hot Sauce",
  "BBQ",
  "Buffalo",
  "Ketchup",
  "Ranch",
  "Honey Mustard",
  "Cocktail",
  "Sweet Chili",
  "Blue Cheese",
  "Tartar",
  "Slaw"
];

const menu = rawMenu.flat().map(item => ({
  ...item,
  availableFlavors: item.availableFlavors || defaultFlavors,
  freeSauceCount: item.freeSauceCount ?? 0
}));

export default function Menu({ onAddToCart, unavailableItems = [] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [comboChoices, setComboChoices] = useState({});
  const [wingChoices, setWingChoices] = useState({});
  const [sauceSelections, setSauceSelections] = useState({});
  const [itemOptions, setItemOptions] = useState({});
  const sauceChangeHandlersRef = useRef({});

  const groupedMenu = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const getStableSauceHandler = (itemId) => {
    if (!sauceChangeHandlersRef.current[itemId]) {
      sauceChangeHandlersRef.current[itemId] = (selection) => {
        setSauceSelections((prev) => ({
          ...prev,
          [itemId]: selection,
        }));
      };
    }
    return sauceChangeHandlersRef.current[itemId];
  };

  const isWing = (item) => /Wings/i.test(item.name);
  const getWingCount = (item) => {
    const match = item.name.match(/(\d+)\s*(pc\s*)?(Wings)/i);
    return match ? parseInt(match[1]) : 0;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border space-y-4 sm:space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">J and J Kitchen Menu</h2>

      {/* Drawer Toggle & Header */}
      <div className="sticky top-0 z-40 bg-white flex justify-between items-center py-2 px-2 sm:px-4 border-b shadow-sm">
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-green-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 rounded border border-gray-300 shadow-sm bg-white"
        >
          <span className="block sm:hidden">📋</span>
          <span className="hidden sm:block">Browse Menu</span>
          <span className="block sm:hidden">Menu</span>
        </button>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
          🕒 <span className="hidden sm:inline">11:30 am – 6:00 pm</span><span className="sm:hidden">11:30-6pm</span>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex">
          <div className="w-64 sm:w-72 bg-white h-full shadow-lg p-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg sm:text-xl font-bold">Full Menu</h3>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="text-xl hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            <ul className="divide-y">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <li key={category} className="py-2 flex justify-between">
                  <button
                    onClick={() => {
                      const el = document.getElementById(category);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      setDrawerOpen(false);
                    }}
                    className="text-gray-700 hover:text-green-600"
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

      {/* Category Nav */}
      <div className="sticky top-0 z-10 bg-white py-2 shadow-sm border-b flex items-center">
        <div id="category-scroll" className="overflow-x-auto flex space-x-2 sm:space-x-4 px-2 sm:px-4 scrollbar-thin">
          {Object.keys(groupedMenu).map(category => (
            <button
              key={category}
              onClick={() => document.getElementById(category)?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-green-700 px-2 py-1 whitespace-nowrap"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {Object.entries(groupedMenu).map(([category, items]) => (
        <div key={category} id={category} className="scroll-mt-24">
          <h3 className="text-xl sm:text-2xl font-semibold text-green-700 mb-3 border-b pb-1">{category}</h3>
          <div className="space-y-3 sm:space-y-4">
            {items.map(item => {
              const numWings = getWingCount(item);
              const unavailable = unavailableItems.includes(item.id);

              return (
                <div key={item.id} className={`bg-gray-50 border rounded-lg p-3 sm:p-5 shadow-sm ${unavailable ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base sm:text-lg leading-tight">{item.name}</h4>
                      {item.description && <p className="text-xs sm:text-sm text-gray-600 mt-1">{item.description}</p>}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm sm:text-base whitespace-nowrap">${item.price.toFixed(2)}</span>
                  </div>

                  {/* Substitution */}
                  {(item.category === 'Combinations' || /Dinner/i.test(item.name)) && (
                    <div className="mt-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Substitution:</label>
                      <select
                        value={comboChoices[item.id] || ''}
                        onChange={e => setComboChoices(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full sm:w-auto border border-gray-300 px-2 py-1 rounded text-sm"
                      >
                        <option value="">No Substitution</option>
                        <option value="Okra">Okra (+$0.50)</option>
                        <option value="Fries">Fries (+$0.50)</option>
                      </select>
                    </div>
                  )}

                  {/* Wing Options */}
                  {isWing(item) && numWings >= 6 && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {['allFlats', 'allDrums', 'sauced'].map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs sm:text-sm">
                            <input
                              type="checkbox"
                              checked={wingChoices[item.id]?.[opt] || false}
                              onChange={e => setWingChoices(prev => ({ ...prev, [item.id]: { ...prev[item.id], [opt]: e.target.checked } }))}
                              className="rounded"
                            />
                            <span className="leading-tight">{opt === 'sauced' ? 'Sauced (+$1.25 per 6)' : `${opt === 'allFlats' ? 'All Flats' : 'All Drums'} (+$1.00)`}</span>
                          </label>
                        ))}
                      </div>
                      {wingChoices[item.id]?.sauced && (
                        <select
                          value={wingChoices[item.id]?.saucedFlavor || ''}
                          onChange={e => setWingChoices(prev => ({ ...prev, [item.id]: { ...prev[item.id], saucedFlavor: e.target.value } }))}
                          className="mt-1 border border-gray-300 px-2 py-1 rounded text-sm w-full"
                        >
                          <option value="">Select Flavor</option>
                          {defaultFlavors.map(fl => <option key={fl} value={fl}>{fl}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Sauce Selector */}
                  <div className="mt-2">
                    <SauceSelector
                      freeSauceCount={item.freeSauceCount}
                      availableFlavors={item.availableFlavors}
                      onChange={getStableSauceHandler(item.id)}
                    />
                  </div>

                  {/* Item Options */}
                  {item.options && item.options.length > 0 && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      {item.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(itemOptions[item.id] || []).includes(opt)}
                            onChange={e => setItemOptions(prev => {
                              const cur = prev[item.id] || [];
                              return { ...prev, [item.id]: e.target.checked ? [...cur, opt] : cur.filter(x => x !== opt) };
                            })}
                            className="rounded"
                          />
                          <span className="leading-tight">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Add to Cart */}
                  <div className="mt-3 sm:mt-4">
                    <button
                      onClick={() => {
                        if (unavailable) return;
                        const combo = comboChoices[item.id] || null;
                        const wingOpts = wingChoices[item.id] || {};
                        const sauces = sauceSelections[item.id] || { sauces: [], extras: 0, extrasPrice: 0 };
                        const opts = itemOptions[item.id] || [];
                        const wingsCount = getWingCount(item);

                        let costAdd = 0;
                        if ((item.category === 'Combinations' || /Dinner/i.test(item.name)) && ['Okra','Fries'].includes(combo)) costAdd += 0.5;
                        const sets = Math.floor(wingsCount/6);
                        if (wingOpts.allFlats) costAdd += sets*1;
                        if (wingOpts.allDrums) costAdd += sets*1;
                        if (wingOpts.sauced) costAdd += sets*1.25;
                        costAdd += sauces.extrasPrice;

                        onAddToCart({
                          ...item,
                          basePrice: item.price,
                          price: parseFloat((item.price + costAdd).toFixed(2)),
                          substitution: combo,
                          wingUpgrades: wingOpts,
                          sauces: sauces.sauces,
                          extraSauceCount: sauces.extras,
                          extraSauceCharge: sauces.extrasPrice,
                          selectedOptions: opts
                        });
                      }}
                      disabled={unavailable}
                      className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-white rounded-lg font-medium text-sm sm:text-base transition-colors ${unavailable ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {unavailable ? 'Unavailable' : 'Add to Cart'}
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



