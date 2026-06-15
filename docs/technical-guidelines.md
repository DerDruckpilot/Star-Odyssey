# Technical Guidelines

Star Odyssey bleibt zuerst ein Browser-/Webprojekt. Kein Framework und kein Backend werden eingefuehrt, solange Vanilla JavaScript und eine statische Web-App ausreichen.

## Architektur

Die spaetere Codebasis soll klar getrennt werden:

- Game State: Spieler, Ressourcen, Punkte, Boardzustand, aktive Phase.
- Rendering: Canvas- oder DOM-Ausgabe des Bretts und der Assets.
- Input: Maus, Touch, Tastatur und spaeter Controllergeraete.
- UI: Menues, Buttons, Panels, Sprache, Statusanzeigen.
- Daten: Boarddefinition, Kosten, Regeln, Events und Assetlisten.
- Assets: PNGs, Icons, Animationen und Exportpipeline.

## Datengetriebene Regeln

- Regelwerte nicht hart im Code verteilen.
- Baukosten, Ressourcentypen, Planetentypen und Siegpunktwerte zentral definieren.
- Boardkoordinaten, Raumpunkte und Verbindungen als Daten modellieren.
- Ereignisse und Begegnungen spaeter als Datenobjekte statt als verstreute Sonderfaelle planen.

## Projektregeln

- Browser/Webprojekt zuerst.
- Vor Aenderungen `git status` pruefen.
- Vorhandene Struktur respektieren.
- Kleine, nachvollziehbare Aenderungen bevorzugen.
- Nach Codeaenderungen Tests ausfuehren.
- npm-Scripts nutzen.
- Keine Zugangsdaten oder privaten Daten ins Repo schreiben.
- Keine anderen Projektordner aendern.

## Tests

Die ersten Tests duerfen einfach bleiben, sollen aber die Grundstruktur schuetzen. Mit wachsender Spiellogik sollen gezielte Tests fuer State Machine, Regelberechnung und Datenvalidierung entstehen.
