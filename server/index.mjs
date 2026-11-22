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

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "b2b-owner-auth" }));

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log("B2BApp auth server listening on http://localhost:" + port));
