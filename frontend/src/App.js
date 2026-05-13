import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { CssBaseline } from '@material-ui/core';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Navbar, Products, Cart, Checkout } from './components';

const App = () => {
  const [mobileOpen, setMobileOpen] = useState(false); // Cleaned up React.useState
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ line_items: [], total_items: 0, subtotal: { formatted_with_symbol: '₹0' } });
  const [order, setOrder] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  // --- DYNAMIC API URL ---
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Senior Tip: Wrap fetchers in useCallback to prevent unnecessary re-renders
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formatted = data.map((item) => ({
          id: item.id.toString(),
          name: item.name,
          description: item.description,
          price: { formatted_with_symbol: `₹${item.price}` },
          image: { source: item.image_url, url: item.image_url }
        }));
        setProducts(formatted);
      }
    } catch (err) { 
      console.error("Fetch Products Error:", err); 
      setErrorMessage("Failed to load products.");
    }
  }, [API_BASE_URL]);

  const fetchCart = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedItems = data.map(item => ({
          id: item.cart_id.toString(),
          name: item.name,
          quantity: item.quantity,
          line_total: { formatted_with_symbol: `₹${(item.price * item.quantity).toFixed(2)}` },
          image: { url: item.image_url }
        }));

        const totalValue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        setCart({
          line_items: formattedItems,
          total_items: data.reduce((sum, item) => sum + item.quantity, 0), // Count total quantity, not just rows
          subtotal: { formatted_with_symbol: `₹${totalValue.toFixed(2)}` }
        });
      }
    } catch (err) { 
      console.error("Fetch Cart Error:", err); 
    }
  }, [API_BASE_URL]);

  const handleAddToCart = async (productId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (response.ok) {
        fetchCart(); 
      }
    } catch (err) { 
      console.error("Add to Cart Error:", err); 
    }
  };

  // Fixed the Dependency Array Warning
  useEffect(() => {
    console.log("🚀 DevOps: Connecting to Backend at:", API_BASE_URL);
    fetchProducts();
    fetchCart();
  }, [fetchProducts, fetchCart]); 

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