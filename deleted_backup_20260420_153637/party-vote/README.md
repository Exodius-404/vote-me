# Party Vote — kleine Anleitung

Dieses kleine Web‑Frontend läuft lokal auf dem Handy/Brower und nutzt Firebase Firestore + Storage.

Setup:
- Öffne die Datei `app.js` und prüfe, ob `firebaseConfig` korrekt ist (dein Firebase-Projekt). Die Datei enthält bereits die Konfiguration.
- Optional: Passe `ADMIN_CODE` in `app.js` an (Standard: `partyadmin`).

Seiten:
- `index.html` — Login per Benutzername.
- `register.html` — Registrieren mit Benutzername + Foto (Kamera/Galerie).
- `gallery.html` — Alle Fotos ansehen und einmalig abstimmen.
- `admin.html` — Admin-Code eingeben und Ergebnisliste sehen.

Hinweise:
- Nutzername ist global eindeutig; doppelte Namen werden beim Registrieren abgelehnt.
- Stimmen sind für die Öffentlichkeit anonym; intern wird die `voterUsername` gespeichert, damit ein Nutzer nicht mehrfach abstimmen kann. Im Admin-View werden nur Zähler angezeigt.
