Das Ziel dieses Projekts ist es, einen funktionalen Marktplatz zu schaffen, der als Referenzimplementierung für moderne Web-Sicherheitskonzepte dient. Jeder Feature-Satz wurde unter Berücksichtigung der CIA-Triade (Vertraulichkeit, Integrität, Verfügbarkeit) entwickelt.

Robust Access Control (OWASP #1)
Identitätsbasierte Autorisierung: Schutz gegen IDOR (Insecure Direct Object Reference). Nutzer können nur Inserate bearbeiten oder löschen, die explizit mit ihrer User-ID verknüpft sind.
Role-Based Access Control (RBAC): Strikte Trennung zwischen Standard-Benutzern und Administratoren.
Session Management: Implementierung von sicheren, HTTP-only und SameSite-Cookies zur Abwehr von Session-Hijacking.
2. Defense in Depth (Mehrschichtige Verteidigung)
Eingabe-Validierung & Sanitisierung: Umfassender Schutz gegen SQL-Injection und XSS durch den Einsatz von Prepared Statements und Bibliotheken wie dompurify.
Secure File Uploads: Bilder von Fahrzeugen werden auf Dateityp (Magic Bytes), Größe und Schadsoftware geprüft. Metadaten (EXIF/GPS) werden automatisch entfernt, um die Privatsphäre der Verkäufer zu schützen.
3. Kryptographische Sicherheit
Password Hashing: Verwendung von Argon2id oder bcrypt mit hohem Work-Factor.
Encryption in Transit: Erzwungenes TLS/SSL über die gesamte Plattform.
Sensible Daten: Verschlüsselung von Kontaktinformationen in der Datenbank (Encryption at Rest).
4. Infrastruktur & Monitoring
Security Headers: Implementierung von Content Security Policy (CSP), HSTS, X-Content-Type-Options und Frame-Options (Helmet.js).
Rate Limiting: Schutz gegen Brute-Force-Angriffe auf Login-Endpunkte und API-Scraping.
Audit Logging: Protokollierung aller sicherheitsrelevanten Ereignisse (Logins, Passwortänderungen, gelöschte Inserate).
