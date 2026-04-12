import React, { useState, useEffect } from 'react';
import { CssBaseline } from '@material-ui/core';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Navbar, Products, Cart, Checkout } from './components';

const App = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ line_items: [], total_items: 0, subtotal: { formatted_with_symbol: '₹0' } });
  const [order, setOrder] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  // --- DYNAMIC API URL ---
  // This picks up the IP from Docker during build. Defaults to localhost for local dev.
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      const formatted = data.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        price: { formatted_with_symbol: `₹${item.price}` },
        image: { source: item.image_url, url: item.image_url }
      }));
      setProducts(formatted);
    } catch (err) { console.error("Fetch Products Error:", err); }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`);
      const data = await response.json();
      
      const formattedItems = data.map(item => ({
        id: item.cart_id.toString(),
        name: item.name,
        quantity: item.quantity,
        line_total: { formatted_with_symbol: `₹${item.price * item.quantity}` },
        image: { url: item.image_url }
      }));

      const totalValue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      setCart({
        line_items: formattedItems,
        total_items: data.length,
        subtotal: { formatted_with_symbol: `₹${totalValue}` }
      });
    } catch (err) { console.error("Fetch Cart Error:", err); }
  };

  const handleAddToCart = async (productId, quantity) => {
    try {
      await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      fetchCart(); 
    } catch (err) { console.error("Add to Cart Error:", err); }
  };

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <CssBaseline />
        <Navbar totalItems={cart.total_items} handleDrawerToggle={handleDrawerToggle} />
        <Switch>
          <Route exact path="/">
            <Products products={products} onAddToCart={handleAddToCart} />
          </Route>
          <Route exact path="/cart">
            <Cart 
              cart={cart} 
              onUpdateCartQty={() => {}} 
              onRemoveFromCart={() => {}} 
              onEmptyCart={() => {}} 
            />
          </Route>
          <Route path="/checkout" exact>
            <Checkout cart={cart} order={order} onCaptureCheckout={() => {}} error={errorMessage} />
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;