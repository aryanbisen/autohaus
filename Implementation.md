# 1 Schutzziele (CIA)

![CIA-Ablauf](https://github.com/aryanbisen/autohaus/CIA.svg)

Dieses Dokument beschreibt die implementierten Sicherheitsmaßnahmen gemäß der CIA-Triade (Confidentiality, Integrity, Availability) in der Autohaus-Plattform.

---

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

