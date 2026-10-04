const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARE & UPLOADS SETUP ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded images publicly
app.use("/uploads", express.static(uploadDir));

// Multer storage for receiving files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// In-memory data
let products = [];
let orders = [];
const ADMIN_CREDENTIALS = { username: "admin", password: "password123" };
const WHATSAPP_NUMBER = "96181738069";[span_0](start_span)[span_0](end_span)

// --- 2. BACKEND API ENDPOINTS ---

// Admin Login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return res.json({ success: true, message: "Logged in" });
  }
  res.status(401).json({ success: false, message: "Invalid login" });
});

// Get Products
app.get("/api/products", (req, res) => res.json(products));

// Add Product with Image Upload
app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, price, isAvailable } = req.body;

  const newProduct = {
    id: Date.now().toString(),
    name,
    price: parseFloat(price),
    isAvailable: isAvailable === "true" || isAvailable === true,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null
  };

  products.push(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

// Toggle Product Status (Available / Sold Out)
app.patch("/api/products/:id/status", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false });

  product.isAvailable = req.body.isAvailable;
  res.json({ success: true, product });
});

// Customer Orders & WhatsApp Link
app.post("/api/orders", (req, res) => {
  const { customerName, phone, cartItems, totalAmount } = req.body;
  const newOrder = { id: "ORD-" + Date.now(), customerName, phone, cartItems, totalAmount };
  
  orders.push(newOrder);

  const text = encodeURIComponent(`New Order #${newOrder.id}\nName: ${customerName}\nTotal: $${totalAmount}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;[span_1](start_span)[span_1](end_span)

  res.status(201).json({ success: true, order: newOrder, whatsappUrl });
});

// --- 3. FRONTEND USER INTERFACE ---
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Store Management</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 30px auto; padding: 0 20px; }
        form { background: #f4f4f4; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; }
        input, button { padding: 10px; font-size: 16px; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .card { border: 1px solid #ccc; padding: 10px; border-radius: 8px; text-align: center; }
        .card img { max-width: 100%; height: 120px; object-fit: cover; border-radius: 4px; }
        .sold-out { opacity: 0.5; }
      </style>
    </head>
    <body>
      <h2>Add New Product</h2>
      <form id="addProductForm">
        <input type="text" id="productName" placeholder="Product Name" required />
        <input type="number" id="productPrice" placeholder="Price ($)" step="0.01" required />
        <input type="file" id="productImage" accept="image/*" required />
        <button type="submit">Upload & Add Product</button>
      </form>

      <h2>Product Catalog</h2>
      <div id="productGrid" class="product-grid"></div>

      <script>
        // Send Form Data with Image Binary
        document.getElementById("addProductForm").addEventListener("submit", async (e) => {
          e.preventDefault();

          const formData = new FormData();
          formData.append("name", document.getElementById("productName").value);
          formData.append("price", document.getElementById("productPrice").value);
          formData.append("isAvailable", "true");
          formData.append("image", document.getElementById("productImage").files[0]);

          const response = await fetch("/api/products", {
            method: "POST",
            body: formData // Sends binary multipart content
          });

          if (response.ok) {
            document.getElementById("addProductForm").reset();
            loadProducts();
          } else {
            alert("Failed to upload product");
          }
        });

        // Load Products
        async function loadProducts() {
          const res = await fetch("/api/products");
          const products = await res.json();
          const grid = document.getElementById("productGrid");
          grid.innerHTML = "";

          products.forEach(p => {
            const card = document.createElement("div");
            card.className = \`card \${p.isAvailable ? '' : 'sold-out'}\`;
            card.innerHTML = \`
              \${p.imageUrl ? \`<img src="\${p.imageUrl}" alt="\${p.name}">\` : '<p>No image</p>'}
              <h3>\${p.name}</h3>
              <p>$\${p.price}</p>
              <p><strong>\${p.isAvailable ? 'Available' : 'Sold Out'}</strong></p>
              <button onclick="toggleStatus('\${p.id}', \${!p.isAvailable})">
                Mark as \${p.isAvailable ? 'Sold Out' : 'Available'}
              </button>
            \`;
            grid.appendChild(card);
          });
        }

        // Toggle Sold Out Status
        async function toggleStatus(id, newStatus) {
          await fetch(\`/api/products/\${id}/status\`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAvailable: newStatus })
          });
          loadProducts();
        }

        loadProducts();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

                    
