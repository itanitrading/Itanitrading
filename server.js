const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ItaniTrading123";

// Deplexo's /app folder is read-only.
// /tmp is writable during runtime.
const UPLOAD_DIR = "/tmp/itanitrading-uploads";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, crypto.randomUUID() + ext);
    }
  })
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(UPLOAD_DIR));

app.use(express.static(__dirname));

const products = [];
const orders = [];
const sessions = new Set();

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ")
    ? auth.substring(7)
    : "";

  if (!sessions.has(token)) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

// ==================== ADMIN LOGIN ====================

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Wrong password"
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.add(token);

  res.json({
    success: true,
    token
  });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({
    loggedIn: true
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ")
    ? auth.substring(7)
    : "";

  sessions.delete(token);

  res.json({
    success: true
  });
});

// ==================== PRODUCTS ====================

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", requireAdmin, upload.single("image"), (req, res) => {
  const { name, price, available } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({
      error: "Product name and price are required"
    });
  }

  const product = {
    id: crypto.randomUUID(),
    name,
    price: Number(price),
    available: available !== "false",
    image: req.image
      ? `/uploads/${req.image.filename}`
      : "",
    createdAt: new Date().toISOString()
  };

  products.push(product);

  res.json(product);
});

app.patch("/api/products/:id", requireAdmin, upload.single("image"), (req, res) => {
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  if (req.body.name !== undefined) {
    product.name = req.body.name;
  }

  if (req.body.price !== undefined) {
    product.price = Number(req.body.price);
  }

  if (req.body.available !== undefined) {
    product.available =
      req.body.available === true ||
      req.body.available === "true";
  }

  if (req.image) {
    product.image = `/uploads/${req.image.filename}`;
  }

  res.json(product);
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  products.splice(index, 1);

  res.json({
    success: true
  });
});

// ==================== ORDERS ====================

app.get("/api/orders", requireAdmin, (req, res) => {
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const { customer, phone, address, items, total } = req.body;

  if (!customer || !items || !items.length) {
    return res.status(400).json({
      error: "Customer and order items are required"
    });
  }

  const order = {
    id: crypto.randomUUID(),
    customer,
    phone: phone || "",
    address: address || "",
    items,
    total: Number(total || 0),
    createdAt: new Date().toISOString()
  };

  orders.push(order);

  res.json({
    success: true,
    order
  });
});

// ==================== PAGES ====================

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==================== START SERVER ====================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ItaniTrading running on port ${PORT}`);
});
