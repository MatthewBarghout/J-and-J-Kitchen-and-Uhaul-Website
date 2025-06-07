import React, { useState } from "react";
import Menu from "./Menu";
import OrderForm from "./OrderForm";

function App() {
  const [cart, setCart] = useState([]);

  const getWingCount = (name) => {
    const match = name.match(/(\d+)\s*(pc\s*)?(Wings)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const calculateUpdatedPrice = (item) => {
    let extraCost = 0;
    const wingCount = getWingCount(item.name);
    const setsOf6 = Math.ceil(wingCount / 6);

    if (item.substitution === "Okra" || item.substitution === "Fries") {
      extraCost += 0.50;
    }

    if (item.category.includes("Wing") && wingCount >= 6) {
      if (item.wingUpgrades?.allFlats) extraCost += setsOf6 * 1.0;
      if (item.wingUpgrades?.allDrums) extraCost += setsOf6 * 1.0;
      if (item.wingUpgrades?.sauced) extraCost += setsOf6 * 1.25;
    }

    return parseFloat((item.basePrice + extraCost).toFixed(2));
  };

  const addToCart = (item) => {
    const existingItemIndex = cart.findIndex(
      (i) =>
        i.name === item.name &&
        (i.substitution || "") === (item.substitution || "") &&
        (i.wingUpgrades?.allFlats || false) === (item.wingUpgrades?.allFlats || false) &&
        (i.wingUpgrades?.allDrums || false) === (item.wingUpgrades?.allDrums || false) &&
        (i.wingUpgrades?.sauced || false) === (item.wingUpgrades?.sauced || false)
    );

    if (existingItemIndex !== -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, basePrice: item.price, quantity: 1 }]);
    }
  };

  const increaseQuantity = (index) => {
    const newCart = [...cart];
    newCart[index].quantity += 1;
    setCart(newCart);
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
      setCart(newCart);
    } else {
      removeFromCart(index);
    }
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-4xl font-extrabold text-center text-black-700 mb-10">
          J and J Kitchen & U-Haul
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Menu */}
          <Menu onAddToCart={addToCart} />
{/* RIGHT: Cart + Form */}
<div className="bg-white shadow-md rounded-lg p-4 border">
  <h2 className="text-2xl font-semibold mb-2">Cart</h2>
  <ul className="space-y-2">
    {cart.map((item, index) => {
      const numWings = getWingCount(item.name);

      return (
        <li
          key={index}
          className="flex justify-between items-center bg-gray-50 p-3 rounded border"
        >
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-800">
              {item.name} × {item.quantity}
            </p>

            {/* Editable substitution — for combos or anything with "Dinner" in name */}
            {(item.category === "Combinations" || /Dinner/i.test(item.name)) && (
              <select
                value={item.substitution || ""}
                onChange={(e) => {
                  const newCart = [...cart];
                  newCart[index].substitution = e.target.value;
                  newCart[index].price = calculateUpdatedPrice(newCart[index]);
                  setCart(newCart);
                }}
                className="text-xs border rounded px-1 py-0.5"
              >
                <option value="">No Substitution</option>
                <option value="Okra">Okra (+$0.50)</option>
                <option value="Fries">Fries (+$0.50)</option>
              </select>
            )}

            {/* Editable wing upgrades */}
            {item.category.includes("Wing") && numWings >= 6 && (
              <div className="text-xs space-x-2">
                {/* Only show Flats/Drums if exactly 6 */}
                {numWings === 6 && (
                  <>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.wingUpgrades?.allFlats || false}
                        onChange={(e) => {
                          const newCart = [...cart];
                          newCart[index].wingUpgrades = {
                            ...newCart[index].wingUpgrades,
                            allFlats: e.target.checked
                          };
                          newCart[index].price = calculateUpdatedPrice(newCart[index]);
                          setCart(newCart);
                        }}
                      />
                      <span className="ml-1">All Flats</span>
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={item.wingUpgrades?.allDrums || false}
                        onChange={(e) => {
                          const newCart = [...cart];
                          newCart[index].wingUpgrades = {
                            ...newCart[index].wingUpgrades,
                            allDrums: e.target.checked
                          };
                          newCart[index].price = calculateUpdatedPrice(newCart[index]);
                          setCart(newCart);
                        }}
                      />
                      <span className="ml-1">All Drums</span>
                    </label>
                  </>
                )}

                {/* Sauced always shown for wings ≥ 6 */}
                <label>
                  <input
                    type="checkbox"
                    checked={item.wingUpgrades?.sauced || false}
                    onChange={(e) => {
                      const newCart = [...cart];
                      newCart[index].wingUpgrades = {
                        ...newCart[index].wingUpgrades,
                        sauced: e.target.checked
                      };
                      newCart[index].price = calculateUpdatedPrice(newCart[index]);
                      setCart(newCart);
                    }}
                  />
                  <span className="ml-1">Sauced</span>
                </label>
              </div>
            )}

            <p className="text-gray-500 text-xs">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => increaseQuantity(index)}
              className="bg-blue-500 text-white px-2 rounded"
            >
              +
            </button>
            <button
              onClick={() => decreaseQuantity(index)}
              className="bg-yellow-500 text-white px-2 rounded"
            >
              -
            </button>
            <button
              onClick={() => removeFromCart(index)}
              className="bg-red-500 text-white px-2 rounded"
            >
              Remove
            </button>
          </div>
        </li>
      );
    })}
  </ul>

  <h3 className="text-lg font-semibold text-right text-green-600 mt-4">
    Cart Total: $
    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
  </h3>

  <div className="mt-6">
    <OrderForm cart={cart} onOrderComplete={() => setCart([])} />
  </div>
</div>

        </div>
      </div>
    </div>
  );
}

export default App;

