## Sicherheitsarchitektur 

### 1. Schutzbedarfsanalyse & Bedrohungsmodellierung 
Zur Identifikation von Risiken wurde die **CIA-Triade** angewendet:

*   **Schutzziele (CIA):**
    *   **Confidentiality (Vertraulichkeit):** Schutz privater Käuferdaten und Gebote vor unbefugtem Zugriff.
    *   **Integrity (Integrität):** Sicherstellung, dass Fahrzeugdaten (z. B. Kilometerstand, Preis) nicht durch Unbefugte manipuliert werden können.
    *   **Availability (Verfügbarkeit):** Schutz der Plattform gegen Denial-of-Service (DoS) Angriffe, um den Handel jederzeit zu ermöglichen.

### 2. Identitätsmanagement & Zugriffskontrolle 
Der Fokus liegt hier auf der Vermeidung von **Broken Access Control (A01:2021)**:

*   **Authentisierung:** Implementierung eines sicheren Logins mit Passwort-Policies und Schutz gegen Brute-Force (Rate Limiting).
*   **Autorisierung (Broken Access Control):** 
    *   Verhinderung von **IDOR (Insecure Direct Object Reference)**: Jede Anfrage prüft, ob der `Session-User` berechtigt ist, die spezifische `Fahrzeug-ID` zu manipulieren.
    *   **Privilege Escalation:** Strikte Trennung zwischen User- und Admin-Rollen im Backend.
*   **Session Management:** Verwendung von kryptographisch sicheren Session-IDs, die via `HttpOnly`, `Secure` und `SameSite=Strict` Cookies übertragen werden.

### 3. Datensicherheit & Input-Validierung
Schutz der Anwendung vor Injektionsangriffen und clientseitigen Manipulationen:

*   **Injection (A03:2021):** Einsatz von **Parameterized Queries (Prepared Statements)** für alle Datenbankzugriffe, um SQL-Injection unmöglich zu machen.
*   **Cross-Site Scripting (XSS):** 
    *   **Input Sanitization:** Filterung aller Benutzereingaben (Fahrzeugbeschreibungen).
    *   **Output Encoding:** Automatisches Escaping durch das Frontend-Framework (React).
    *   **Content Security Policy (CSP):** Unterbindung von Inline-Skripten und nicht autorisierten Datenquellen.
*   **Safe File Upload:** Validierung von Bild-Uploads auf magische Zahlen (Magic Bytes) statt nur auf Dateiendungen.

### 4. Kryptographie & Transportsicherheit
Sicherstellung der Datenintegrität und Geheimhaltung auf dem Übertragungsweg und im Speicher:

*   **Transport Layer Security (TLS):** Erzwungene HTTPS-Verbindung mit **HSTS (HTTP Strict Transport Security)**, um Man-in-the-Middle-Angriffe zu verhindern.
*   **Hashing (At Rest):** Passwörter werden niemals im Klartext gespeichert, sondern mit dem modernen **Argon2id** oder **bcrypt** Algorithmus gehasht und gesalzen (Salted Hashing).
*   **Verschlüsselung sensibler Daten:** Symmetrische Verschlüsselung (AES-256) für besonders kritische Datenfelder in der Datenbank.
*   **Sichere Zufallszahlen:** Verwendung von kryptographisch sicheren Zufallszahlengeneratoren (CSPRNG) für Tokens und IDs.

---

# Funktionale Anforderungen

## 1. Benutzerverwaltung (User Management)

*   **Registrierung:** Neuregistrierung von Benutzern mittels E-Mail-Adresse und Name.
*   **Login/Logout:** Anmeldung und Abmeldung vom System.
*   **Profilverwaltung:** 
    *   Bearbeiten der persönlichen Daten (Name, Telefonnummer).
    *   Hochladen eines Profilbildes.
    *   Anzeige der eigenen Aktivitäten (z. B. Anzahl aktiver Inserate).

---

## 2. Inserat-Management (Selling)

*   **Inserat erstellen:**
    *   Eingabe von Fahrzeugdaten: Marke, Modell, Kilometerstand, Baujahr, Kraftstofftyp, Getriebe und Preis.
    *   Hinzufügen einer detaillierten Fahrzeugbeschreibung.
*   **Bilder-Upload:** Hochladen und Verwalten von mehreren Fotos pro Fahrzeug.
*   **Inserate verwalten:**
    *   Übersicht über alle eigenen aktiven und inaktiven Inserate.
    *   Bearbeiten von bestehenden Inseraten (z. B. Preisänderung).
    *   Löschen von Inseraten.
    *   Status-Update: Inserat als "Verkauft" markieren.

---

## 3. Fahrzeugsuche & Ansicht (Buying)

*   **Suchfunktion:** Freitextsuche nach Marke oder Modell.
*   **Filter-Optionen:**
    *   Filtern nach Preisbereich (Min/Max).
    *   Filtern nach Baujahr und Kilometerstand.
    *   Sortierung der Ergebnisse (z. B. "Neueste zuerst", "Günstigste zuerst").
*   **Fahrzeug-Detailseite:**
    *   Anzeige aller technischen Daten und der Beschreibung.
    *   Bilder-Galerie mit Vollbild-Ansicht.
    *   Anzeige des Verkäufernamens und Standorts.

---

## 4. Interaktion & Kommunikation

*   **Kontakt-Funktion:** Schaltfläche zur direkten Kontaktaufnahme mit dem Verkäufer.
*   **Internes Nachrichtensystem:**
    *   Echtzeit-Chat oder Nachrichten-Postfach zwischen Käufer und Verkäufer.
    *   Benachrichtigung bei neuen Nachrichten.
*   **Favoriten/Merkliste:** Speichern von interessanten Fahrzeugen in einer persönlichen Merkliste für den späteren Abruf.

---

## 5. Administration (Backend-Funktionen)

*   **Benutzer-Management:** Übersicht über alle registrierten Benutzer im System.
*   **Inserat-Moderation:** 
    *   Prüfung und Freigabe von Inseraten.
    *   Löschung von Inseraten, die gegen Richtlinien verstoßen.
*   **Dashboard-Statistiken:** Anzeige von Kennzahlen wie "Anzahl aktiver Inserate" oder "Neuregistrierungen pro Tag".


---

## Technologie-Stack

* **Frontend:** React / Next.js 
* **Backend:** Node.js (mit Express.js)
* **Datenbank:** MongoDB (NoSQL)
