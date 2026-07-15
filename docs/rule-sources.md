# Regelquellen und Rangfolge

**Status:** MASSGEBLICH
**Stand:** 2026-07-14

Dieses Register legt fest, welche Dokumente fuer Regeln und bewusste digitale Anpassungen von Star Odyssey verbindlich sind. Planungs-, Architektur- und Audit-Dokumente sind nur dann normativ, wenn sie hier ausdruecklich genannt werden.

## Rangfolge

1. **Klassisches Spiel:** offizielle Spielanleitung von *CATAN - Sternenfahrer*.
2. **Praezisierung klassischer Regeln:** offizieller Almanach der ueberarbeiteten Ausgabe (2019). Bei Unklarheiten praezisiert der Almanach die Anleitung.
3. **Supernova:** die versionierten Star-Odyssey-Transkriptionen unter `docs/rules/supernova/`. Sie gelten ausschliesslich bei `gameVariant === "supernova"`.
4. **Encounter-Flows:** `docs/encounter-card-markdown/begegnungskarten_implementierungshinweise_codex.md`, danach die jeweilige Karte unter `docs/encounter-card-markdown/`.
5. **Bewusste digitale Anpassungen:** `docs/star-odyssey-rule-decisions.md`.

Bei einem nicht aufloesbaren Widerspruch darf keine neue Regel aus Planungsdokumenten oder bestehendem Code abgeleitet werden. Der Widerspruch muss dokumentiert und fachlich entschieden werden.

## Offizielle Classic-Quellen

Die offiziellen PDFs werden aus Lizenz- und Dateigroessengruenden nicht im Git-Repository gespeichert (`docs/*.pdf` ist ignoriert). Fuer einen lokalen Regelabgleich werden exakt diese Dateien unter `docs/` erwartet:

| Quelle | Lokaler Dateiname | SHA-256 der geprueften Referenz |
| --- | --- | --- |
| Offizielle Spielanleitung | `CATAN_Spielanleitung_Sternenfahrer.pdf` | `6BAAC937A6457089398BECDF285D82ADDA827F52DC626E8EC8BC63D5E4713A77` |
| Offizieller Almanach, ueberarbeitete Ausgabe 2019 | `CATAN_Almanach_Sternenfahrer.pdf` | `6BA1E4A7FC4B6EF225E4653B035EC6B281A8FFEA677828EB90C0518E840AC2DD` |

Die Hashes dienen nur dazu, dieselbe lokal gepruefte Ausgabe zu erkennen. Fehlen die PDFs, bleibt der Code ausfuehrbar; ein neuer vollstaendiger Classic-Regelaudit ist dann jedoch nicht moeglich.

## Versionierte Supernova-Quellen

| Quelle | Pfad | SHA-256 |
| --- | --- | --- |
| Regelwerk | `docs/rules/supernova/star_odyssey_supernova_regelwerk.md` | `40359EFE55AE46502FB6F803D788A2B7FD8B2453848945A4DBBC6D9278ECEB6A` |
| Missions- und Siegpunktkarten | `docs/rules/supernova/star_odyssey_supernova_missionskarten.md` | `256D2F5078BA05942FBB1EB79EF9D8166184161530DD0D752BE73D5922C883AC` |

Diese Dateien sind die am 2026-07-14 inhaltlich unveraendert ins Repository uebernommenen, vom Projektinhaber bereitgestellten Transkriptionen; vorhandene Zeilenende-Leerzeichen wurden fuer einen sauberen Repository-Check normalisiert. Hinweise auf unsichere Lesarten innerhalb der Transkriptionen bleiben als solche bestehen.

## Weitere Dokumentklassen

| Dokumente | Einordnung |
| --- | --- |
| `docs/game-reference.md` | Abgeleitete Kurzreferenz, nicht normativ; kann hinter den offiziellen Quellen zurueckliegen. |
| `docs/board-layout.md` | Technische Board-/Layoutbeschreibung, keine uebergeordnete Regelquelle. |
| `docs/final-polish-audit.md` | Befund- und Fortschrittsdokument, keine Regelquelle. |
| `docs/technical-guidelines.md`, `docs/project-guidelines.md` | Technische Arbeitsregeln. |
| `docs/vision.md`, `docs/ui-flow.md`, `docs/turn-structure.md`, `docs/implementation-roadmap.md`, `docs/assets-plan.md` | Historische Planungsdokumente. Sie beschreiben fruehe Zielbilder und duerfen nicht als aktueller Implementierungs- oder Regelstand gelesen werden. |

## Pflege

- Eine neue oder korrigierte Regelquelle muss mit Datum, Pfad und Rangfolge hier eingetragen werden.
- Geaenderte Transkriptionen erhalten einen neuen Hash und eine kurze Aenderungsnotiz.
- Historische Dokumente werden nicht stillschweigend wieder normativ.
- Implementierung und Tests duerfen eine fehlende fachliche Entscheidung nicht durch bestehendes Verhalten ersetzen.
