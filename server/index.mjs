import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const ownersFile = path.join(dataDir, "owners.json");
fs.mkdirSync(dataDir, { recursive: true });

const seedOwners = [
  { clientId: "YA-101", email: "owner@abc-traders.b2bapp.in", password: "ChangeMe@123", active: true },
  { clientId: "YA-102", email: "owner@global-fashion.b2bapp.in", password: "ChangeMe@123", active: true },
  { clientId: "YA-103", email: "owner@shree-enterprises.b2bapp.in", password: "ChangeMe@123", active: false }
];

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(password, record) {
  const candidate = crypto.scryptSync(password, record.salt, 64);
  const stored = Buffer.from(record.hash, "hex");
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}
function loadOwners() {
  if (!fs.existsSync(ownersFile)) {
    const records = seedOwners.map((x) => {
      const { salt, hash } = hashPassword(x.password);
      return { clientId: x.clientId, email: x.email.toLowerCase(), salt, hash, active: x.active };
    });
    fs.writeFileSync(ownersFile, JSON.stringify(records, null, 2));
  }
  return JSON.parse(fs.readFileSync(ownersFile, "utf8"));
}
const owners = loadOwners();

const storeFile = path.join(dataDir, "store.json");
const seedStore = {
  products: [
    {id:"P-1001",name:"Smart Watch",sku:"SW-001",category:"Electronics",price:"₹1,999",stock:84,status:"Active",clientId:"YA-101"},
    {id:"P-1002",name:"Sports Shoes",sku:"SS-204",category:"Footwear",price:"₹2,499",stock:42,status:"Active",clientId:"YA-101"},
    {id:"P-1003",name:"Cotton Shirt",sku:"CS-310",category:"Fashion",price:"₹899",stock:126,status:"Active",clientId:"YA-101"},
    {id:"P-1004",name:"Travel Bag",sku:"TB-118",category:"Bags",price:"₹1,299",stock:0,status:"Draft",clientId:"YA-101"}
  ],
  customers: [
    {id:"C-1001",name:"Rahul Traders",phone:"+91 98765 43210",email:"rahul@example.com",address:"Mumbai, Maharashtra",orders:18,status:"Active",clientId:"YA-101"},
    {id:"C-1002",name:"Sharma Stores",phone:"+91 98200 11223",email:"sharma@example.com",address:"Thane, Maharashtra",orders:11,status:"Active",clientId:"YA-101"},
    {id:"C-1003",name:"M K Enterprises",phone:"+91 97690 44556",email:"mk@example.com",address:"Kalyan, Maharashtra",orders:7,status:"Active",clientId:"YA-101"}
  ],
  orders: [
    {id:"ORD-1001",customer:"Rahul Traders",phone:"+91 98765 43210",customerId:"C-1001",clientId:"YA-101",items:4,amount:12460,status:"Pending",createdAt:"Today, 10:42 AM"},
    {id:"ORD-1002",customer:"Sharma Stores",phone:"+91 98200 11223",customerId:"C-1002",clientId:"YA-101",items:7,amount:28750,status:"Confirmed",createdAt:"Today, 09:18 AM"},
    {id:"ORD-0999",customer:"M K Enterprises",phone:"+91 97690 44556",customerId:"C-1003",items:3,amount:8490,status:"Packed",createdAt:"Yesterday, 05:31 PM"}
  ]
};
function loadStore() {
  if (!fs.existsSync(storeFile)) fs.writeFileSync(storeFile, JSON.stringify(seedStore, null, 2));
  return JSON.parse(fs.readFileSync(storeFile, "utf8"));
}
function saveStore(store) { fs.writeFileSync(storeFile, JSON.stringify(store, null, 2)); }
function ownerClient(req) { return req.owner?.clientId; }

const sessions = new Map();
const SESSION_TTL = 8 * 60 * 60 * 1000;

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function createSession(clientId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { clientId, expiresAt: Date.now() + SESSION_TTL });
  return token;
}
function auth(req, res, next) {
  const token = req.cookies.b2b_owner_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Owner session expired" });
  }
  req.owner = session;
  next();
}

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const owner = owners.find((x) => x.email === email);
  if (!owner || !owner.active || !verifyPassword(password, owner)) {
    return res.status(401).json({ error: "Invalid owner credentials" });
  }
  const token = createSession(owner.clientId);
  res.cookie("b2b_owner_session", token, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL, path: "/"
  });
  return res.json({ clientId: owner.clientId });
});

app.get("/api/auth/me", auth, (req, res) => res.json({ clientId: req.owner.clientId }));

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies.b2b_owner_session;
  if (token) sessions.delete(token);
  res.clearCookie("b2b_owner_session", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  res.status(204).end();
});


app.get("/api/owner/data", auth, (_req, res) => {
  const clientId = ownerClient(_req);
  const store = loadStore();
  return res.json({
    clientId,
    products: store.products.filter(x => x.clientId === clientId),
    customers: store.customers.filter(x => x.clientId === clientId),
    orders: store.orders.filter(x => x.clientId === clientId)
  });
});

app.post("/api/owner/products", auth, (req, res) => {
  const clientId = ownerClient(req);
  const { name, price, stock, sku, category } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Product name is required" });
  const numericStock = Number(stock);
  if (!Number.isFinite(numericStock) || numericStock < 0) return res.status(400).json({ error: "Stock must be a non-negative number" });
  const store = loadStore();
  const product = {
    id: "P-" + Date.now(),
    name: String(name).trim(),
    sku: String(sku || ("SKU-" + Date.now().toString().slice(-6))).trim(),
    category: String(category || "General").trim(),
    price: String(price || "₹0").trim(),
    stock: numericStock,
    status: "Active",
    clientId
  };
  store.products.unshift(product);
  saveStore(store);
  res.status(201).json(product);
});

app.patch("/api/owner/products/:id", auth, (req, res) => {
  const clientId = ownerClient(req);
  const store = loadStore();
  const index = store.products.findIndex(x => x.id === req.params.id && x.clientId === clientId);
  if (index < 0) return res.status(404).json({ error: "Product not found" });
  const current = store.products[index];
  const next = { ...current };
  for (const key of ["name","sku","category","price","status"]) if (req.body?.[key] !== undefined) next[key] = String(req.body[key]);
  if (req.body?.stock !== undefined) {
    const stock = Number(req.body.stock);
    if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: "Stock must be non-negative" });
    next.stock = stock;
  }
  store.products[index] = next;
  saveStore(store);
  res.json(next);
});

app.delete("/api/owner/products/:id", auth, (req, res) => {
  const clientId = ownerClient(req);
  const store = loadStore();
  const before = store.products.length;
  store.products = store.products.filter(x => !(x.id === req.params.id && x.clientId === clientId));
  if (store.products.length === before) return res.status(404).json({ error: "Product not found" });
  saveStore(store);
  res.status(204).end();
});

app.patch("/api/owner/customers/:id", auth, (req, res) => {
  const clientId = ownerClient(req);
  const store = loadStore();
  const index = store.customers.findIndex(x => x.id === req.params.id && x.clientId === clientId);
  if (index < 0) return res.status(404).json({ error: "Customer not found" });
  const allowed = ["name","phone","email","address","orders","status"];
  const next = { ...store.customers[index] };
  for (const key of allowed) if (req.body?.[key] !== undefined) next[key] = req.body[key];
  store.customers[index] = next;
  saveStore(store);
  res.json(next);
});

app.patch("/api/owner/orders/:id/status", auth, (req, res) => {
  const clientId = ownerClient(req);
  const allowed = ["Pending","Confirmed","Packed","Shipped","Delivered","Cancelled"];
  const status = req.body?.status;
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid order status" });
  const store = loadStore();
  const index = store.orders.findIndex(x => x.id === req.params.id && x.clientId === clientId);
  if (index < 0) return res.status(404).json({ error: "Order not found" });
  const order = store.orders[index];
  if (order.status === "Delivered" || order.status === "Cancelled") return res.status(409).json({ error: "Closed orders cannot change status" });
  order.status = status;
  store.orders[index] = order;
  saveStore(store);
  res.json(order);
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "b2b-owner-auth" }));

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log("B2BApp auth server listening on http://localhost:" + port));
