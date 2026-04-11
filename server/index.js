const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Prudhviraj@310', 
    database: 'ecommerce_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database.');
});

// GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM products";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// ADD TO CART
app.post('/api/cart', (req, res) => {
    const { productId, quantity } = req.body;
    const sql = "INSERT INTO cart (product_id, quantity) VALUES (?, ?)";
    db.query(sql, [productId, quantity || 1], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Added to cart" });
    });
});

// GET CART ITEMS (This is what makes the Cart page show items)
app.get('/api/cart', (req, res) => {
    const sql = `
        SELECT cart.id as cart_id, products.name, products.price, products.image_url, cart.quantity 
        FROM cart 
        JOIN products ON cart.product_id = products.id`;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.listen(5000, () => {
    console.log("Backend Server is running on http://localhost:5000");
});