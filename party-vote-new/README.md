# Party Vote — Schnelleinrichtung

Dieses Projekt ist eine einfache, lokale Web‑App zum Abstimmen (Outfit‑Contest) für Partys.

Dateien
- `index.html` — Login per Benutzername
- `register.html` — Registrieren mit Benutzername + Foto
- `gallery.html` — Voting UI
- `admin.html` — Admin Dashboard (Code geschützt)
- `app.js` — Zentrale Firebase‑Logik
- `style.css` — Styles

Setup
1. Öffne `app.js` und ersetze ggf. `firebaseConfig` durch dein Firebase‑Projekt.
2. Aktiviere in Firebase: Firestore (im Testmodus zum Entwickeln) und Storage.
3. Öffne die `index.html` lokal oder deploye die Ordnerinhalte zu einem statischen Host.

Testen (lokal)
1. Öffne `index.html` in deinem Handy‑Browser (oder Desktop).
2. Registriere ein paar Benutzer über `register.html` (Wähle Kamera/Galerie).
3. Melde dich mit einem anderen Namen an und wähle ein Foto aus, dann 'Stimme abgeben'.
4. Öffne `admin.html`, gib den Admin‑Code `partyadmin` ein und sieh dir die Ergebnisse an.

Sicherheit
- Diese Minimal‑Implementierung ist für den Partygebrauch gedacht. Für öffentliche Anwendungen solltest du Firebase Auth verwenden und Firestore‑Rules/Storage‑Rules setzen.
