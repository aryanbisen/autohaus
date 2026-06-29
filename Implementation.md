## 1 Schutzziele (CIA) 

### Confidentiality

- Absicherung von /api/chats (nur eigener Posteingang lesbar).
- Absicherung von /api/chats/:id/messages (nur Beteiligte des Chats dürfen Nachrichten abrufen).
- Absicherung von /api/chats/:id/read und /api/chats/messages.

### Integritätsschutz 

- Absicherung von PUT /api/listings/:id und DELETE /api/listings/:id (Änderungen/Löschen nur durch den Eigentümer oder Admins gestattet).
- Absicherung von PATCH /api/listings/:id/status (nur für den Eigentümer).
- Absicherung der Admin-Endpunkte /api/admin/* durch requireAdmin Middleware (Zugriff verwehrt für normale User).

### Verfügbarkeitsschutz 

- Implementierung eines IP-basierten, in-memory Rate Limiters zur DoS-Prävention.
- Begrenzung von Login/Registrierungsversuchen auf max. 15 Anfragen pro Minute je IP-Adresse zur Verhinderung von Brute-Force-Angriffen.
- Begrenzung aller anderen API-Schnittstellen auf max. 200 Anfragen pro Minute je IP-Adresse.

## 2. Identitätsmanagement & Zugriffskontrolle

