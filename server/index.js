const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Senior Tip: Use Environment Variables for DB connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Prudhviraj@310', 
    database: process.env.DB_NAME || 'ecommerce_db'
});

db.connect((err) => {
    if (err) {
        console.error('CRITICAL: Database connection failed: ' + err.message);
    } else {
        console.log('✅ Connected to MySQL Database.');
    }
});

// Health Check Route (Fixes "Cannot GET /")
app.get('/', (req, res) => {
    res.json({ status: "Online", message: "E-commerce API is running" });
});

// GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM products";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ error: "Table 'products' might be missing!", details: err });
        return res.json(data);
    });
});

// ADD TO CART
app.post('/api/cart', (req, res) => {
    const { productId, quantity } = req.body;
    // Check if productId exists to prevent crashes
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const sql = "INSERT INTO cart (product_id, quantity) VALUES (?, ?)";
    db.query(sql, [productId, quantity || 1], (err, result) => {
        if (err) return res.status(500).json({ error: "Check if 'cart' table exists!", details: err });
        return res.json({ message: "Added to cart", id: result.insertId });
    });
});

// GET CART ITEMS
app.get('/api/cart', (req, res) => {
    // Note: Ensure your 'products' table actually has 'image_url' column!
    const sql = `
        SELECT cart.id as cart_id, products.name, products.price, products.image_url, cart.quantity 
        FROM cart 
        JOIN products ON cart.product_id = products.id`;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ error: "Cart join failed. Check table names.", details: err });
        return res.json(data);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend Server running on http://0.0.0.0:${PORT}`);
});