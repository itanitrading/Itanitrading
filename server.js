const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ItaniTrading123";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let products = [];
let orders = [];
let nextProductId = 1;

let adminSessions = new Set();

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    const token = Math.random().toString(36).slice(2);
    adminSessions.add(token);

    res.cookie = res.cookie || (() => {});
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false });
  }
});

function adminCheck(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

app.get("/api/admin/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  res.json({ admin: !!token && adminSessions.has(token) });
});

app.post("/api/admin/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    adminSessions.delete(token);
  }

  res.json({ success: true });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", adminCheck, upload.single("file"), (req, res) => {
  const product = {
    id: nextProductId++,
    name: req.body.name,
    price: Number(req.body.price),
    photo: req.body.photo || "",
    isAvailable: true
  };

  products.push(product);
  res.json(product);
});

app.patch("/api/products/:id", adminCheck, (req, res) => {
  const product = products.find(p => p.id == req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (req.body.price !== undefined) {
    product.price = Number(req.body.price);
  }

  if (req.body.isAvailable !== undefined) {
    product.isAvailable = Boolean(req.body.isAvailable);
  }

  res.json(product);
});

app.delete("/api/products/:id", adminCheck, (req, res) => {
  products = products.filter(p => p.id != req.params.id);
  res.json({ success: true });
});

app.get("/api/orders", adminCheck, (req, res) => {
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const order = {
    id: Date.now(),
    customer: req.body.customer,
    phone: req.body.phone,
    products: req.body.products || [],
    total: Number(req.body.total || 0),
    notes: req.body.notes || "",
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  res.json({ success: true, order });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ItaniTrading running on port ${PORT}`);
});
