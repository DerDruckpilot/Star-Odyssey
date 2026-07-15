# UI Flow

> **Status: HISTORISCH / NICHT NORMATIV (2026-07-14).** Dieses Dokument beschreibt den ersten Prototyp. Der aktuelle Regel- und Dokumentstatus steht in [Regelquellen und Rangfolge](rule-sources.md).

Der erste nutzbare Prototyp soll mit einem klaren Hauptmenue beginnen. Die eigentliche Second-Screen-Technik kommt spaeter, aber der UI-Fluss soll bereits darauf vorbereitet sein.

## Hauptmenue

- Schriftzug: Star Odyssey.
- Button: Neues Spiel.
- Button: Spiel laden.
- Sprachumschalter: Deutsch / Englisch.
- Kein eigenes Einstellungsmenue in der ersten Version.

## Neues Spiel

Nach Klick auf Neues Spiel:

- Spieleranzahl auswaehlen.
- Spielerfarben oder Spielerplaetze vorbereiten.
- Pro Spieler einen QR-Code-Platzhalter anzeigen.
- Hinweis, dass Controllerverbindung spaeter technisch umgesetzt wird.
- Button: Spiel jetzt starten.

## Spielstart

Nach Spiel jetzt starten:

- Boardansicht in Landscape Orientation anzeigen.
- Startbereich liegt links.
- Das Brett ist vollstaendig sichtbar.
- Der aktive Spieler und die aktuelle Phase sind klar erkennbar.
- PC-Browser-Prototyp nutzt zunaechst Maus-/Click-Interaktion.

## Desktop-Prototyp

Im PC-Browser darf die erste Version alle relevanten Aktionen direkt im Hauptfenster anbieten:

- Buttons fuer Phasenwechsel.
- Klickbare Raumpunkte und Bauplaetze.
- Kleine Statusbereiche fuer aktiven Spieler, Ressourcen und Bewegungspunkte.
- Keine fertige QR-/Controllerlogik in diesem PR.

## Spaetere Second-Screen-Version

- Hauptdisplay zeigt das Brett und oeffentliche Spielinformationen.
- Controllergeraete zeigen spielerspezifische Handkarten, Bauoptionen, Handelsaktionen und Bestaetigungen.
- QR-Codes verbinden spaeter Spielercontroller mit einer Session.
- Bewegung bleibt diskret: Zielpunkt auswaehlen, Schritt bestaetigen, verbleibende Bewegung anzeigen.

## Spiel laden

Spiel laden bleibt im ersten Menue sichtbar, wird aber erst mit Save/Load umgesetzt. Bis dahin kann der Button deaktiviert oder als Platzhalter gefuehrt werden.
