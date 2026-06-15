import express from "express";
import path from "path";
import fs from "fs";
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
    registeredAt: "2026-06-10T10:00:00Z"
  },
  {
    id: "user-seller1",
    email: "max.mustermann@autohaus.de",
    name: "Max Mustermann",
    phone: "+49 171 9876543",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
    isAdmin: false,
    registeredAt: "2026-06-11T12:00:00Z"
  },
  {
    id: "user-seller2",
    email: "anna.schmidt@autohaus.de",
    name: "Anna Schmidt",
    phone: "+49 172 4455667",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    isAdmin: false,
    registeredAt: "2026-06-12T14:30:00Z"
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
    const db: Database = {
      users: defaultUsers,
      listings: defaultListings,
      chats: defaultChats,
      messages: defaultMessages,
      favorites: {
        "user-seller2": ["listing-1", "listing-2"]
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }
}

function readDb(): Database {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database file", error);
    return { users: [], listings: [], chats: [], messages: [], favorites: {} };
  }
}

function writeDb(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file", error);
  }
}

async function startServer() {
  initDb();
  const app = express();
  app.use(express.json({ limit: "20mb" }));

  // API - Auth Endpoints
  app.post("/api/auth/register", (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name und E-Mail-Adresse sind erforderlich." });
    }

    const db = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return res.status(400).json({ error: "Ein Benutzer mit dieser E-Mail existiert bereits." });
    }

    const newUser: User = {
      id: "user-" + Math.random().toString(36).substring(2, 11),
      email: normalizedEmail,
      name,
      phone: phone || "",
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      isAdmin: false,
      registeredAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);
    res.status(201).json(newUser);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-Mail-Adresse ist erforderlich." });
    }

    const db = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: "Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst." });
    }

    res.json(user);
  });

  app.put("/api/auth/profile", (req, res) => {
    const { userId, name, phone, avatarUrl } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
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

  app.post("/api/listings", (req, res) => {
    const { sellerId, brand, model, mileage, year, fuelType, transmission, price, description, images, location } = req.body;
    
    if (!sellerId || !brand || !model || !mileage || !year || !fuelType || !transmission || !price || !description) {
      return res.status(400).json({ error: "Alle Pflichtfelder müssen ausgefüllt sein." });
    }

    const db = readDb();
    const user = db.users.find(u => u.id === sellerId);
    if (!user) {
      return res.status(404).json({ error: "Verkäufer-Profil nicht gefunden." });
    }

    // New listings created by normal users need approval. Admin listings are auto-approved.
    const isApproved = user.isAdmin === true ? true : false;

    const newListing: Listing = {
      id: "listing-" + Math.random().toString(36).substring(2, 11),
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

  app.put("/api/listings/:id", (req, res) => {
    const { id } = req.params;
    const { brand, model, mileage, year, fuelType, transmission, price, description, images, location } = req.body;

    const db = readDb();
    const index = db.listings.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
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

  app.delete("/api/listings/:id", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.listings.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inserat nicht gefunden." });
    }

    db.listings.splice(index, 1);
    writeDb(db);
    res.json({ success: true, message: "Inserat erfolgreich gelöscht." });
  });

  app.patch("/api/listings/:id/status", (req, res) => {
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

    db.listings[index].status = status;
    writeDb(db);
    res.json(db.listings[index]);
  });

  // API - Chats & Messaging Endpoints
  app.get("/api/chats", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
    }

    const db = readDb();
    // Find all chats where the user is either buyer or seller
    const userChats = db.chats.filter(c => c.buyerId === userId || c.sellerId === userId);
    res.json(userChats);
  });

  app.get("/api/chats/:id/messages", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const chatMessages = db.messages.filter(m => m.chatId === id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(chatMessages);
  });

  app.post("/api/chats/messages", (req, res) => {
    const { senderId, senderName, receiverId, listingId, content } = req.body;

    if (!senderId || !receiverId || !listingId || !content) {
      return res.status(400).json({ error: "Ungültige Nachrichtendaten." });
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
        id: "chat-" + Math.random().toString(36).substring(2, 11),
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
      id: "msg-" + Math.random().toString(36).substring(2, 11),
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

  app.post("/api/chats/:id/read", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
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
  app.get("/api/favorites", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Benutzer-ID fehlt." });
    }

    const db = readDb();
    const userFavIds = db.favorites[userId as string] || [];
    const favoriteListings = db.listings.filter(l => userFavIds.includes(l.id));
    res.json(favoriteListings);
  });

  app.post("/api/favorites/toggle", (req, res) => {
    const { userId, listingId } = req.body;
    if (!userId || !listingId) {
      return res.status(400).json({ error: "Benutzer-ID und Inserat-ID erforderlich." });
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
  app.get("/api/admin/users", (req, res) => {
    const db = readDb();
    res.json(db.users);
  });

  app.post("/api/admin/listings/:id/approve", (req, res) => {
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

  app.get("/api/admin/stats", (req, res) => {
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
      server: { middlewareMode: true },
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

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
