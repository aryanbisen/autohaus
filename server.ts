import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import https from "https";
import http from "http";
import selfsigned from "selfsigned";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { User, Listing, Message, Chat, AdminStats } from "./src/types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Define Mock Data for bootstrapping
const defaultUsers: User[] = [
  {
    id: "user-admin",
    email: "admin@autohaus.de",
    name: "Admin Administrator",
    phone: "+49 170 11122233",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    isAdmin: true,
    registeredAt: "2026-06-10T10:00:00Z",
    token: "token-admin",
    password: "admin123"
  },
  {
    id: "user-seller1",
    email: "max.mustermann@autohaus.de",
    name: "Max Mustermann",
    phone: "+49 171 9876543",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
    isAdmin: false,
    registeredAt: "2026-06-11T12:00:00Z",
    token: "token-max",
    password: "max123"
  },
  {
    id: "user-seller2",
    email: "kaeufer@autohaus.de",
    name: "Anna Schmidt",
    phone: "+49 172 4455667",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    isAdmin: false,
    registeredAt: "2026-06-12T14:30:00Z",
    token: "token-buyer",
    password: "kaeufer123"
  }
];

const defaultListings: Listing[] = [
  {
    id: "listing-1",
    sellerId: "user-seller1",
    sellerName: "Max Mustermann",
    sellerPhone: "+49 171 9876543",
    sellerLocation: "München",
    brand: "Porsche",
    model: "911 Carrera S",
    mileage: 42000,
    year: 2021,
    fuelType: "Benzin",
    transmission: "Automatik",
    price: 119500,
    description: "Wunderschöner Porsche 911 Carrera S in Tiefschwarz-Metallic. Scheckheftgepflegt beim Porsche Zentrum. Unfallfrei, Nichtraucherfahrzeug, Vollleder-Ausstattung, Sportabgasanlage, Schiebedach, Bose Soundsystem.",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200"
    ],
    isApproved: true,
    status: "active",
    createdAt: "2026-06-12T08:00:00Z"
  },
  {
    id: "listing-2",
    sellerId: "user-seller1",
    sellerName: "Max Mustermann",
    sellerPhone: "+49 171 9876543",
    sellerLocation: "München",
    brand: "VW",
    model: "Golf VII GTI",
    mileage: 78000,
    year: 2018,
    fuelType: "Benzin",
    transmission: "Manuell",
    price: 24900,
    description: "Top gepflegter Golf GTI V7 Performance. 8-fach bereift auf schicken Alufelgen. Services lückenlos durchgeführt. Virtual Cockpit, LED Scheinwerfer, Einparkhilfe, Sitzheizung, Abstandstempomat.",
    images: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1200"
    ],
    isApproved: true,
    status: "active",
    createdAt: "2026-06-13T09:15:00Z"
  },
  {
    id: "listing-3",
    sellerId: "user-seller2",
    sellerName: "Anna Schmidt",
    sellerPhone: "+49 172 4455667",
    sellerLocation: "Hamburg",
    brand: "Tesla",
    model: "Model 3 Long Range",
    mileage: 29000,
    year: 2022,
    fuelType: "Elektro",
    transmission: "Automatik",
    price: 41500,
    description: "Tesla Model 3 Dual Motor Allradantrieb Long Range mit vollem Potenzial für autonomes Fahren (FSD aktiviert, Wert 7.500€). Exzellenter Akkuzustand, nur zuhause materialschonend geladen. Garagenwagen, unfallfrei.",
    images: [
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1571127246842-065cc8e1ad5f?auto=format&fit=crop&q=80&w=1200"
    ],
    isApproved: true,
    status: "active",
    createdAt: "2026-06-14T11:00:00Z"
  },
  {
    id: "listing-4",
    sellerId: "user-seller2",
    sellerName: "Anna Schmidt",
    sellerPhone: "+49 172 4455667",
    sellerLocation: "Hamburg",
    brand: "BMW",
    model: "320d Touring M-Sport",
    mileage: 95000,
    year: 2019,
    fuelType: "Diesel",
    transmission: "Automatik",
    price: 29800,
    description: "Perfektes Langstreckenfahrzeug. M-Sportpaket ab Werk. Adaptives LED Licht, Harman Kardon HiFi System, Head-Up Display, Keyless Entry, Elektrische Heckklappe, Rückfahrkamera, neue Bremsen.",
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1200"
    ],
    isApproved: true,
    status: "active",
    createdAt: "2026-06-14T16:45:00Z"
  },
  {
    id: "listing-pending",
    sellerId: "user-seller1",
    sellerName: "Max Mustermann",
    sellerPhone: "+49 171 9876543",
    sellerLocation: "München",
    brand: "Mercedes",
    model: "C63 AMG",
    mileage: 54000,
    year: 2020,
    fuelType: "Benzin",
    transmission: "Automatik",
    price: 72900,
    description: "Brutaler Sound und mega Optik. Dieses Inserat wartet auf die Freigabe durch das Moderationsteam, um optimal demonstriert zu werden.",
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=1200"
    ],
    isApproved: false,
    status: "active",
    createdAt: "2026-06-15T06:00:00Z"
  }
];

const defaultChats: Chat[] = [
  {
    id: "chat-1",
    listingId: "listing-1",
    listingBrand: "Porsche",
    listingModel: "911 Carrera S",
    listingPrice: 119500,
    listingImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
    buyerId: "user-seller2",
    buyerName: "Anna Schmidt",
    sellerId: "user-seller1",
    sellerName: "Max Mustermann",
    lastMessageText: "Hallo Max, ist der Preis noch leicht verhandelbar?",
    lastMessageTime: "2026-06-15T07:00:00Z",
    unreadCount: { "user-seller1": 1, "user-seller2": 0 }
  }
];

const defaultMessages: Message[] = [
  {
    id: "msg-12345",
    chatId: "chat-1",
    senderId: "user-seller2",
    receiverId: "user-seller1",
    content: "Hallo Max, ist der Preis noch leicht verhandelbar?",
    createdAt: "2026-06-15T07:00:00Z",
    isRead: false
  }
];

interface Database {
  users: User[];
  listings: Listing[];
  chats: Chat[];
  messages: Message[];
  favorites: {[userId: string]: string[]};
}

// Ensure database file exists and is populated
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const usersWithHashedPasswords = defaultUsers.map(u => ({
      ...u,
      password: u.password ? hashPassword(u.password) : undefined
    }));
    const db: Database = {
      users: usersWithHashedPasswords,
      listings: defaultListings,
      chats: defaultChats,
      messages: defaultMessages,
      favorites: {
        "user-seller2": ["listing-1", "listing-2"]
      }
    };
    // Note: writeDb is not used here directly to write seeded data because it would encrypt
    // fields. Actually, we want to write encrypted data to disk even on seeding!
    // So let's write plain and writeDb will encrypt on subsequent edits, OR let's use writeDb!
    // Using writeDb(db) is better because it encrypts the seeded data immediately!
    writeDb(db);
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db: Database = JSON.parse(content); // readDb is not called here to avoid decrypting, but wait!
      // Since readDb decrypts, if we read plain content from fs, it's encrypted!
      // Oh! That is an important detail!
      // In initDb(), we read DB_FILE directly using fs.readFileSync. If it is already encrypted,
      // parsing it as JSON is fine, but the values are encrypted.
      // So to make sure we compare plain emails, we should decrypt them!
      // Let's use readDb() here! Wait, if we use readDb(), it calls initDb() recursively! That will cause an infinite loop!
      // Ah! That is a very important catch!
      // So let's write a local readDecryptedDb() helper or just do decryption inside initDb:
      const decryptedUsers = db.users ? db.users.map(u => ({
        ...u,
        phone: u.phone ? decrypt(u.phone) : u.phone
      })) : [];

      let updated = false;

      if (!db.users) {
        db.users = [];
        updated = true;
      }
      for (const defUser of defaultUsers) {
        if (!decryptedUsers.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
          db.users.push({
            ...defUser,
            password: defUser.password ? hashPassword(defUser.password) : undefined
          });
          updated = true;
        }
      }

      // Ensure every user has a token and a password
      for (const u of db.users) {
        let userUpdated = false;
        if (!u.token) {
          const matchingDefault = defaultUsers.find(d => d.email.toLowerCase() === u.email.toLowerCase());
          u.token = matchingDefault ? matchingDefault.token : crypto.randomBytes(32).toString("hex");
          userUpdated = true;
        }
        if (!u.password) {
          const matchingDefault = defaultUsers.find(d => d.email.toLowerCase() === u.email.toLowerCase());
          const plainPass = matchingDefault ? matchingDefault.password : "fallback123";
          u.password = hashPassword(plainPass!);
          userUpdated = true;
        }
        if (userUpdated) updated = true;
      }

      if (!db.listings) {
        db.listings = [];
        updated = true;
      }
      for (const defListing of defaultListings) {
        if (!db.listings.some(l => l.id === defListing.id)) {
          db.listings.push(defListing);
          updated = true;
        }
      }

      if (!db.chats) {
        db.chats = [];
        updated = true;
      }
      for (const defChat of defaultChats) {
        if (!db.chats.some(c => c.id === defChat.id)) {
          db.chats.push(defChat);
          updated = true;
        }
      }

      if (!db.messages) {
        db.messages = [];
        updated = true;
      }
      for (const defMsg of defaultMessages) {
        if (!db.messages.some(m => m.id === defMsg.id)) {
          db.messages.push(defMsg);
          updated = true;
        }
      }

      if (!db.favorites) {
        db.favorites = {
          "user-seller2": ["listing-1", "listing-2"]
        };
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      }
    } catch (error) {
      console.error("Error patching existing database", error);
    }
  }
}

function readDb(): Database {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const db: Database = JSON.parse(content);

    // Decrypt sensitive fields transparently for application use
    if (db.users) {
      db.users = db.users.map(u => ({
        ...u,
        phone: u.phone ? decrypt(u.phone) : u.phone
      }));
    }
    if (db.listings) {
      db.listings = db.listings.map(l => ({
        ...l,
        sellerPhone: l.sellerPhone ? decrypt(l.sellerPhone) : l.sellerPhone
      }));
    }
    if (db.messages) {
      db.messages = db.messages.map(m => ({
        ...m,
        content: m.content ? decrypt(m.content) : m.content
      }));
    }

    return db;
  } catch (error) {
    console.error("Error reading database file", error);
    return { users: [], listings: [], chats: [], messages: [], favorites: {} };
  }
}

function writeDb(db: Database) {
  try {
    // Clone to prevent mutating in-memory runtime objects
    const encryptedDb = JSON.parse(JSON.stringify(db));

    // Encrypt sensitive fields before saving to disk
    if (encryptedDb.users) {
      encryptedDb.users = encryptedDb.users.map((u: any) => ({
        ...u,
        phone: u.phone ? encrypt(u.phone) : u.phone
      }));
    }
    if (encryptedDb.listings) {
      encryptedDb.listings = encryptedDb.listings.map((l: any) => ({
        ...l,
        sellerPhone: l.sellerPhone ? encrypt(l.sellerPhone) : l.sellerPhone
      }));
    }
    if (encryptedDb.messages) {
      encryptedDb.messages = encryptedDb.messages.map((m: any) => ({
        ...m,
        content: m.content ? encrypt(m.content) : m.content
      }));
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(encryptedDb, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file", error);
  }
}

// ----------------- CRYPTOGRAPHY HELPERS -----------------

// Symmetric Encryption (AES-256-CBC) for database fields
const ENCRYPTION_KEY = crypto.scryptSync("autohaus-secure-key-12345", "autohaus-salt", 32); // 32-byte key
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  if (!text) return "";
  try {
    const textParts = text.split(":");
    if (textParts.length < 2) return text; // If not encrypted, return as is
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = textParts.join(":");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    // If decryption fails (e.g. data was plaintext), fallback to return original text
    return text;
  }
}

// Memory-hard salted hashing (scrypt) for passwords
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue || !storedValue.includes(":")) return false;
  const [salt, hash] = storedValue.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === testHash;
}

// ----------------- SECURITY MIDDLEWARES -----------------

// 1. Rate Limiting for DoS Protection
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function rateLimiter(windowMs: number, maxRequests: number, message = "Zu viele Anfragen. Bitte versuchen Sie es später noch einmal.") {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();

    let record = rateLimits.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    record.count++;
    rateLimits.set(ip, record);

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// 2. Authentication Middleware (Confidentiality)
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentifizierung erforderlich. Bitte melden Sie sich an." });
  }

  const db = readDb();
  const user = db.users.find(u => u.token === token);
  if (!user) {
    return res.status(401).json({ error: "Ungültiges oder abgelaufenes Sitzungstoken. Bitte melden Sie sich erneut an." });
  }

  req.user = user;
  next();
}

// 3. Admin Authorization Middleware (Integrity)
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Zugriff verweigert. Administratorrechte erforderlich." });
  }
  next();
}

async function startServer() {
  initDb();
  const app = express();
  app.use(express.json({ limit: "20mb" }));

  // Security Headers via Helmet (includes HSTS for Transport Security)
  app.use(helmet({
    strictTransportSecurity: {
      maxAge: 31536000,       // 1 year in seconds
      includeSubDomains: true,
      preload: true
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://api.dicebear.com"],
        connectSrc: ["'self'", "wss:", "ws:"],
      }
    },
    xContentTypeOptions: true,      // X-Content-Type-Options: nosniff
    xFrameOptions: { action: "deny" }, // Clickjacking protection
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));

  // Apply general API rate limiter (300 requests per minute)
  app.use("/api", rateLimiter(60000, 300));
  
  // Apply stricter login/register rate limiters
  app.use("/api/auth/login", rateLimiter(60000, 15, "Zu viele Loginversuche. Bitte versuchen Sie es in einer Minute wieder."));
  app.use("/api/auth/register", rateLimiter(60000, 10, "Zu viele Registrierungsversuche. Bitte versuchen Sie es in einer Minute wieder."));

  // API - Auth Endpoints
  app.post("/api/auth/register", (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, E-Mail-Adresse und Passwort sind erforderlich." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein." });
    }

    const db = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return res.status(400).json({ error: "Ein Benutzer mit dieser E-Mail existiert bereits." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedPassword = hashPassword(password);
    const newUser: User = {
      id: "user-" + crypto.randomUUID(),
      email: normalizedEmail,
      name,
      phone: phone || "",
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      isAdmin: false,
      registeredAt: new Date().toISOString(),
      token,
      password: hashedPassword
    };

    db.users.push(newUser);
    writeDb(db);
    res.status(201).json(newUser);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-Mail-Adresse ist erforderlich." });
    }

    const db = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = db.users.findIndex(u => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      return res.status(401).json({ error: "E-Mail-Adresse oder Passwort falsch." });
    }

    const user = db.users[userIndex];

    if (user.password && password) {
      if (!verifyPassword(password, user.password)) {
        return res.status(401).json({ error: "E-Mail-Adresse oder Passwort falsch." });
      }
    } else if (user.password && !password) {
      return res.status(401).json({ error: "Passwort erforderlich." });
    }

    // Refresh token on login for better security
    const token = crypto.randomBytes(32).toString("hex");
    db.users[userIndex].token = token;
    writeDb(db);

    res.json(db.users[userIndex]);
  });

  app.put("/api/auth/profile", authenticateToken, (req, res) => {
    const { userId, name, phone, avatarUrl } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
    }

    // IDOR Check: Users can only update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "Sie können nur Ihr eigenes Profil bearbeiten." });
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Benutzer nicht gefunden." });
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      name: name || db.users[userIndex].name,
      phone: phone !== undefined ? phone : db.users[userIndex].phone,
      avatarUrl: avatarUrl || db.users[userIndex].avatarUrl
    };

    // Update names on their active listings
    db.listings = db.listings.map(l => {
      if (l.sellerId === userId) {
        return {
          ...l,
          sellerName: name || l.sellerName,
          sellerPhone: phone || l.sellerPhone
        };
      }
      return l;
    });

    writeDb(db);
    res.json(db.users[userIndex]);
  });

  // API - Listings Endpoints
  app.get("/api/listings", (req, res) => {
    const db = readDb();
    const { q, brand, minPrice, maxPrice, minYear, maxYear, maxMileage, status, sellerId } = req.query;

    let results = [...db.listings];

    // Search query
    if (q) {
      const query = (q as string).toLowerCase().trim();
      results = results.filter(l => 
        l.brand.toLowerCase().includes(query) || 
        l.model.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
      );
    }

    // Filter by brand
    if (brand && brand !== "Alle") {
      results = results.filter(l => l.brand.toLowerCase() === (brand as string).toLowerCase());
    }

    // Filter by Price range
    if (minPrice) {
      results = results.filter(l => l.price >= Number(minPrice));
    }
    if (maxPrice) {
      results = results.filter(l => l.price <= Number(maxPrice));
    }

    // Filter by Construction Year
    if (minYear) {
      results = results.filter(l => l.year >= Number(minYear));
    }
    if (maxYear) {
      results = results.filter(l => l.year <= Number(maxYear));
    }

    // Filter by Mileage
    if (maxMileage) {
      results = results.filter(l => l.mileage <= Number(maxMileage));
    }

    // Status filter - by default return 'active' for general public search, and include other checks
    if (status) {
      results = results.filter(l => l.status === status);
    }

    // Filter by Seller
    if (sellerId) {
      results = results.filter(l => l.sellerId === sellerId);
    }

    res.json(results);
  });

  app.get("/api/listings/:id", (req, res) => {
    const db = readDb();
    const listing = db.listings.find(l => l.id === req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }
    res.json(listing);
  });

  app.post("/api/listings", authenticateToken, (req, res) => {
    const { sellerId, brand, model, mileage, year, fuelType, transmission, price, description, images, location } = req.body;
    
    if (!sellerId || !brand || !model || !mileage || !year || !fuelType || !transmission || !price || !description) {
      return res.status(400).json({ error: "Alle Pflichtfelder müssen ausgefüllt sein." });
    }

    // Integrity Check: Make sure the seller ID matches the logged-in user
    if (req.user.id !== sellerId) {
      return res.status(403).json({ error: "Sie sind nicht berechtigt, ein Inserat für diesen Benutzer zu erstellen." });
    }

    const db = readDb();
    const user = db.users.find(u => u.id === sellerId);
    if (!user) {
      return res.status(404).json({ error: "Verkäufer-Profil nicht gefunden." });
    }

    // New listings created by normal users need approval. Admin listings are auto-approved.
    const isApproved = user.isAdmin === true ? true : false;

    const newListing: Listing = {
      id: "listing-" + crypto.randomUUID(),
      sellerId,
      sellerName: user.name,
      sellerPhone: user.phone,
      sellerLocation: location || "Deutschland",
      brand,
      model,
      mileage: Number(mileage),
      year: Number(year),
      fuelType,
      transmission,
      price: Number(price),
      description,
      images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200"],
      isApproved,
      status: "active",
      createdAt: new Date().toISOString()
    };

    db.listings.unshift(newListing);
    writeDb(db);
    res.status(201).json(newListing);
  });

  app.put("/api/listings/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { brand, model, mileage, year, fuelType, transmission, price, description, images, location } = req.body;

    const db = readDb();
    const index = db.listings.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }

    // Integrity Check: Only the listing owner or an administrator can edit vehicle listings
    const listing = db.listings[index];
    if (listing.sellerId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Zugriff verweigert. Sie können nur Ihre eigenen Inserate bearbeiten." });
    }

    db.listings[index] = {
      ...db.listings[index],
      brand: brand || db.listings[index].brand,
      model: model || db.listings[index].model,
      mileage: mileage !== undefined ? Number(mileage) : db.listings[index].mileage,
      year: year !== undefined ? Number(year) : db.listings[index].year,
      fuelType: fuelType || db.listings[index].fuelType,
      transmission: transmission || db.listings[index].transmission,
      price: price !== undefined ? Number(price) : db.listings[index].price,
      description: description || db.listings[index].description,
      images: images || db.listings[index].images,
      sellerLocation: location || db.listings[index].sellerLocation
    };

    writeDb(db);
    res.json(db.listings[index]);
  });

  app.delete("/api/listings/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.listings.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }

    // Integrity Check: Only the listing owner or an administrator can delete vehicle listings
    const listing = db.listings[index];
    if (listing.sellerId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Zugriff verweigert. Sie können nur Ihre eigenen Inserate löschen." });
    }

    db.listings.splice(index, 1);
    writeDb(db);
    res.json({ success: true, message: "Inserat erfolgreich gelöscht." });
  });

  app.patch("/api/listings/:id/status", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'sold' | 'inactive'

    if (!["active", "sold", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Ungültiger Status." });
    }

    const db = readDb();
    const index = db.listings.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }

    // Integrity Check: Only the listing owner or an administrator can change status
    const listing = db.listings[index];
    if (listing.sellerId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Zugriff verweigert. Sie können nur den Status Ihrer eigenen Inserate ändern." });
    }

    db.listings[index].status = status;
    writeDb(db);
    res.json(db.listings[index]);
  });

  // API - Chats & Messaging Endpoints
  app.get("/api/chats", authenticateToken, (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
    }

    // Confidentiality Check: Users can only retrieve their own chat inbox
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Zugriff verweigert. Sie können nur Ihre eigenen Chats abrufen." });
    }

    const db = readDb();
    // Find all chats where the user is either buyer or seller
    const userChats = db.chats.filter(c => c.buyerId === userId || c.sellerId === userId);
    res.json(userChats);
  });

  app.get("/api/chats/:id/messages", authenticateToken, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const chat = db.chats.find(c => c.id === id);
    if (!chat) {
      return res.status(404).json({ error: "Chat nicht gefunden." });
    }

    // Confidentiality Check: Only the chat participants (buyer/seller) or an admin can access messages
    if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Zugriff verweigert. Sie haben keinen Zugriff auf diesen Chat." });
    }

    const chatMessages = db.messages.filter(m => m.chatId === id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(chatMessages);
  });

  app.post("/api/chats/messages", authenticateToken, (req, res) => {
    const { senderId, senderName, receiverId, listingId, content } = req.body;

    if (!senderId || !receiverId || !listingId || !content) {
      return res.status(400).json({ error: "Ungültige Nachrichtendaten." });
    }

    // Integrity Check: Make sure the message sender matches the logged-in user
    if (req.user.id !== senderId) {
      return res.status(403).json({ error: "Zugriff verweigert. Ungültige Absender-ID." });
    }

    const db = readDb();
    const listing = db.listings.find(l => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }

    // Try finding existing chat for this listing and buyer
    // Note: senderId is buyer if launching from listings page, or seller if replying.
    // Let's identify who the buyer is: the person who doesn't own the listing.
    const buyerId = listing.sellerId === senderId ? receiverId : senderId;
    const sellerId = listing.sellerId;

    const buyerUser = db.users.find(u => u.id === buyerId);
    const buyerName = buyerUser ? buyerUser.name : "Käufer";

    let chat = db.chats.find(c => c.listingId === listingId && c.buyerId === buyerId);

    if (!chat) {
      chat = {
        id: "chat-" + crypto.randomUUID(),
        listingId,
        listingBrand: listing.brand,
        listingModel: listing.model,
        listingPrice: listing.price,
        listingImage: listing.images[0],
        buyerId,
        buyerName,
        sellerId,
        sellerName: listing.sellerName,
        lastMessageText: content,
        lastMessageTime: new Date().toISOString(),
        unreadCount: { [receiverId]: 1, [senderId]: 0 }
      };
      db.chats.unshift(chat);
    } else {
      chat.lastMessageText = content;
      chat.lastMessageTime = new Date().toISOString();
      if (!chat.unreadCount) chat.unreadCount = {};
      chat.unreadCount[receiverId] = (chat.unreadCount[receiverId] || 0) + 1;
      chat.unreadCount[senderId] = 0;

      // Bring chat to top of list
      const chatIndex = db.chats.findIndex(c => c.id === chat!.id);
      if (chatIndex > -1) {
        db.chats.splice(chatIndex, 1);
        db.chats.unshift(chat);
      }
    }

    const newMessage: Message = {
      id: "msg-" + crypto.randomUUID(),
      chatId: chat.id,
      senderId,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    db.messages.push(newMessage);
    writeDb(db);
    res.status(201).json({ message: newMessage, chat });
  });

  app.post("/api/chats/:id/read", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
    }

    // Integrity Check: Make sure the read request is for the logged-in user
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "Zugriff verweigert." });
    }

    const db = readDb();
    
    // Mark messages as read where sender is not current user
    db.messages = db.messages.map(m => {
      if (m.chatId === id && m.senderId !== userId) {
        return { ...m, isRead: true };
      }
      return m;
    });

    // Clear unread count for this user in chat
    const chatIndex = db.chats.findIndex(c => c.id === id);
    if (chatIndex > -1) {
      const chat = db.chats[chatIndex];
      if (chat.unreadCount) {
        chat.unreadCount[userId] = 0;
      }
    }

    writeDb(db);
    res.json({ success: true });
  });

  // API - Favorites Endpoints
  app.get("/api/favorites", authenticateToken, (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
    }

    // Confidentiality Check: Users can only access their own favorites
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Zugriff verweigert. Sie können nur Ihre eigenen Favoriten einsehen." });
    }

    const db = readDb();
    const userFavIds = db.favorites[userId as string] || [];
    const favoriteListings = db.listings.filter(l => userFavIds.includes(l.id));
    res.json(favoriteListings);
  });

  app.post("/api/favorites/toggle", authenticateToken, (req, res) => {
    const { userId, listingId } = req.body;
    if (!userId || !listingId) {
      return res.status(400).json({ error: "Benutzer-ID und Inserat-ID erforderlich." });
    }

    // Integrity Check: Users can only toggle favorites for themselves
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "Zugriff verweigert." });
    }

    const db = readDb();
    if (!db.favorites[userId]) {
      db.favorites[userId] = [];
    }

    const list = db.favorites[userId];
    const index = list.indexOf(listingId);
    let favorited = false;

    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(listingId);
      favorited = true;
    }

    writeDb(db);
    res.json({ favorited, list });
  });

  // API - Admin Endpoints
  app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    res.json(db.users);
  });

  app.post("/api/admin/listings/:id/approve", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.listings.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }

    db.listings[index].isApproved = true;
    writeDb(db);
    res.json(db.listings[index]);
  });

  app.get("/api/admin/stats", authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    
    // Group active user registrations by day for the chart
    // We can simulate registrations for past 5 days
    const registrationsByDay = [
      { day: "11.06.", count: 1 },
      { day: "12.06.", count: 1 },
      { day: "13.06.", count: 0 },
      { day: "14.06.", count: 0 },
      { day: "15.06.", count: 1 }
    ];

    // Calculate actual active stats
    const stats: AdminStats = {
      totalUsers: db.users.length,
      totalListings: db.listings.length,
      activeListings: db.listings.filter(l => l.status === "active").length,
      soldListings: db.listings.filter(l => l.status === "sold").length,
      pendingApproval: db.listings.filter(l => !l.isApproved).length,
      registrationsByDay
    };

    res.json(stats);
  });


  // API - Base health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development or fallback static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          protocol: "wss",
          host: "localhost",
          port: 3443
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // --- TLS / HTTPS Setup ---
  // Generate self-signed certificates for development
  const attrs = [{ name: "commonName", value: "localhost" }];
  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 365,
    algorithm: "sha256",
    extensions: [
      { name: "subjectAltName", altNames: [{ type: 2, value: "localhost" }] }
    ]
  });

  const HTTPS_PORT = 3443;
  const HTTP_PORT = 3000;

  // Create HTTPS server with the self-signed certificate
  const httpsServer = https.createServer(
    { key: pems.private, cert: pems.cert },
    app
  );

  httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
    console.log(`\n🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`);
    console.log(`   TLS/SSL enabled with self-signed certificate`);
    console.log(`   HSTS header active (max-age: 1 year)`);
  });

  // Create HTTP server that redirects all traffic to HTTPS
  const httpRedirectApp = express();
  httpRedirectApp.use((req, res) => {
    const httpsUrl = `https://${req.hostname}:${HTTPS_PORT}${req.url}`;
    res.redirect(301, httpsUrl);
  });

  http.createServer(httpRedirectApp).listen(HTTP_PORT, "0.0.0.0", () => {
    console.log(`🔀 HTTP redirect server on http://localhost:${HTTP_PORT} → https://localhost:${HTTPS_PORT}`);
  });
}

startServer();
