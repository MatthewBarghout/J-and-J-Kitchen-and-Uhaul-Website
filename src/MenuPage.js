import React from "react";
import Menu from "./Menu";
import Layout from "./Layout";

function MenuPage({ addToCart, totalItems, setShowCart, unavailableItems = [] }) {
  return (
    <Layout totalItems={totalItems} setShowCart={setShowCart}>
      <Menu onAddToCart={addToCart} unavailableItems={unavailableItems} />
    </Layout>
  );
}

export default MenuPage;
