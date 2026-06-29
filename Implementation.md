# 1 Schutzziele (CIA)

---

Dieses Dokument beschreibt die implementierten Sicherheitsmaßnahmen gemäß der CIA-Triade (Confidentiality, Integrity, Availability) in der Autohaus-Plattform.

---

## CIA-Flow-Diagram

![CIA-Ablauf](Implementation.svg)

---

## 1. Confidentiality (Vertraulichkeit)

### Was wurde implementiert?

**Token-basierte Authentifizierung** – Schutz privater Käuferdaten und Kommunikation vor unbefugtem Zugriff.

#### a) Token-Generierung bei Login & Registrierung
Bei jeder Anmeldung wird via `crypto.randomBytes(32)` ein neues kryptographisches Token erzeugt und in der Datenbank gespeichert:

```typescript
// server.ts – POST /api/auth/login
const token = crypto.randomBytes(32).toString("hex");
db.users[userIndex].token = token;
writeDb(db);
res.json(db.users[userIndex]);
```

> [!NOTE]
> Das Token wird bei jedem Login rotiert (erneuert). Das schützt gegen **Session-Hijacking** – selbst wenn ein altes Token abgefangen wird, ist es nach dem nächsten Login ungültig.

#### b) Automatische Token-Übermittlung im Frontend
In [main.tsx](file:///c:/Users/Aryan/Downloads/autohaus/src/main.tsx#L6-L26) wird `window.fetch` global überschrieben, damit jede API-Anfrage automatisch den `Authorization: Bearer <token>`-Header mitsendet:

```typescript
// main.tsx – Global Fetch Interceptor
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const savedUser = localStorage.getItem("autohaus_current_user");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user?.token) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      headers.set("Authorization", `Bearer ${user.token}`);
      init.headers = headers;
    }
  }
  return originalFetch(input, init);
};
```

**Warum nützlich?** Ohne diesen Interceptor müsste jeder einzelne `fetch()`-Aufruf im gesamten Frontend manuell das Token übergeben. Der Interceptor zentralisiert die Authentifizierung und verhindert, dass versehentlich ein API-Aufruf ohne Authentifizierung abgesetzt wird.

#### c) Serverseitige Token-Validierung
Die Middleware [authenticateToken](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L344-L361) extrahiert und validiert das Token bei jedem geschützten API-Aufruf:

```typescript
// server.ts – authenticateToken Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich." });

  const db = readDb();
  const user = db.users.find(u => u.token === token);
  if (!user) return res.status(401).json({ error: "Ungültiges Sitzungstoken." });

  req.user = user;  // Benutzer wird für nachfolgende Handler verfügbar gemacht
  next();
}
```

**Warum nützlich?** Der Server vertraut nicht dem Client-Input (wie `userId` im Body), sondern identifiziert den Benutzer ausschließlich über das kryptographische Token. Dadurch kann kein Angreifer durch Manipulation der Anfrage eine andere Identität vortäuschen.

#### d) IDOR-Schutz auf Chat-Endpunkten
Geschützte Routen wie `GET /api/chats` und `GET /api/chats/:id/messages` prüfen, ob der authentifizierte Benutzer tatsächlich Teilnehmer des Chats ist:

```typescript
// server.ts – GET /api/chats/:id/messages
if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id && !req.user.isAdmin) {
  return res.status(403).json({ error: "Zugriff verweigert." });
}
```

**Warum nützlich?** Ohne diese Prüfung könnte jeder eingeloggte Benutzer durch Erraten oder Durchprobieren von Chat-IDs die Nachrichten anderer Benutzer mitlesen (**Insecure Direct Object Reference / IDOR**).

---

## 2. Integrity (Integrität)

### Was wurde implementiert?

**Eigentümer- und Rollenbasierte Zugriffskontrolle** – Sicherstellung, dass Fahrzeugdaten nur von autorisierten Personen manipuliert werden können.

#### a) Eigentümerprüfung bei Inserat-Bearbeitung
Jeder schreibende Zugriff auf Inserate (`PUT`, `DELETE`, `PATCH /status`) prüft, ob der anfragende Benutzer der Eigentümer ist oder Admin-Rechte besitzt:

```typescript
// server.ts – PUT /api/listings/:id 
const listing = db.listings[index];
if (listing.sellerId !== req.user.id && !req.user.isAdmin) {
  return res.status(403).json({
    error: "Zugriff verweigert. Sie können nur Ihre eigenen Inserate bearbeiten."
  });
}
```

Dieselbe Prüfung gilt für:
- `DELETE /api/listings/:id` – Löschen von Inseraten
- `PATCH /api/listings/:id/status` – Statusänderung (aktiv/verkauft/inaktiv)
- `POST /api/listings` – Inserat erstellen (Seller-ID muss mit Login übereinstimmen)

**Warum nützlich?** Ohne diese Prüfung könnte ein Angreifer eine HTTP-Anfrage direkt an den Server senden und z.B. den Kilometerstand eines fremden Fahrzeugs von 150.000 km auf 50.000 km reduzieren oder den Preis manipulieren. Die Integritätsprüfung verhindert das.

#### b) Admin-Rollentrennung
Die `requireAdmin`-Middleware schützt alle administrativen Endpunkte:

```typescript
// server.ts – requireAdmin Middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: "Zugriff verweigert. Administratorrechte erforderlich."
    });
  }
  next();
}
```

Angewendet auf:
- `GET /api/admin/users` – Benutzerliste
- `POST /api/admin/listings/:id/approve` – Inserat-Freigabe
- `GET /api/admin/stats` – Dashboard-Statistiken

**Warum nützlich?** Vorher konnte jeder Browser-Benutzer die Admin-API direkt aufrufen und z.B. Inserate freigeben oder alle Nutzerdaten einsehen. Jetzt wird serverseitig geprüft, ob der Token einem Admin gehört (**Privilege Escalation Prevention**).

#### c) Profil-Selbstschutz (IDOR-Prüfung)
```typescript
// server.ts – PUT /api/auth/profile
if (req.user.id !== userId) {
  return res.status(403).json({ error: "Sie können nur Ihr eigenes Profil bearbeiten." });
}
```

---


## 3. Availability (Verfügbarkeit)

### Was wurde implementiert?

**IP-basiertes Rate Limiting** – Schutz gegen DoS-Angriffe und Brute-Force-Login-Versuche.

#### a) Rate Limiter Implementierung
Ein In-Memory Rate Limiter in [server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L311-L343) verfolgt Anfragen pro IP-Adresse innerhalb eines Zeitfensters:

```typescript
// server.ts – Rate Limiter 
function rateLimiter(windowMs, maxRequests, message) {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();

    let record = rateLimits.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
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
```

#### b) Anwendung der Rate Limiter
Drei Stufen von Rate Limiting:

```typescript
// server.ts – startServer
// 1. Allgemeines API-Limit: 300 Anfragen/Minute pro IP
app.use("/api", rateLimiter(60000, 300));

// 2. Strenges Login-Limit: 15 Versuche/Minute (Brute-Force-Schutz)
app.use("/api/auth/login", rateLimiter(60000, 15, "Zu viele Loginversuche..."));

// 3. Strenges Registrierungslimit: 10 Versuche/Minute
app.use("/api/auth/register", rateLimiter(60000, 10, "Zu viele Registrierungsversuche..."));
```

**Warum nützlich?**
- Das **allgemeine API-Limit** (300/min) schützt gegen automatisierte Bots und einfache DoS-Angriffe, die den Server durch massenhafte Anfragen überlasten könnten.
- Das **Login-Limit** (15/min) verhindert **Brute-Force-Angriffe**, bei denen ein Angreifer automatisiert tausende E-Mail-Adressen durchprobiert.
- Das **Registrierungslimit** (10/min) verhindert die massenhafte Erstellung von Spam-Konten.
- Der `Retry-After`-Header informiert den Client gemäß RFC-Standard, wann er es erneut versuchen darf.

---

# Kryptographie & Transportsicherheit

### 4. Transport Layer Security (TLS) mit HTTPS & HSTS

#### Was wurde implementiert?
Der Express-Server läuft jetzt über **HTTPS** (Port 3443) mit einem selbst-signierten TLS-Zertifikat. HTTP-Anfragen auf Port 3000 werden automatisch auf HTTPS umgeleitet.

##### a) Selbst-signierte Zertifikate ([server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L1082-L1092))
```typescript
// server.ts – TLS/HTTPS Setup
const attrs = [{ name: "commonName", value: "localhost" }];
const pems = selfsigned.generate(attrs, {
  keySize: 2048,
  days: 365,
  algorithm: "sha256",
  extensions: [
    { name: "subjectAltName", altNames: [{ type: 2, value: "localhost" }] }
  ]
});
```

##### b) HTTPS-Server ([server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L1097-L1103))
```typescript
const httpsServer = https.createServer(
  { key: pems.private, cert: pems.cert },
  app
);
httpsServer.listen(3443, "0.0.0.0", () => {
  console.log("🔒 HTTPS server running on https://localhost:3443");
});
```

##### c) HTTP→HTTPS Redirect ([server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L1107-L1114))
```typescript
const httpRedirectApp = express();
httpRedirectApp.use((req, res) => {
  const httpsUrl = `https://${req.hostname}:${HTTPS_PORT}${req.url}`;
  res.redirect(301, httpsUrl);
});
http.createServer(httpRedirectApp).listen(3000);
```

##### d) HSTS & Security Headers via Helmet ([server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L500-L521))
```typescript
app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000,       // 1 Jahr
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: { ... },
  xContentTypeOptions: true,       // X-Content-Type-Options: nosniff
  xFrameOptions: { action: "deny" }, // Clickjacking-Schutz
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

#### Warum nützlich?
- **TLS** verschlüsselt die gesamte Kommunikation zwischen Browser und Server. Ohne TLS könnten Angreifer im gleichen Netzwerk (z.B. öffentliches WLAN) Passwörter, Tokens und Nachrichten mitlesen (**Man-in-the-Middle-Angriff**).
- **HSTS** weist den Browser an, für 1 Jahr nur noch HTTPS-Verbindungen zu akzeptieren – selbst wenn der Benutzer `http://` eingibt.
- **CSP** (Content Security Policy) verhindert Cross-Site-Scripting (XSS) durch Einschränkung erlaubter Skript-Quellen.

---

### 5. Hashing (At Rest) – Passwort-Schutz mit Scrypt

#### Was wurde implementiert?
Passwörter werden **niemals im Klartext** gespeichert, sondern mit dem speicherintensiven **scrypt**-Algorithmus gehasht und gesalzen.

#### ([server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L422-L433))

```typescript
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex"); // 16 Byte Zufalls-Salt
  const hash = crypto.scryptSync(password, salt, 64).toString("hex"); // 64 Byte Hash
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedValue: string): boolean {
  const [salt, hash] = storedValue.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === testHash;
}
```

#### Warum nützlich?
- **Salted Hashing** bedeutet: Selbst wenn zwei Benutzer dasselbe Passwort wählen, sind ihre gespeicherten Hashes unterschiedlich (wegen des zufälligen Salts).
- **Scrypt** ist ein **speicherintensiver** (memory-hard) Algorithmus. Das macht Brute-Force-Angriffe mit GPUs oder ASICs extrem teuer, da jeder Hash-Versuch viel RAM benötigt.
- Wenn die Datenbank kompromittiert wird, kann ein Angreifer die Passwörter **nicht direkt lesen** – er müsste jeden Hash einzeln knacken.

---

### 6. Verschlüsselung sensibler Daten – AES-256-CBC

#### Was wurde implementiert?
Sensible Datenfelder werden mit **AES-256-CBC** symmetrischer Verschlüsselung vor dem Speichern in die Datenbank verschlüsselt und beim Lesen transparent entschlüsselt.

#### Wo im Code? ([server.ts](file:///c:/Users/Aryan/Downloads/autohaus/server.ts#L391-L419))

```typescript
const ENCRYPTION_KEY = crypto.scryptSync("autohaus-secure-key-12345", "autohaus-salt", 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16); // Zufälliger Initialisierungsvektor
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(textParts.join(":"), "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

#### Verschlüsselte Felder:
| Feld | Ort |
|---|---|
| `phone` | Benutzer-Telefonnummer |
| `sellerPhone` | Verkäufer-Telefonnummer in Inseraten |
| `content` | Nachrichteninhalt in Chats |

#### Transparente Ver-/Entschlüsselung:
```typescript
// writeDb() – Verschlüsselt sensible Felder vor dem Schreiben auf Disk
encryptedDb.users = encryptedDb.users.map(u => ({
  ...u,
  phone: u.phone ? encrypt(u.phone) : u.phone
}));

// readDb() – Entschlüsselt sensible Felder beim Laden in den Speicher
db.users = db.users.map(u => ({
  ...u,
  phone: u.phone ? decrypt(u.phone) : u.phone
}));
```

#### Warum nützlich?
- Selbst wenn ein Angreifer direkten Zugriff auf die Datenbankdatei (`data/db.json`) erhält, sind Telefonnummern und private Nachrichten **unlesbar** – sie erscheinen als kryptischer Hex-String.
- **Zufälliger IV** (Initialisierungsvektor): Jede Verschlüsselung desselben Textes erzeugt ein anderes Ergebnis. Das verhindert **Known-Plaintext-Angriffe**.

---

