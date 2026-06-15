## Sicherheitsarchitektur 

### 1. Schutzbedarfsanalyse & Bedrohungsmodellierung (KN-01)
Zur Identifikation von Risiken wurde die **CIA-Triade** und das **STRIDE-Modell** angewendet:

*   **Schutzziele (CIA):**
    *   **Confidentiality (Vertraulichkeit):** Schutz privater Käuferdaten und Gebote vor unbefugtem Zugriff.
    *   **Integrity (Integrität):** Sicherstellung, dass Fahrzeugdaten (z. B. Kilometerstand, Preis) nicht durch Unbefugte manipuliert werden können.
    *   **Availability (Verfügbarkeit):** Schutz der Plattform gegen Denial-of-Service (DoS) Angriffe, um den Handel jederzeit zu ermöglichen.
*   **STRIDE-Analyse:**
    *   Prävention von *Spoofing* durch starke Authentifizierung.
    *   Verhinderung von *Tampering* durch serverseitige Validierung.
    *   Schutz vor *Information Disclosure* durch strikte Access Control.

### 2. Identitätsmanagement & Zugriffskontrolle (KN-02)
Der Fokus liegt hier auf der Vermeidung von **Broken Access Control (A01:2021)**:

*   **Authentisierung:** Implementierung eines sicheren Logins mit Passwort-Policies und Schutz gegen Brute-Force (Rate Limiting).
*   **Autorisierung (Broken Access Control):** 
    *   Verhinderung von **IDOR (Insecure Direct Object Reference)**: Jede Anfrage prüft, ob der `Session-User` berechtigt ist, die spezifische `Fahrzeug-ID` zu manipulieren.
    *   **Privilege Escalation:** Strikte Trennung zwischen User- und Admin-Rollen im Backend.
*   **Session Management:** Verwendung von kryptographisch sicheren Session-IDs, die via `HttpOnly`, `Secure` und `SameSite=Strict` Cookies übertragen werden.

### 3. Datensicherheit & Input-Validierung (KN-03)
Schutz der Anwendung vor Injektionsangriffen und clientseitigen Manipulationen:

*   **Injection (A03:2021):** Einsatz von **Parameterized Queries (Prepared Statements)** für alle Datenbankzugriffe, um SQL-Injection unmöglich zu machen.
*   **Cross-Site Scripting (XSS):** 
    *   **Input Sanitization:** Filterung aller Benutzereingaben (Fahrzeugbeschreibungen).
    *   **Output Encoding:** Automatisches Escaping durch das Frontend-Framework (React).
    *   **Content Security Policy (CSP):** Unterbindung von Inline-Skripten und nicht autorisierten Datenquellen.
*   **Safe File Upload:** Validierung von Bild-Uploads auf magische Zahlen (Magic Bytes) statt nur auf Dateiendungen.

### 4. Kryptographie & Transportsicherheit (KN-04)
Sicherstellung der Datenintegrität und Geheimhaltung auf dem Übertragungsweg und im Speicher:

*   **Transport Layer Security (TLS):** Erzwungene HTTPS-Verbindung mit **HSTS (HTTP Strict Transport Security)**, um Man-in-the-Middle-Angriffe zu verhindern.
*   **Hashing (At Rest):** Passwörter werden niemals im Klartext gespeichert, sondern mit dem modernen **Argon2id** oder **bcrypt** Algorithmus gehasht und gesalzen (Salted Hashing).
*   **Verschlüsselung sensibler Daten:** Symmetrische Verschlüsselung (AES-256) für besonders kritische Datenfelder in der Datenbank.
*   **Sichere Zufallszahlen:** Verwendung von kryptographisch sicheren Zufallszahlengeneratoren (CSPRNG) für Tokens und IDs.

---

## ✨ Features

### Für Käufer
*   **Manipulationssichere Suche:** Validierte Filter für Marken, Modelle und Preise.
*   **Integritätsprüfung:** Validierung der Preise beim Checkout, um clientseitige DOM-Manipulationen zu verhindern.

### Für Verkäufer
*   **Geschütztes Dashboard:** CRUD-Operationen für eigene Fahrzeuge unter strikter Zugriffskontrolle.
*   **Privatsphäre-Schutz:** Automatisierte Bereinigung hochgeladener Bilder zum Schutz des Standorts.

---

