# 1 Schutzziele (CIA)

![CIA-Ablauf](CIA.svg)

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


### Integritätsschutz 

- Absicherung von PUT /api/listings/:id und DELETE /api/listings/:id (Änderungen/Löschen nur durch den Eigentümer oder Admins gestattet).
- Absicherung von PATCH /api/listings/:id/status (nur für den Eigentümer).
- Absicherung der Admin-Endpunkte /api/admin/* durch requireAdmin Middleware (Zugriff verwehrt für normale User).

### Verfügbarkeitsschutz 

- Implementierung eines IP-basierten, in-memory Rate Limiters zur DoS-Prävention.
- Begrenzung von Login/Registrierungsversuchen auf max. 15 Anfragen pro Minute je IP-Adresse zur Verhinderung von Brute-Force-Angriffen.
- Begrenzung aller anderen API-Schnittstellen auf max. 200 Anfragen pro Minute je IP-Adresse.

## 2. Identitätsmanagement & Zugriffskontrolle

