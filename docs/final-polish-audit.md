# Star Odyssey: Final-Polish-Audit

Audit-Stand: 14.07.2026

Gepruefte Revision: `d2c68e2` auf `main`

Zweck: belastbare Abschluss-Checkliste; dieser Audit nimmt keine Produktionsaenderungen vor.

## 1. Executive Summary

Star Odyssey besitzt einen umfangreichen, lauffaehigen Classic-Kern, 32 datengetriebene Begegnungen, Controller-/Host-Trennung, Save/Load, die Supernova-Datenbestaende sowie eine weitgehend einheitliche TV- und Controller-Oberflaeche. Die vorhandenen Syntax-, Struktur-, Unit-/Smoke- und Chromium-E2E-Checks laufen gruen. Ein frisches Spiel laesst sich im Browser vom Hauptmenue bis zum Spielbrett starten; Hauptmenue, Setup, QR-Lobby und Controller laden ohne beobachtete Konsolen- oder Assetfehler.

Der Stand ist trotzdem **nicht final polished**:

- **Classic ist nicht vollstaendig regelkonform.** Der nicht dokumentierte 2-Spieler-Modus, fehlende neutrale Bauteile/Sondergrenzen im 3-Spieler-Spiel und die zu frueh endende Nachschub-Nachholfrist weichen von Anleitung bzw. Almanach ab.
- **Eine vollstaendige Partie ist nicht in allen Zustaenden verlaesslich abschliessbar.** Eine Begegnungsbelohnung kann ohne Fortsetzungspfad haengen bleiben, wenn alle echten Mutterschiff-Ausbaugrenzen erreicht sind (`ENC-001`, P0).
- **Supernova ist nicht vollstaendig regelkonform spielbar.** 13 von 25 Missionen sind nicht automatisch regelgeprueft; Fabrikbestand und Brettdarstellung sind unvollstaendig; Schlachtschiffkaempfe werden automatisch und teilweise mit falschen Folgen ausgewertet.
- **Private Informationen sind technisch nicht privat.** Der Host verteilt den vollstaendigen Spielerzustand inklusive Ressourcen und Missionen an jeden Controller (`SN-002`).
- **Das visuelle Niveau ist bei 1920 x 1080 bereits zusammenhaengend, aber nicht ueber alle Zielgeraete fertig.** Die 4K-Hauptmenue-Komposition bleibt wegen fester Obergrenzen zu klein; Controller-Panels verdecken den Space-Hintergrund weitgehend.
- **Deployment und reale Hardware bleiben Risikobereiche.** Der Service Worker nutzt einen unveraenderten Cache-Namen und cache-first fuer Assets; die LAN-Auslieferung erfolgt ueber HTTP; echte Fire-TV-, PWA- und Langzeit-Performance wurden nicht vollstaendig auf Hardware verifiziert.

### Befundzahlen

| Prioritaet | Anzahl |
|---|---:|
| P0 - Blocker | 1 |
| P1 - Kritisch | 11 |
| P2 - Wichtig | 12 |
| P3 - Polish | 4 |
| P4 - Optional | 3 |
| **Gesamt** | **31** |

| Status | Anzahl |
|---|---:|
| FEHLERHAFT | 4 |
| REGELABWEICHUNG | 6 |
| TEILWEISE UMGESETZT | 5 |
| TECHNISCH RISKANT | 10 |
| VISUELL VERBESSERUNGSWÜRDIG | 4 |
| FEHLT | 2 |
| **Gesamt** | **31** |

### Groesste Risiken

1. `ENC-001`: Eine Ausbau-Belohnung ohne waehbare Ausbauart erzeugt einen Encounter-Softlock.
2. `SN-004` / `SN-005`: Schlachtschiffkaempfe laufen ohne erforderliche Spielerinteraktion und mit teilweise falschen Folgen ab.
3. `SN-002`: Missionen und Ressourcen aller Spieler werden an alle Controller verteilt und koennen ausgelesen werden.

### Verifikationsgrenzen

- Regelquellen, Implementierung, statische Assetpfade und wesentliche Browserpfade wurden geprueft.
- Eine vollstaendige mehrstuendige Classic- oder Supernova-Partie mit realen Smartphones und Fire TV wurde in diesem Audit nicht gespielt.
- Fire-TV-Remote, PWA-Installation ueber die reale LAN-Adresse, iOS-Standalone, Netzwerkabbrueche und die VFX aller 12 Schlachtschiffe sind deshalb teilweise **NICHT VERIFIZIERT**; daraus abgeleitete Risiken sind entsprechend gekennzeichnet.

## 2. Gepruefte Quellen

### Offizielle Regelquellen

| Quelle | Fundort/Stand | Abdeckung | Bemerkung |
|---|---|---|---|
| Offizielle Anleitung `CATAN_Spielanleitung_Sternenfahrer.pdf` | lokal unter `docs/`, 8 Seiten, Ausgabe 2019 | vollstaendig gelesen und textuell extrahiert | Durch `docs/*.pdf` in `.gitignore` nicht versioniert; siehe `DOC-001`. |
| Offizieller Almanach `CATAN_Almanach_Sternenfahrer.pdf` | lokal unter `docs/`, 20 Seiten, Ausgabe 2019 | vollstaendig gelesen und textuell extrahiert | Praezisiert Aufbau, Zugablauf, Bau-/Flugregeln, Begegnungen, Freundschaft und Sieg. Ebenfalls nicht versioniert. |

### Supernova-Quellen

| Quelle | Fundort/Stand | Abdeckung | Bemerkung |
|---|---|---|---|
| `star_odyssey_supernova_regelwerk.md` | Codex-Anhangsablage | vollstaendig gelesen | Nicht im Repository versioniert; siehe `DOC-001`. |
| `star_odyssey_supernova_missionskarten.md` | Codex-Anhangsablage | vollstaendig gelesen | Enthaelt 25 Missionen und 5 Fabrik-Siegpunktkarten; nicht versioniert. |

### Projektspezifische Quellen

- `docs/encounter-card-markdown/begegnungskarten_implementierungshinweise_codex.md`
- `docs/encounter-card-markdown/begegnung_karte_01_*.md` bis `begegnung_karte_32_*.md`
- `docs/game-reference.md`
- `docs/board-layout.md`
- `docs/turn-structure.md`
- `docs/ui-flow.md`
- `docs/technical-guidelines.md`
- `docs/project-guidelines.md`
- `docs/implementation-roadmap.md`
- `docs/assets-plan.md`
- `docs/fire-tv-lan-testing.md`
- `docs/vision.md`
- `docs/pdf-analysis-workflow.md`

`docs/ui-flow.md`, `docs/implementation-roadmap.md`, `docs/assets-plan.md` und `docs/vision.md` beschreiben teilweise einen aelteren Prototypstand und sind nicht durchgehend als aktuelle Sollquelle geeignet (`DOC-001`).

## 3. Bewusste und bestaetigte Abweichungen vom Brettspiel

Die folgenden Punkte sind belegt beabsichtigt und werden in diesem Audit **nicht** als Fehler gewertet:

1. **Halbe Medaillen statt Ruhmesringe/RR.** Supernova-Werte werden als halbe Medaillen gespeichert und angezeigt.
2. **Freundschaftskarten-Ausbauboni sind keine physischen Mutterschiff-Anbauten.** Sie duerfen physische Limits ueberschreiten und werden bei Effekten auf "echte" Anbauten weder mitgezaehlt noch entfernt.
3. **Digitale Oberflaechentrennung.** TV/Host zeigt oeffentliche Informationen; Controller zeigen Spieleraktionen und private Inhalte. Der technische Zustand erfuellt die beabsichtigte Privatsphaere derzeit nicht vollstaendig (`SN-002`).
4. **Regulaere Schiffsgrafiken sind Kolonieschiffe.** Handels- und Schlachtschiffe sind getrennte Kategorien mit eigenen Assets/VFX.
5. **Sternennebel sehen wie normale Hexfelder aus.** Die Eigenschaft bleibt intern ueber Nebel-IDs vorhanden.
6. **Variable Wild-Space-Anordnung.** Das digitale Brett nutzt vorgegebene Startsysteme und zufaellig angeordnete Wild-Space-Systeme/Leerfelder entsprechend der Projektdokumentation.
7. **Encounter-Raumsprung als digitale Board-Auswahl.** Der Controller waehlt eigenes Schiff und Ziel auf dem Board; verdeckte Mittelpunkte besitzen einen Fallback auf einen gueltigen Punkt. Diese digitale Aufloesung ist in den Encounter-Spezifikationen bewusst beschrieben.
8. **Encounter-Informationen sind rollenbezogen.** Aktiver, betroffener passiver und unbeteiligter Spieler erhalten unterschiedliche Texte/Aktionen.
9. **Landscape-first.** TV und Smartphone-Controller sind fuer Querformat ausgelegt; Hochformat zeigt einen Drehhinweis.
10. **Zwei-Spieler-Nachbar-Fallback in Begegnungen.** Links/rechts/zweiter Nachbar kann bei zwei vorhandenen Spielern auf den jeweils anderen Spieler fallen. Dies bestaetigt jedoch nicht, dass das gesamte offizielle Classic-Spiel als 2-Spieler-Variante freigegeben ist (`CLS-001`).

## 4. Vollstaendigkeitsmatrix der klassischen Regeln

| Regelbereich | Soll laut Quelle | Implementierungsstatus | Beleg | Offene Audit-IDs |
|---|---|---|---|---|
| Spielerzahl | Offiziell 3 oder 4 Spieler | REGELABWEICHUNG: 2, 3 oder 4 waehlt/startet | `src/game/gameState.js:181-227`; `src/main.js:1901-1951` | `CLS-001` |
| Startaufbau | 2 Kolonien, 1 Raumhafen, Startschiff, Ressourcen/halbe Medaille/Antrieb; bei 3 Spielern neutrale Teile der vierten Farbe | TEILWEISE UMGESETZT | `src/game/gameState.js:181-227`; Platzierungsfluss in `src/game/gameState.js`; neutrale 3-Spieler-Blocker fehlen; Legacy-Fallback `:5598+` | `CLS-002` |
| 3-Spieler-Sondergrenze | Ausserhalb der Startsysteme hoechstens 2 Kolonien je Planetensystem | FEHLT | `src/game/gameState.js:1355-1408` ohne Spielerzahl-/Systemlimit | `CLS-002` |
| Spielfeld/Systeme | Startsysteme, Wilder Weltraum, leere Felder, Aussenposten, Zahlenchips | UMGESETZT | `src/data/board.js`; `src/data/boardPoints.js`; `src/data/boardNumberChips.js` | - |
| Zugphasen | Produktion, Handel/Bau, Flug, Zugende; nur aktiver Spieler handelt | UMGESETZT | Phasenmaschine in `src/game/gameState.js`; Controller-Gating in `src/main.js` | - |
| Produktion und Sieben | Planetenertrag; bei 7 Handlimit/Abwurf, Zufallsdiebstahl und Nachschub fuer Mitspieler | UMGESETZT | Produktions-/Siebenlogik `src/game/gameState.js:6336-6572`; Smoke-Tests | - |
| Nachschub | Punktegrenzen; vergessener Nachschub bis vor Mutterschiffwurf nachholbar | REGELABWEICHUNG | Nur in Handel/Bau; `src/game/gameState.js:587-630,842-871`; `src/main.js:2932-2945,8170-8175` | `CLS-003` |
| Handeln/Bauen | Kosten, Besitz, Plaetze und Materiallimits pruefen | UMGESETZT | `src/data/buildCosts.js`; Bauaktionen in `src/game/gameState.js`; Smoke-Tests | - |
| Schiffsbewegung/Erkundung | Gemeinsame Flugweite, einzelne Schiffe, Aufdeckung, Piraten/Eis/Begegnung | UMGESETZT | Fluglogik `src/game/gameState.js:874+`; Spezialmarker `:6336+`; Boardauswahl in `src/main.js` | - |
| Mutterschiff | Physische Antriebe/Kanonen/Frachtringe, Limits 6/6/5, Boni getrennt | UMGESETZT | Bonus-/Ausbaulogik `src/game/gameState.js:5475-5518`; Baukosten/-limits | - |
| 32 Begegnungen | Vollstaendige Entscheidungen, Effekte, passive Rollen, sichere Fortsetzung | TEILWEISE UMGESETZT | `src/data/encounterCards.js`; Encounter-Engine `src/game/gameState.js`; Controller-UI | `ENC-001`, `ENC-002`, `ENC-003`, `ENC-004` |
| 20 Freundschaftskarten/Aussenposten | 4 Voelker x 5 Karten; eindeutige Mehrheit 2 SP; Effekte | UMGESETZT | `src/data/friendshipCards.js`; `scripts/check-game-state.js:444+` | - |
| Klassischer Sieg | Aktiver Spieler erreicht im eigenen Zug 15 SP | UMGESETZT | `src/game/gameState.js:46-68,5551-5587` | - |

## 5. Vollstaendigkeitsmatrix Supernova

| Supernova-Bereich | Soll laut Quelle | Implementierungsstatus | Beleg | Offene Audit-IDs |
|---|---|---|---|---|
| Variantenwahl/Initialisierung | Classic oder Supernova; Default Classic; persistiert | UMGESETZT | Setup `src/main.js:1901-1951`; Normalisierung `src/game/gameState.js:2515-2636,2814-2851` | - |
| Nachschub | 3-5 SP: 3; 6-8: 2; 9-11: 1; 12-15: 0 | UMGESETZT | `src/game/gameState.js:3014-3026`; Tests `scripts/check-game-state.js:1635+` | - |
| 25 Missionen | Drei verschiedene Kategorien, privat, regelkonforme Erfuellung | TEILWEISE UMGESETZT: Daten/Ziehung vorhanden, 13 Bedingungen nur manuell; private Daten werden verteilt | `src/data/supernova.js:6-31`; `src/game/gameState.js:2779-2811,2907-2955`; `src/main.js:2700-2764,7722-7817` | `SN-001`, `SN-002` |
| Fabriken | 5 Typen, 5 Teile je Spieler, Baugrenzen, sichtbare Platzierung, doppelte Eigenproduktion | TEILWEISE UMGESETZT: Kosten/Bau/Produktion vorhanden; Materiallimit und Brettdarstellung fehlen | `src/data/supernova.js:34-39`; `src/game/gameState.js:2195-2268,6463-6572` | `SN-003` |
| Fabrik-Siegpunktkarten | 5 Karten, je 1 SP, nur alleinige Mehrheit, sofort neu berechnen | UMGESETZT im Zustandsmodell | `src/data/supernova.js:42-47`; `src/game/gameState.js:2863-2881` | - |
| Schlachtschiffbau | Max. 3, 2 Carbon + 2 Treibstoff, mindestens 1 physische Kanone | UMGESETZT | `src/data/buildCosts.js:36-38`; `src/game/gameState.js:2160-2192` | - |
| Schlachtschiffbewegung | Wie Schiffe; darf besetzten Raumpunkt angreifen | TEILWEISE UMGESETZT | Bewegungs-/Kampftrigger `src/game/gameState.js:1122-1237` | `SN-004`, `SN-005` |
| Schlachtschiffkampf | Interaktive Wuerfe, Gleichstand erneut, zieltypspezifische Folgen | FEHLERHAFT | `src/game/gameState.js:1160-1249` | `SN-004`, `SN-005` |
| Supernova-Sieg | 15 SP und mindestens eine erfuellte Mission im eigenen Zug | TEILWEISE UMGESETZT | Technisch vorhanden, aber von manuellen Missionsmarken abhaengig; `src/game/gameState.js:5551-5587`; Tests `scripts/check-game-state.js:1795+` | `SN-001` |
| Profivariante | Optional zwei statt drei Missionen | FEHLT, optional | Keine Setup-/State-Option vorhanden | `SN-006` |
| Classic-Isolation | Keine Supernova-Systeme im Classic-Modus | UMGESETZT | Variantengates in Bau-, Produktions- und Sieglogik | - |

## 6. Bestandsmatrix der Spielobjekte

| Objekt/Kartentyp/Asset | Soll | Vorhanden | Erreichbar | Status | Audit-IDs |
|---|---:|---:|---|---|---|
| Rohstofftypen | 5 | 5 | ja | UMGESETZT | - |
| Startsysteme/Startplaneten | 4 / 12 | 4 / 12 | ja | UMGESETZT | - |
| Wild-Space-Systemvorlagen/-planeten | 8 / 24 | 8 / 24 | ja, zufaellig angeordnet | UMGESETZT | - |
| Brett-Hexfelder / Sternennebel | 135 / 15 markiert | 135 / 15 | ja | BEWUSSTE ABWEICHUNG | - |
| Begegnungskarten | 32 | 32 | ja | TEILWEISE UMGESETZT | `ENC-001` bis `ENC-004` |
| Freundschaftskarten | 20 (4 x 5) | 20 | ja | UMGESETZT | - |
| Missionskarten | 25 | 25 | ja | TEILWEISE UMGESETZT | `SN-001`, `SN-002` |
| Fabrik-Siegpunktkarten | 5 | 5 | ja | UMGESETZT | - |
| Fabriktypen | 5 | 5 | baubar in Supernova | TEILWEISE UMGESETZT | `SN-003` |
| Mutterschiff-Ausbauarten | 3 | 3 | ja | UMGESETZT | - |
| Kolonieschiff-VFX-Varianten | 4 Farben x 3 | 12 | ja | NICHT VERIFIZIERT | `TEST-001` |
| Handelsschiff-VFX-Varianten | 4 Farben x 3 | 12 | ja | NICHT VERIFIZIERT | `TEST-001` |
| Schlachtschiff-VFX-Varianten | 4 Farben x 3 | 12 | ja | NICHT VERIFIZIERT | `TEST-001` |
| Raumhaefen/Kolonien/Aussenposten | offizielle Limits/4 Aussenposten | Limits und 4 Aussenposten vorhanden | ja | TEILWEISE UMGESETZT | `CLS-002` |
| Halbe Medaillen | Classic/Supernova-Werttraeger | Zustand, UI und Punkteberechnung vorhanden | ja | UMGESETZT | - |
| Spielerfarben | 4 | 4 | ja | UMGESETZT | - |
| Blaupausen | Schiffe, Mutterschiff, Supernova-Bauten | mehrere Assets/Renderpfade vorhanden | teilweise visuell geprueft | NICHT VERIFIZIERT | `TEST-001` |
| Audioassets/-system | nicht regelnotwendig, fuer Final Polish sinnvoll | kein zusammenhaengendes Audiosystem gefunden | nein | FEHLT | `AUDIO-001` |

## 7. Offene P0-Befunde

### ENC-001 - Ausbau-Belohnung kann Encounter ohne Fortsetzung sperren

- **Bereich:** Begegnungen / Zustandsmaschine
- **Status:** FEHLERHAFT
- **Prioritaet:** P0 - Blocker
- **Aufwand:** S
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Begegnungen mit Ausbau-Belohnung bieten nur physisch noch anbaubare Teile an. Ist kein Teil mehr zulaessig, muss der Flow dies erklaeren und ohne Belohnung bzw. ueber den vorgesehenen Ergebnis-/Abschlussschritt fortsetzen; er darf nie unbedienbar werden.
- **Aktuelles Istverhalten:** `chooseUpgradeGain` erzeugt einen ausstehenden Auswahlzustand auch dann, wenn Antrieb, Bordkanone und Frachtring bereits am jeweiligen physischen Limit sind. Host und Controller rendern alle drei Optionen deaktiviert und bieten keinen Abschlussweg.
- **Konkrete Abweichung:** Ein erreichbarer Encounter-Zustand besitzt keine gueltige Aktion und keinen Fallback.
- **Beleg:** `src/game/gameState.js:3821-3842` (`chooseUpgradeGain`); `src/main.js:3507-3533`; `src/controller.js:1135-1157`.
- **Auswirkung:** Die Partie bleibt in der Begegnung stecken; Zugende, Speichern ueber normale Controller-Aktionen und Fortsetzung sind blockiert.
- **Reproduktionsschritte:** Einen Spieler auf 6 physische Antriebe, 6 physische Bordkanonen und 5 physische Frachtringe setzen; eine Begegnung bis zu `chooseUpgradeGain` spielen; alle dargestellten Ausbauoptionen sind deaktiviert.
- **Empfohlene spaetere Massnahme:** Vor Erzeugen des Pending-State die gueltigen physischen Ausbauarten bestimmen; bei leerer Menge einen expliziten Ergebnis-/Weiter-Schritt ausloesen. Keine Freundschaftsboni als physische Alternative anbieten.
- **Abhaengigkeiten:** Encounter-Ergebnistext und bestehender `finishEncounter`-/Weiter-Pfad.
- **Akzeptanzkriterien:** Bei mindestens einer gueltigen Ausbauart bleibt die Wahl unveraendert; bei null gueltigen Arten erscheint eine klare Meldung und der Encounter kann genau einmal fortgesetzt/abgeschlossen werden; Save/Load in diesem Schritt bleibt stabil; kein Effekt wird doppelt ausgefuehrt.
- **Verifikationsstatus:** Statisch vollstaendig verifiziert; der Null-Optionen-Pfad ist direkt aus Engine- und UI-Gates ableitbar, aber nicht als vorhandener automatisierter Test abgedeckt.

## 8. Offene P1-Befunde

### CLS-001 - Nicht dokumentierter 2-Spieler-Modus weicht von der offiziellen Spielerzahl ab

- **Bereich:** Classic / Spielsetup
- **Status:** REGELABWEICHUNG
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** M
- **Betroffene Spielvariante:** Classic
- **Quelle bzw. Sollverhalten:** Anleitung und Almanach definieren das Grundspiel fuer 3 oder 4 Spieler. Eine 2-Spieler-Variante mit eigenem Aufbau, Zug- und Mehrheitenregelwerk ist nicht Bestandteil der geprueften Quellen.
- **Aktuelles Istverhalten:** Setup und `createInitialState` akzeptieren 2, 3 oder 4 Spieler; 2 ist zudem der technische Default. Nur einzelne Encounter-Nachbarrollen besitzen einen dokumentierten 2-Spieler-Fallback.
- **Konkrete Abweichung:** Das Gesamtspiel bietet eine nicht spezifizierte Variante als gleichwertige Classic-Auswahl an, obwohl Aufbau, Aussenpostenmehrheiten, Handel und Balance dafuer nicht belegt sind.
- **Beleg:** `src/game/gameState.js:181-227`; `src/main.js:1901-1951`; Encounter-Nachbar-Fallback in der Encounter-Logik.
- **Auswirkung:** Eine als "Klassisches Spiel" bezeichnete 2-Spieler-Partie kann regelwidrige oder unbalancierte Ergebnisse liefern; Regelkonformitaet ist nicht zusicherbar.
- **Reproduktionsschritte:** Hauptmenue -> Neues Spiel -> 2 Spieler -> Klassisches Spiel -> Weiter.
- **Empfohlene spaetere Massnahme:** Entweder 2 Spieler aus dem Classic-Setup entfernen oder eine explizite, vollstaendig dokumentierte und getestete Star-Odyssey-2-Spieler-Variante definieren und als bewusste Abweichung kennzeichnen.
- **Abhaengigkeiten:** Setup-UI, Boardaufbau, Nachbarrollen, Aussenposten-/Mehrheitenlogik und Tests.
- **Akzeptanzkriterien:** Classic bietet nur 3/4 Spieler oder eine separat benannte, dokumentierte 2-Spieler-Variante; alle davon abhaengigen Regeln besitzen Tests; bestehende 2-Spieler-Saves werden kontrolliert behandelt.
- **Verifikationsstatus:** Vollstaendig verifiziert gegen Quellen und erreichbaren Setup-Pfad.

### CLS-002 - 3-Spieler-Aufbau und Koloniegrenze sind unvollstaendig

- **Bereich:** Classic / Aufbau und Bauen
- **Status:** REGELABWEICHUNG
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** M
- **Betroffene Spielvariante:** Classic
- **Quelle bzw. Sollverhalten:** Beim 3-Spieler-Aufbau bleiben zwei Kolonien und ein Raumhafen der vierten Farbe als neutrale Blocker auf dem Brett. Ausserhalb der Startsysteme duerfen in einem Planetensystem hoechstens zwei Kolonien stehen.
- **Aktuelles Istverhalten:** Der initiale Zustand startet ohne neutrale Strukturen; der normale Startplatzierungsfluss platziert nur Teile realer Spieler. `foundColony` prueft weder die 3-Spieler-Sonderregel noch die Anzahl vorhandener Kolonien im Zielsystem.
- **Konkrete Abweichung:** Brettbelegung und Bauverfuegbarkeit sind im 3-Spieler-Spiel gegenueber Anleitung/Almanach erweitert.
- **Beleg:** `src/game/gameState.js:181-227` (`startingStructures: []`); normaler Platzierungsfluss; `src/game/gameState.js:1355-1408` (`foundColony`); `src/game/gameState.js:5598+` ist nur ein Legacy-Fallback, kein regulaerer Neutralaufbau.
- **Auswirkung:** Andere Raumhaefen-/Kolonieplaetze und ein dritter Kolonieplatz koennen verfuegbar sein; Produktion, Punkte und Routen werden regelrelevant veraendert.
- **Reproduktionsschritte:** Eine Classic-Partie mit 3 Spielern starten; Startbrett auf neutrale vierte Farbe pruefen; spaeter in einem Wild-Space-System eine dritte Kolonie gruenden.
- **Empfohlene spaetere Massnahme:** Neutralteile deterministisch gemaess offizieller 3-Spieler-Vorbereitung erzeugen und als nicht spielergesteuerte Blocker persistieren; das Zwei-Kolonien-Limit in der hostseitigen Bauvalidierung durchsetzen.
- **Abhaengigkeiten:** Board-Setup, Strukturmodell, Rendering, Save/Load, Bauzielmarkierung und vorhandene Saves.
- **Akzeptanzkriterien:** Drei-Spieler-Neustart zeigt die drei neutralen Bauteile; sie blockieren korrekt, produzieren/zaehlen nicht fuer Spieler; ausserhalb Alpha-Delta wird die dritte Kolonie hostseitig und im Controller verhindert; 4-Spieler-Classic bleibt unveraendert.
- **Verifikationsstatus:** Codepfad und Quellen vollstaendig verifiziert; konkrete offizielle Feldkoordinaten muessen beim Fix nochmals aus der Aufbauabbildung uebernommen werden.

### CLS-003 - Nachschub kann nicht bis zum Mutterschiffwurf nachgeholt werden

- **Bereich:** Classic / Nachschub und Phasen
- **Status:** REGELABWEICHUNG
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** S
- **Betroffene Spielvariante:** Classic
- **Quelle bzw. Sollverhalten:** Vergessener Nachschub darf laut Anleitung noch in Handel/Bau und bis unmittelbar vor dem Mutterschiffwurf nachgeholt werden; erst der Wurf laesst das Recht erloeschen.
- **Aktuelles Istverhalten:** `drawSupply` akzeptiert ausschliesslich `tradeBuild`. Beim Wechsel in die Flugphase verschwindet der Controller-/Host-Button, obwohl noch nicht gewuerfelt wurde.
- **Konkrete Abweichung:** Das Nachholrecht endet einen Zustandsuebergang zu frueh.
- **Beleg:** Anleitung, Abschnitt Nachschub; `src/game/gameState.js:587-630,842-871`; `src/main.js:2932-2945,8170-8175`.
- **Auswirkung:** Spieler koennen regelkonforme Nachschubkarten verlieren; dies beeinflusst Ressourcen, Bauen und Siegchancen.
- **Reproduktionsschritte:** Nach der Produktion keinen Nachschub ziehen; in die Flugphase wechseln, aber noch nicht wuerfeln; der Nachschub ist nicht mehr erreichbar.
- **Empfohlene spaetere Massnahme:** Einen persistierten Anspruch bis zum ersten normalen Mutterschiffwurf fuehren und die Aktion auch vor diesem Wurf in der Flugphase anbieten; Sonder-/Encounterwuerfe duerfen ihn nicht versehentlich loeschen.
- **Abhaengigkeiten:** Phasenmodell, Controller-Aktionsliste, Save/Load und Wuerfelaktion.
- **Akzeptanzkriterien:** Nachschub ist in Handel/Bau und vor dem normalen Flugwurf einmal verfuegbar; nach dem Flugwurf nicht mehr; Reload vor/nach dem Wurf behaelt den korrekten Anspruch; Supernova nutzt seine eigenen Mengen.
- **Verifikationsstatus:** Vollstaendig verifiziert.

### SN-001 - Missionssystem prueft nur einen Teil der 25 Missionsregeln

- **Bereich:** Supernova / Missionen und Sieg
- **Status:** TEILWEISE UMGESETZT
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** XL
- **Betroffene Spielvariante:** Supernova
- **Quelle bzw. Sollverhalten:** Alle 25 Missionskarten besitzen konkrete, private Erfuellungsbedingungen. Drei verschiedenfarbige Missionen werden gezogen; eine Mission gilt nur bei tatsaechlicher Regelerfuellung. Mission 06 fordert mindestens je eine Kolonie an den entferntesten Systemen.
- **Aktuelles Istverhalten:** Daten und Ziehung sind vorhanden, aber `isSupernovaMissionAutomaticallyFulfilled` implementiert nur 12 Bedingungen; alle uebrigen bleiben ohne manuelle Markierung falsch. Host/Controller bieten eine manuelle Erfuellt-Umschaltung. Der gespeicherte Text von Mission 06 verkuerzt "je eine" zu einer mehrdeutigen Einzahlform.
- **Konkrete Abweichung:** Die Supernova-Siegbedingung kann nicht aus dem tatsaechlichen Spielzustand fuer alle Missionen ermittelt werden und laesst sich manuell unabhaengig von der Regel setzen.
- **Beleg:** `src/data/supernova.js:6-31` (insbesondere M06); `src/game/gameState.js:2779-2811,2907-2955`; `src/main.js:2700-2764,8417-8422`; `scripts/check-game-state.js:1795+` setzt eine Mission manuell fuer den Siegtest.
- **Auswirkung:** Missionserfuellung und damit Spielende koennen falsch, verfrueht oder nie eintreten; eine regelkonforme vollstaendige Supernova-Partie ist nicht nachgewiesen.
- **Reproduktionsschritte:** Supernova starten; eine Mission ohne implementierten Condition-Branch regelkonform erfuellen; Status bleibt unerfuellt, bis er manuell umgeschaltet wird. Alternativ eine unerfuellte Mission manuell markieren und 15 SP erreichen.
- **Empfohlene spaetere Massnahme:** Jede Missionsbedingung als explizite, getestete Zustandspruefung implementieren; Originaltexte exakt uebernehmen; manuelle Markierung nur als klarer Debug-/Schiedsrichtermodus ausserhalb normaler Partie erlauben.
- **Abhaengigkeiten:** Vollstaendiger Missionskatalog, private Controllerdaten, Ereignis-/State-Historie fuer zeitliche Bedingungen, Siegpruefung und Save/Load.
- **Akzeptanzkriterien:** Alle 25 Missionen besitzen eindeutige Tests fuer nicht erfuellt/erfuellt und Sonderfaelle; M06 verlangt je eine Kolonie an jedem geforderten fernen System; normale Spieler koennen Status nicht frei setzen; Sieg prueft 15 SP plus real erfuellte Mission.
- **Verifikationsstatus:** Datenbestand und fehlende Branches vollstaendig verifiziert; einzelne missionsspezifische Laufzeitbedingungen mangels Vollpartie nicht verifiziert.

### SN-002 - Private Missionen und Ressourcen werden an alle Controller verteilt

- **Bereich:** Supernova / Controller / Datenschutz
- **Status:** FEHLERHAFT
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** L
- **Betroffene Spielvariante:** beide (Missionen nur Supernova; Ressourcen beide)
- **Quelle bzw. Sollverhalten:** Ressourcenhand, private Karten und Supernova-Missionen sind nur fuer den jeweiligen Spieler bestimmt. Andere Controller erhalten nur oeffentliche bzw. fuer ihre Aktion notwendige Informationen.
- **Aktuelles Istverhalten:** Der Host baut einen Remote-State mit allen Spielern; jeder Player-State enthaelt Ressourcen, Upgrades und `supernovaMissions`. Der TV-Server broadcastet denselben Zustand an alle Controller. Zusaetzlich kann die Host-/TV-Uebersicht Missionen ausgewaehlter Spieler darstellen.
- **Konkrete Abweichung:** Die UI blendet fremde Daten teilweise aus, die Daten sind im Controllerprozess/Netzwerkpayload dennoch vorhanden und auslesbar.
- **Beleg:** `src/main.js:7722-7741` (`getRemoteControllerState`); `src/main.js:7782-7817` (`getRemotePlayerState`); `tools/tv-server.mjs:46-49,167-170`; Missionsdarstellung `src/main.js:2700-2764`.
- **Auswirkung:** Mitspieler koennen geheime Ressourcen und Missionen auslesen; Handel, Missionsrennen und Fairness werden kompromittiert.
- **Reproduktionsschritte:** Mehrspielerzustand laden; an einem Controller WebSocket-/State-Payload inspizieren; `players` enthaelt die Daten aller Spieler.
- **Empfohlene spaetere Massnahme:** Pro Verbindung einen server-/hostseitig gefilterten View-State erzeugen; fremde Ressourcen/Missionen nie serialisieren. Oeffentliche Summen nur dort senden, wo Regeln sie vorsehen.
- **Abhaengigkeiten:** Authentisierte Controllerzuordnung (`NET-001`), Remote-State-Schema, Debug-/Hostansicht und Regressionstests.
- **Akzeptanzkriterien:** Controller-Payload enthaelt fuer fremde Spieler keine privaten Ressourcen-, Karten- oder Missionsdetails; eigener Controller erhaelt sie; Host zeigt private Missionen nicht oeffentlich; Reconnect behaelt Berechtigung; Tests untersuchen das rohe Payload.
- **Verifikationsstatus:** Vollstaendig statisch verifiziert; LAN-Paketmitschnitt war nicht notwendig, da der Broadcastpfad eindeutig ist.

### SN-003 - Fabriksystem ist ohne Materiallimit und Brettdarstellung unvollstaendig

- **Bereich:** Supernova / Fabriken
- **Status:** TEILWEISE UMGESETZT
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** M
- **Betroffene Spielvariante:** Supernova
- **Quelle bzw. Sollverhalten:** Jeder Spieler besitzt insgesamt fuenf Fabriken; je Planet maximal eine; nur ausserhalb Alpha-Delta und angrenzend an eigene Kolonie/Raumhafen. Gebaute Fabriken muessen als Brettobjekt sichtbar und save/load-sicher sein.
- **Aktuelles Istverhalten:** Kosten, Anschluss-, Startsystem- und Planetbelegungspruefung sowie Produktionsverdopplung sind vorhanden. Es gibt keine Begrenzung auf fuenf Fabriken pro Spieler. `supernova.factories` wird in Bau- und Produktionslogik genutzt, aber nicht als Fabrikobjekt im normalen Boardrenderer gezeichnet.
- **Konkrete Abweichung:** Spieler koennen mehr Teile bauen als das Regelmaterial erlaubt; Besitz und Planetbelegung sind fuer Mitspieler auf dem Brett nicht nachvollziehbar.
- **Beleg:** `src/data/supernova.js:34-39`; `src/game/gameState.js:2195-2268,6463-6572`; Fabrikreferenzen in `src/main.js:1581-1584,3755-3770,8187,8413-8414`, ohne entsprechenden Board-Renderpfad.
- **Auswirkung:** Fabrikmehrheiten, Kosten, Produktion und Siegpunkte koennen regelwidrig werden; fehlende Visualisierung erschwert Planung und Fehlererkennung.
- **Reproduktionsschritte:** In Supernova nacheinander sechs zulaessige Fabriken desselben Spielers bauen; Engine besitzt keinen Gesamtbestands-Guard. Danach Brettansicht pruefen: Fabriken sind nicht am Planeten sichtbar.
- **Empfohlene spaetere Massnahme:** Gesamtbestand von fuenf hostseitig validieren und als State-/UI-Verfuegbarkeit anzeigen; Fabriken mit Besitzer-/Typmarker am Planeten rendern und in Controller-Board sowie TV synchronisieren.
- **Abhaengigkeiten:** Fabrikassets/Icons, Board-Z-Order, Produktions-VFX, Save/Load und Mehrheitstests.
- **Akzeptanzkriterien:** Sechster Bau wird trotz ausreichender Ressourcen abgelehnt; jede Fabrik ist auf TV und berechtigter Controlleransicht eindeutig erkennbar; Reload erhaelt Position/Typ/Besitzer; Classic zeigt keine Fabriken.
- **Verifikationsstatus:** Engine und Renderreferenzen statisch verifiziert; visueller Vollbretttest mit Fabriken nicht moeglich, weil der Renderpfad fehlt.

### SN-004 - Schlachtschiffkaempfe umgehen die erforderlichen Spielerwuerfe

- **Bereich:** Supernova / Schlachtschiffkampf
- **Status:** REGELABWEICHUNG
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** L
- **Betroffene Spielvariante:** Supernova
- **Quelle bzw. Sollverhalten:** Angreifer und Verteidiger fuehren den Kampf ueber Mutterschiffwurf/Kampfkraft aus; bei Gleichstand wird erneut gewuerfelt, bis ein Sieger feststeht. Beteiligte Spieler muessen ihren Wurf ausloesen und das Ergebnis sehen.
- **Aktuelles Istverhalten:** `resolveSupernovaShipBattle` erzeugt beide Ergebnisse unmittelbar in der Engine. Nach hoechstens sechs Gleichstands-Rerolls beendet `attackerTotal >= defenderTotal` einen verbleibenden Gleichstand zugunsten des Angreifers. Es gibt keinen synchronen Zwei-Spieler-Pending-State wie bei Encounter-Dualwuerfen.
- **Konkrete Abweichung:** Spielerinteraktion und sichtbare Wurfauswertung fehlen; ein Gleichstand kann regelwidrig als Angreifersieg enden.
- **Beleg:** `src/game/gameState.js:1160-1237`, insbesondere Reroll-Schleife `:1169-1181`; vorhandener interaktiver Encounter-Vergleich dient als Gegenbeispiel.
- **Auswirkung:** Kampfresultate koennen unfair sein; Controller-/TV-Erlebnis entspricht nicht dem Regelablauf; Disconnect/Save waehrend eines echten Kampfes ist nicht modelliert.
- **Reproduktionsschritte:** Ein Schlachtschiff auf ein gegnerisch besetztes Feld ziehen; der Kampf wird ohne Buttons beider Spieler aufgeloest. Einen dauerhaft gleichen Testwurf einspeisen; nach dem Limit gewinnt der Angreifer.
- **Empfohlene spaetere Massnahme:** Save/load-faehigen Supernova-Kampfzustand mit Teilnehmern, Wuerfen, Animation, Gleichstands-Reroll und Ergebnisphase einfuehren; bestehende Mutterschiff-Anzeige/Wuerfelhelper wiederverwenden.
- **Abhaengigkeiten:** Controllerfilterung, Mutterschiff-VFX, Kampffolgen (`SN-005`), Netzwerk-Reconnect und Tests.
- **Akzeptanzkriterien:** Beide Beteiligten besitzen genau ihren Wuerfelbutton; ein Einzelwurf loest nichts aus; Gleichstand fordert ohne festes Limit erneut beide Wuerfe; erst nach sichtbarer Auswertung wird genau ein Ergebnis angewendet; Save/Load und Disconnect bleiben stabil.
- **Verifikationsstatus:** Vollstaendig statisch verifiziert; kein realer Zwei-Controller-Kampf vorhanden, weil der Interaktionszustand fehlt.

### SN-005 - Schlachtschiff-Kampffolgen und Feldbelegung sind teilweise falsch

- **Bereich:** Supernova / Kampfkonsequenzen
- **Status:** FEHLERHAFT
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** L
- **Betroffene Spielvariante:** Supernova
- **Quelle bzw. Sollverhalten:** Gegen Kolonieschiff verliert der Verlierer einen **gewaehlten echten** Mutterschiff-Ausbau; gegen Handelsschiff werden zwei Rohstoffe uebertragen, ohne zusaetzlichen Ausbauverlust; gegen Schlachtschiff wird das Verliererschiff entfernt. Verteidigersieg/-niederlage vergibt halbe Medaille bzw. sperrt das betroffene Schiff. Die Endposition muss eindeutig sein.
- **Aktuelles Istverhalten:** `removeFirstAvailableUpgrade` entfernt automatisch die erste gefundene Ausbauart statt einer Spielerwahl. Derselbe Ausbauverlust wird auch im Handelsschifffall ausgefuehrt, bevor Ressourcen transferiert werden. Der Angreifer wird vor Kampfauswertung auf den besetzten Zielpunkt bewegt; ueberlebt der Verteidiger, kann eine ungeklaerte Doppelbelegung verbleiben.
- **Konkrete Abweichung:** Zieltypspezifische Folgen werden vermischt, die vorgeschriebene Auswahl fehlt und Boardbesitz nach dem Kampf ist nicht robust definiert.
- **Beleg:** `src/game/gameState.js:1122-1155,1195-1206,1243-1249`.
- **Auswirkung:** Spieler verlieren falsche Ausbauten, Handelsschiffkaempfe bestrafen doppelt und Schiffspositionen koennen Folgebewegungen/-kaempfe fehlerhaft ausloesen.
- **Reproduktionsschritte:** (1) Kolonieschiffkampf mit mehreren physischen Ausbauarten verlieren: Engine waehlt selbst. (2) Handelsschiffkampf verlieren: Ausbauverlust plus Ressourcentransfer beobachten. (3) Verteidigersieg auf besetztem Ziel: beide Positionszustaende pruefen.
- **Empfohlene spaetere Massnahme:** Folgen nach Verteidigertyp trennen; physische Ausbauwahl als Pending-Entscheidung des betroffenen Spielers modellieren; weniger als zwei Ressourcen regelkonform behandeln; Angreiferposition erst nach Ergebnis bzw. mit explizitem Rueckkehrpfad festlegen.
- **Abhaengigkeiten:** `SN-004`, Boardbewegung, Ressourcenauswahl/-zufall, physische-vs.-Karten-Upgrades und Save/Load.
- **Akzeptanzkriterien:** Jeder der drei Kampfarten besitzt isolierte Tests fuer Angreifer-/Verteidigersieg, Gleichstand und Randfaelle; Handelsschiff verliert nie zusaetzlich einen Ausbau; Ausbauwahl zeigt nur echte vorhandene Teile; nach Kampf existiert keine unzulaessige Doppelbelegung.
- **Verifikationsstatus:** Statisch vollstaendig verifiziert; alle Kombinationen sind automatisiert ungetestet.

### ENC-002 - Hehlerei-/Raumpiraten-Sonderwurf wird ohne Spieleraktion sofort aufgeloest

- **Bereich:** Begegnungen / Mutterschiffwurf
- **Status:** REGELABWEICHUNG
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** M
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Bei den Hehlerei-/Tauschbegegnungen loest der aktive Spieler den Mutterschiffwurf aus; Kugeln/Shake werden sichtbar ausgewertet. Es zaehlen nur Kugelpunkte, keine Ausbauten oder Freundschaftsboni.
- **Aktuelles Istverhalten:** Der Effekt `mothershipOutcomeRoll` ruft unmittelbar `createEncounterRoll` auf und springt direkt in den Ergebniszweig. Es gibt weder Pending-Button noch sichtbare Wurfphase.
- **Konkrete Abweichung:** Das Ergebnis entsteht beim Betreten des Schritts statt durch die vorgeschriebene aktive Wurfhandlung; die visuelle Erklaerung fehlt.
- **Beleg:** Encounter-Spezifikationen fuer Karten 12/13; `src/game/gameState.js:3957-3996`.
- **Auswirkung:** Spieler koennen den Wurf kaum nachvollziehen; Encounter-Text und Ergebnis erscheinen zu frueh; die erwartete Mutterschiff-Interaktion fehlt.
- **Reproduktionsschritte:** Karte 12 oder 13 bis zum Sonderwurf spielen; Ergebnis wird ohne Controllerbutton und Wuerfelanimation berechnet.
- **Empfohlene spaetere Massnahme:** Einen Einzelspieler-Encounter-Roll-State analog zum dualen Roll-State verwenden; Button, Hostanimation und anschliessenden Ergebniszweig verbinden; nur Kugelwert uebernehmen.
- **Abhaengigkeiten:** Mutterschiff-Overlay, Controlleraktionen, Encounter-Save/Load und Animationstiming.
- **Akzeptanzkriterien:** Vor Buttondruck kein Ergebnis; aktiver Controller kann genau einmal wuerfeln; Host zeigt Shake/Kugeln; Ausbauten/Boni veraendern den Wert nicht; Reload fuehrt nicht zu Doppelwurf/-effekt.
- **Verifikationsstatus:** Vollstaendig statisch verifiziert.

### ENC-003 - Galaktischer Rat zaehlt Freundschafts-Frachtringboni als echte Anbauten

- **Bereich:** Begegnung 32 / Zahn der Zeit
- **Status:** REGELABWEICHUNG
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** XS
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Beim Galaktischen Rat zaehlen ausschliesslich echte physische Frachtringe/Frachtmodule. Freundschaftskarten-Boni duerfen weder Schwellenwert noch Mehrheit beeinflussen.
- **Aktuelles Istverhalten:** `globalLeaderHalfMedal` ermittelt den Frachtringwert ueber `getCargoValueForPlayer`, das physische Frachtringe und Freundschaftsbonus addiert.
- **Konkrete Abweichung:** Spieler mit Kartenbonus koennen eine halbe Medaille gewinnen oder einen Gleichstand erzeugen, obwohl ihre physische Ausruestung geringer ist.
- **Beleg:** Encounter-Implementierungshinweise und Karte 32; `src/game/gameState.js:173-175,3780-3809`.
- **Auswirkung:** Falsche Punktevergabe und moeglicherweise falscher Spielsieg.
- **Reproduktionsschritte:** Spieler A mit 1 physischem Frachtring plus +1 Kartenbonus, Spieler B mit 2 physischen Frachtringen; Karte 32 ausloesen; aktueller Helper behandelt beide als 2.
- **Empfohlene spaetere Massnahme:** Fuer diesen Effekt ausschliesslich den physischen Cargo-Zaehler verwenden; keine allgemeine effektive-Frachtfunktion.
- **Abhaengigkeiten:** Encounter-Ergebnisanzeige `ENC-004`, Siegpunktberechnung.
- **Akzeptanzkriterien:** Tests fuer klare Mehrheit, Gleichstand und null Frachtringe; Freundschaftsbonus aendert kein Ergebnis; Kartenboni bleiben ansonsten funktional.
- **Verifikationsstatus:** Vollstaendig verifiziert.

### PWA-001 - Unversionierter Cache-first-Assetcache kann alte UI dauerhaft ausliefern

- **Bereich:** Deployment / Service Worker
- **Status:** FEHLERHAFT
- **Prioritaet:** P1 - Kritisch
- **Aufwand:** S
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Nach Deployment oder Hard Reload muessen neue Menue-, Controller- und Spielassets verlaesslich geladen werden; alte Cacheeintraege duerfen keine gemischte UI-Version erzeugen.
- **Aktuelles Istverhalten:** `sw.js` nutzt fest `star-odyssey-ui-v1`. Nicht-Shell-Assets werden cache-first geliefert und nur bei Cache-Miss aktualisiert. Ein vorhandener `v1`-Cache kann deshalb alte Bilder/CSS weiterreichen, obwohl HTML/JS neuer ist.
- **Konkrete Abweichung:** Es existiert keine Cacheversionierung oder Revalidierung fuer geaenderte Assetinhalte. Der zuvor beobachtete Handy-Zustand mit fehlenden/neuen Assets ist mit diesem Pfad vereinbar.
- **Beleg:** `sw.js:1-64`; Asset-/Shell-Strategie; reale LAN-/Controller-Nutzung. Der aktuelle frische Chromium-Lauf zeigte keine kaputten Assets, widerlegt aber persistente Alt-Caches nicht.
- **Auswirkung:** Benutzer sehen alte, fehlende oder stilistisch gemischte UI; Fixes wirken auf realen Geraeten scheinbar nicht; Controller und Host koennen unterschiedliche Versionen nutzen.
- **Reproduktionsschritte:** Version A eines Assets mit aktivem Service Worker laden; Datei unter gleichem Pfad deployen; offline/cache-first neu laden; alter Eintrag kann erhalten bleiben.
- **Empfohlene spaetere Massnahme:** Cache-Namen/build revisionieren, alte Caches in `activate` entfernen und zentrale UI-Assets network-first bzw. stale-while-revalidate mit Revision nutzen; Updatehinweis/Reload kontrollieren.
- **Abhaengigkeiten:** Deploymentprozess, PWA-Manifest, Assetpreloader und `PWA-002`.
- **Akzeptanzkriterien:** Ein Deployment mit geaendertem gleichnamigem Asset aktualisiert bestehende Installationen; alte Caches werden entfernt; Host und Controller nutzen dieselbe Revision; Offline-Fallback bleibt funktionsfaehig.
- **Verifikationsstatus:** Strategie statisch vollstaendig verifiziert; reales Upgrade einer installierten PWA wurde nicht ausgefuehrt.

## 9. Offene P2-Befunde

### ENC-004 - Zahn der Zeit ueberspringt vorgeschriebene sichtbare Zwischenphasen

- **Bereich:** Begegnungen 31/32 / Ergebnisdarstellung
- **Status:** TEILWEISE UMGESETZT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** M
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Karte 31 zeigt nach den Ausbauverlusten einen eigenen Schritt "Neue Begegnung" mit dem Text "Die Begegnungen wurden neu gemischt." Karte 32 zeigt davor einen eigenen "Galaktischer Rat"-Schritt mit nachvollziehbarer Gewinneranzeige. Erst danach wird neu gemischt und direkt die naechste Begegnung gestartet.
- **Aktuelles Istverhalten:** Die Datenkette fuehrt globale Ausbauverluste, Rat/Medaille und `drawNextEncounter` direkt als Effekte aus; Ergebnistext ist zusammengefasst. Eigenstaendige, bestaetigte Zwischenphasen sind nicht als Flow-Nodes modelliert.
- **Konkrete Abweichung:** Spieler koennen Ergebnis, betroffene Spieler und Neustart des Stapels nicht in der spezifizierten Reihenfolge wahrnehmen; Texte koennen zu kurz bzw. kombiniert erscheinen.
- **Beleg:** `src/data/encounterCards.js:648-687`; Effektkette in `src/game/gameState.js`; Encounter-Markdowns 31/32.
- **Auswirkung:** Fachlich wichtige Erklaerung und Punktevergabe sind schwer nachvollziehbar; Folgebegegnung kann den Ratstext sofort verdraengen.
- **Reproduktionsschritte:** Karte 31 bzw. 32 gezielt starten und den letzten Ausbauverlust bestaetigen; der Flow wechselt ohne getrennte "Neue Begegnung"-/Rat-Phase in die Folgekette.
- **Empfohlene spaetere Massnahme:** Die vorgeschriebenen Anzeigen als persistierte Encounter-Steps mit Ergebnisdaten und kontrollierter Fortsetzung modellieren; erst danach mischen/ziehen.
- **Abhaengigkeiten:** Korrekte physische Frachtringwertung `ENC-003`, passive Ausbauwahlen und Encounter-Save/Load.
- **Akzeptanzkriterien:** Karte 31 und 32 zeigen exakt die geforderten Ueberschriften/Texte in eigener Reihenfolge; Karte 32 nennt alle Empfaenger; Folgekartenstart erfolgt erst nach abgeschlossener Anzeige; Reload wiederholt weder Medaillen noch Verluste.
- **Verifikationsstatus:** Daten-/Enginepfad vollstaendig verifiziert; visuelles Timing im realen Mehrgeraetefluss nicht separat gemessen.

### DOC-001 - Massgebliche Regelquellen sind nicht versioniert, Projektdokumente teilweise veraltet

- **Bereich:** Dokumentation / Nachvollziehbarkeit
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** S
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Die fuer Implementierung und Regression massgeblichen Quellen muessen eindeutig auffindbar, versioniert und von veralteten Planungsdokumenten unterscheidbar sein.
- **Aktuelles Istverhalten:** Die beiden offiziellen PDFs liegen lokal unter `docs/`, werden aber durch `docs/*.pdf` ignoriert. Supernova-Regelwerk und Missionskarten liegen nur in der Codex-Anhangsablage. Gleichzeitig beschreiben `ui-flow`, Roadmap, Assetplan und Vision teilweise fruehere Prototypstaende.
- **Konkrete Abweichung:** Ein frischer Checkout enthaelt nicht alle verbindlichen Sollquellen und kann veraltete Dokumente faelschlich als aktuellen Stand interpretieren.
- **Beleg:** `.gitignore` mit `docs/*.pdf`; lokale Dateien `docs/CATAN_Spielanleitung_Sternenfahrer.pdf`, `docs/CATAN_Almanach_Sternenfahrer.pdf`; Supernova-Anhaenge ausserhalb des Repos; `docs/ui-flow.md:19-20,40,45-46`; `docs/implementation-roadmap.md:6-18`; `docs/vision.md:20`.
- **Auswirkung:** Kuenftige Fixes koennen Regeln erneut falsch interpretieren; Audits sind nicht reproduzierbar; Text- und Datenabweichungen wie M06 bleiben wahrscheinlicher.
- **Reproduktionsschritte:** Repository auf einem neuen Rechner klonen und nur versionierte `docs/` als Sollquelle verwenden; offizielle PDFs und Supernova-Originale fehlen.
- **Empfohlene spaetere Massnahme:** Urheberrechtlich zulaessige Quellenstrategie festlegen: versionierte interne Regelauszuege/Quellenindex mit Seitenverweisen und Checksummen; Supernova-Markdowns in `docs/` aufnehmen; alte Planungsdokumente als historisch markieren oder aktualisieren.
- **Abhaengigkeiten:** Lizenz-/Ablageentscheidung fuer offizielle PDFs.
- **Akzeptanzkriterien:** Ein frischer Checkout benennt eindeutig die aktuelle Classic-, Almanach-, Supernova- und Star-Odyssey-Sollquelle; veraltete Dateien tragen Status/Datum; keine widerspruechliche Datei gilt stillschweigend als aktuell.
- **Verifikationsstatus:** Vollstaendig verifiziert.

### CTRL-001 - Controller-Oberflaeche ist nicht vollstaendig DE/EN-lokalisiert

- **Bereich:** Controller / Lokalisierung
- **Status:** TEILWEISE UMGESETZT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** M
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Sprachwahl DE/EN gilt fuer alle sichtbaren Menues, Controllertexte, Logs und Supernova-Aktionen; keine gemischte Sprache oder nicht uebersetzbare Literale.
- **Aktuelles Istverhalten:** `src/controller.js` enthaelt zahlreiche direkte deutsche Texte fuer Verbindungs-, Encounter-, Board- und Statuszustaende. Der Schluesselvergleich findet ausserdem drei nur auf Deutsch vorhandene Logschluessel: `logBattleShipBuilt`, `logSupernovaFactoryBuilt`, `logSupernovaBattleResolved`.
- **Konkrete Abweichung:** Englisch kann im Controller deutsch/englisch gemischt erscheinen; drei Supernova-Logs besitzen keinen englischen Gegenwert.
- **Beleg:** direkte Literale u. a. `src/controller.js:446,484,496,1222,1668,1693,1786-1789`; deutsche Schluessel `src/i18n.js:354-356`; englischer Block ab `src/i18n.js:451`, ohne diese drei Keys.
- **Auswirkung:** Inkonsistente Bedienung und unvollstaendige englische Partie; Texte koennen spaeter nicht zentral gepflegt oder auf Laenge getestet werden.
- **Reproduktionsschritte:** Sprache auf EN stellen; Controller durch Verbindungs-/Encounter-/Boardzustaende und Supernova-Bau/Kampf fuehren; deutsche Literale/Fallbacks beobachten.
- **Empfohlene spaetere Massnahme:** Sichtbare Controller-Literale in i18n-Schluessel ueberfuehren, fehlende EN-Schluessel ergaenzen und automatisierten Key-/Literal-Smoke-Test einrichten.
- **Abhaengigkeiten:** Vollstaendige Textinventur der 32 Encounter und Supernova-Flows.
- **Akzeptanzkriterien:** DE und EN besitzen identische Keymengen; Controller zeigt in EN keine deutschen Bedien-/Status-/Logtexte; dynamische Namen/Werte bleiben korrekt; lange englische Texte werden nicht abgeschnitten.
- **Verifikationsstatus:** Statisch verifiziert; nicht jeder dynamische Controllerzustand visuell in EN durchgespielt.

### PWA-002 - Reale LAN-Auslieferung ueber HTTP verhindert verlaessliche PWA-/Service-Worker-Nutzung

- **Bereich:** PWA / Mobile Deployment
- **Status:** TEILWEISE UMGESETZT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** M
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Controller soll auf realen Smartphones installierbar im Standalone-Modus laufen; Manifest, Service Worker, Fullscreen und Sessionparameter muessen am LAN-Host funktionieren.
- **Aktuelles Istverhalten:** Manifest, Apple-Metadaten, Session-Restore, Fullscreen-Button und iOS-Hinweis sind implementiert. Der dokumentierte LAN-Betrieb und `tv-server` verwenden jedoch `http://<LAN-IP>:5173`; Service Worker/PWA-Installation sind ausserhalb `localhost` in regulaeren Browsern an einen sicheren Kontext gebunden.
- **Konkrete Abweichung:** Die Codeoberflaeche ist PWA-faehig, der vorgesehene reale Transport stellt die erforderliche Sicherheitsumgebung nicht verlaesslich bereit.
- **Beleg:** `controller.webmanifest:1-25`; `controller.html:5-40`; `src/controller.js:285-349,2474-2491`; `docs/fire-tv-lan-testing.md:32,56`; HTTP-Server `tools/tv-server.mjs:294`.
- **Auswirkung:** "Zum Home-Bildschirm", Service Worker und adressleistenfreie Nutzung koennen auf iOS/Android im LAN fehlen oder inkonsistent sein; das Akzeptanzkriterium ist auf realen Handys nicht gesichert.
- **Reproduktionsschritte:** Controller ueber eine normale private `http://`-LAN-IP auf iOS/Android oeffnen und Installierbarkeit/Service-Worker-Registrierung pruefen.
- **Empfohlene spaetere Massnahme:** Einen fuer lokale Geraete vertrauenswuerdigen HTTPS-Pfad oder dokumentierten Wrapper/Installationsweg bereitstellen; Sessionquery beim Start weiterhin erhalten; `PWA-001` gleichzeitig beheben.
- **Abhaengigkeiten:** Zertifikats-/LAN-Deploymentstrategie, Fire-TV-WebView-Vertrauen und QR-URL-Erzeugung.
- **Akzeptanzkriterien:** Auf mindestens iOS Safari und Android Chrome laesst sich die reale Controller-URL installieren/starten; Standalone behaelt Session/Spieler; Service Worker ist aktiv; normale Browsernutzung bleibt moeglich.
- **Verifikationsstatus:** Code und HTTP-Betrieb verifiziert; Installation auf realer Hardware **NICHT VERIFIZIERT**.

### NET-001 - Controllerzuordnung besitzt keinen verbindungsspezifischen Berechtigungsnachweis

- **Bereich:** Netzwerk / Controller-Sessions
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** M
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Ein verbundener Controller darf nur seinen zugewiesenen Spieler steuern. Doppelte/veraltete Links duerfen eine aktive Verbindung nicht unbemerkt ersetzen.
- **Aktuelles Istverhalten:** Der Relay-Server ordnet Controller anhand Session-ID und Spielerindex zu. Eine neue Verbindung mit denselben Parametern kann den bestehenden Slot ersetzen; ein pro Controller ausgehandeltes Token oder eine Hostfreigabe ist nicht vorhanden.
- **Konkrete Abweichung:** Kenntnis/Weitergabe der QR-URL reicht aus, um denselben Spieler erneut zu verbinden und potenziell die aktive Verbindung zu verdraengen.
- **Beleg:** Session-/Controllerverwaltung `tools/tv-server.mjs:26-49,127-146`; QR-Parameterfluss.
- **Auswirkung:** Versehentliche Doppel-Tabs, alte Links oder ein zweites Geraet koennen Eingabekonflikte verursachen; zusammen mit `SN-002` besteht ein Informations-/Steuerungsrisiko im LAN.
- **Reproduktionsschritte:** Dieselbe Controller-URL auf zwei Geraeten/Tabs oeffnen; Verbindung und Steuerzustand des ersten Clients beobachten.
- **Empfohlene spaetere Massnahme:** Kurzlebiges per Spieler ausgestelltes Join-Token plus kontrollierte Reconnect-/Replace-Policy einfuehren; Host und alter Controller erhalten klare Meldung.
- **Abhaengigkeiten:** QR-Erzeugung, Reconnect-UX, serverseitige Statefilterung und Save/Resume.
- **Akzeptanzkriterien:** Fremder/alter Link kann keinen aktiven Slot still ersetzen; legitimer Reconnect funktioniert nach expliziter Regel; Aktionen werden server-/hostseitig an Spieler und Token gebunden; Doppelverbindung ist getestet.
- **Verifikationsstatus:** Serverpfad statisch verifiziert; Verhalten mit zwei realen Smartphones **NICHT VERIFIZIERT**.

### NET-002 - Relay-Sessions gehen bei Serverneustart verloren

- **Bereich:** Netzwerk / Wiederverbindung
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** M
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Nach Host-/Serverneustart soll ein gespeichertes Spiel kontrolliert wiederaufgenommen und Controller sollen ohne falsche Spielerzuordnung neu verbunden werden koennen.
- **Aktuelles Istverhalten:** `tv-server` haelt Session-, Host- und Controllerzuordnungen ausschliesslich in Prozessspeicher. Browser-Autosave kann den Game State erhalten, der Relay kennt nach Neustart jedoch keine bestehende Session.
- **Konkrete Abweichung:** Game-State-Persistenz und Verbindungszustand besitzen keinen gemeinsamen Wiederanlaufpfad; das reale Verhalten ist nicht automatisiert geprueft.
- **Beleg:** In-Memory-Maps `tools/tv-server.mjs:26-38`; keine persistierte Relay-Session; Browser-Autosave in `src/main.js:396-430`.
- **Auswirkung:** Nach PC-/Serverneustart koennen QR-Links veralten, Spieler muessen neu zugeordnet werden oder ein laufender Encounter bleibt ohne passenden Controller.
- **Reproduktionsschritte:** Laufende Mehrspielerpartie speichern; Serverprozess beenden/neu starten; Hostseite und alte Controller-URLs erneut oeffnen.
- **Empfohlene spaetere Massnahme:** Expliziten Restore-Handshake definieren: Host registriert neue Session/Spieler-Slots aus Save, UI zeigt neue QR-/Reconnect-Links, alte Clients werden eindeutig abgewiesen oder migriert.
- **Abhaengigkeiten:** `NET-001`, Autosave/Load, Controller-URL und aktive Pending-Entscheidungen.
- **Akzeptanzkriterien:** Dokumentierter Neustarttest stellt Spiel und korrekte Spielerzuordnung wieder her; alte Links haben vorhersehbares Verhalten; aktive Encounter-/Kampfentscheidung bleibt genau einmal ausfuehrbar.
- **Verifikationsstatus:** Architektur statisch verifiziert; End-to-End-Neustart **NICHT VERIFIZIERT**.

### SAVE-001 - Autosave-Fehler werden ohne sichtbare Warnung verworfen

- **Bereich:** Save/Load / Fehlerbehandlung
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** S
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Ein fehlgeschlagener Autosave, etwa durch LocalStorage-Quota, privaten Modus oder Serialisierungsfehler, muss erkennbar sein; Spieler duerfen nicht von einer nicht existierenden Sicherung ausgehen.
- **Aktuelles Istverhalten:** Autosave wird verzoegert in LocalStorage geschrieben; Ausnahmen werden abgefangen, aber ohne sichtbare Fehlermeldung oder dauerhaften Fehlerstatus verworfen.
- **Konkrete Abweichung:** Save-Fehler sind fuer Spieler und Host unsichtbar.
- **Beleg:** `src/main.js:396-430`.
- **Auswirkung:** Fortschritt kann nach Reload/Absturz verloren gehen; besonders aktive Encounter-, Supernova- und Controller-Pending-Zustaende sind betroffen.
- **Reproduktionsschritte:** LocalStorage-Schreibzugriff blockieren oder Quota erschoepfen; Spielzustand aendern; UI meldet keinen fehlgeschlagenen Autosave.
- **Empfohlene spaetere Massnahme:** Autosave-Erfolg/-fehler im Hoststatus fuehren, einmalig sichtbar warnen, erneuten Versuch anbieten und manuelles Save nicht als erfolgreich bestaetigen, wenn Schreiben scheitert.
- **Abhaengigkeiten:** Save-UI, Fehlertexte/i18n, optional Speichergroessenmonitoring.
- **Akzeptanzkriterien:** Simulierter `setItem`-Fehler erzeugt klaren Hinweis und keinen falschen Erfolgsstatus; nach Wiederherstellung wird erneut gespeichert; normale Autosaves bleiben unaufdringlich; Classic/Supernova-State ist identisch serialisierbar.
- **Verifikationsstatus:** Fehlerpfad statisch verifiziert; Quota-Test im Browser nicht ausgefuehrt.

### UI-001 - Hauptmenue skaliert auf 4K nicht angemessen mit

- **Bereich:** Hauptmenue / 4K-TV
- **Status:** VISUELL VERBESSERUNGSWÜRDIG
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** S
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Die 16:9-Komposition soll auf 1920 x 1080 und 3840 x 2160 dieselbe visuelle Gewichtung und TV-Lesbarkeit besitzen.
- **Aktuelles Istverhalten:** Stage und Hintergrund fuellen 4K korrekt, Titel, Emblem, Buttongruppe, Icons und Text erreichen jedoch feste `rem`-Obergrenzen. Im 3840-x-2160-Screenshot wirken Kernbedienelemente deutlich kleiner relativ zur Bildflaeche als bei 1080p.
- **Konkrete Abweichung:** Der Hero-Screen nutzt die 4K-Flaeche nicht proportional und ist aus TV-Entfernung weniger praesent/lesbar.
- **Beleg:** `src/space-ui.css:724-733,769-770,783,796,806,821-824,831`; visuelle Laufzeitpruefung bei 1920 x 1080 und 3840 x 2160.
- **Auswirkung:** Qualitaets- und Lesbarkeitseinbruch genau auf dem primaeren 4K-TV-Zielgeraet.
- **Reproduktionsschritte:** Hauptmenue bei 1920 x 1080 und 3840 x 2160 oeffnen; relative Titel-/Buttonhoehe vergleichen.
- **Empfohlene spaetere Massnahme:** Stage-relative Groessen oder auf 4K passende `clamp()`-Obergrenzen verwenden; Fokus-/Touch-/Remote-Flaechen proportional halten; Layoutwerte nicht neu interpretieren.
- **Abhaengigkeiten:** Menue-Layout-JSON/Assetseitenverhaeltnisse und Fire-TV-Screenshottest.
- **Akzeptanzkriterien:** 1080p und 4K besitzen vergleichbare relative Komposition; Titel/Buttons sind aus TV-Entfernung lesbar; nichts clippt; 16:9 bleibt vollflaechig und Smartphone-Landscape wird nicht uebergross.
- **Verifikationsstatus:** Visuell in simulierten Viewports verifiziert; realer 4K-Fire-TV-Screenshot **NICHT VERIFIZIERT**.

### UI-002 - Controller-Panels verdecken den Space-Hintergrund fast vollstaendig

- **Bereich:** Smartphone-Controller / visuelle Konsistenz
- **Status:** VISUELL VERBESSERUNGSWÜRDIG
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** S
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Controller soll denselben Space-/HUD-Stil wie TV nutzen; Hintergrund bleibt sichtbar, waehrend Panels kontrolliert transparent und Texte gut lesbar sind.
- **Aktuelles Istverhalten:** Bei 852 x 393 belegen Header, Tabs und Inhaltsflaechen fast den gesamten Viewport mit dunklen, relativ deckenden Flaechen. Space-Hintergrund ist nur an schmalen Raendern bzw. kleinen Luecken sichtbar.
- **Konkrete Abweichung:** Der Controller wirkt weiterhin wie eine geschlossene dunkelblaue Web-App-Flaeche statt wie das vorgesehene halbtransparente HUD.
- **Beleg:** `src/controller.css:528-538,545+,593,603,630,668`; visuelle Laufzeitpruefung `852 x 393`.
- **Auswirkung:** Stilbruch zwischen Host und Controller; visueller Art-Pass ist auf dem wichtigsten mobilen Viewport kaum wahrnehmbar.
- **Reproduktionsschritte:** Controller im iPhone-aehnlichen Querformat oeffnen; Hintergrundanteil hinter Header/Tabs/Inhalt beurteilen.
- **Empfohlene spaetere Massnahme:** Deckkraft und Flaechenhierarchie gezielt pro Panel reduzieren, Zwischenraeume/Hintergrundfenster schaffen und Lesbarkeit mit lokalem Overlay statt globaler Deckung sichern.
- **Abhaengigkeiten:** Kontrasttest, lange Controllertexte, Browser ohne `backdrop-filter`.
- **Akzeptanzkriterien:** Hintergrund ist im Querformat deutlich wahrnehmbar; Textkontrast bleibt WCAG-tauglich; Tabs/Buttons sind klar; lange Inhalte scrollen nur im vorgesehenen Bereich; Fallback ohne Blur bleibt lesbar.
- **Verifikationsstatus:** Visuell im Chromium-Viewport verifiziert; iOS-/Android-Hardware **NICHT VERIFIZIERT**.

### PERF-001 - Asset-Preloader dekodiert alle grossen Schiff-/Planetenvarianten gleichzeitig

- **Bereich:** Performance / Asset-Laden
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** M
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** QR-Lobby soll notwendige Assets vorwaermen, ohne Fire TV oder Smartphone durch unnoetige Parallel-Dekodierung und RAM-Spitzen zu belasten.
- **Aktuelles Istverhalten:** `getGameAssetUrls` sammelt unter anderem alle 12 Kolonie-, 12 Handels- und 12 Schlachtschiffvarianten sowie grosse Planetenbilder. `preloadGameAssets` startet das Laden/Dekodieren breit parallel. Einzelne PNGs liegen im Bereich von etwa 1,2-2,3 MB; der 4K-Boardhintergrund ist etwa 6,8 MB.
- **Konkrete Abweichung:** Downloadgroesse, dekodierter Bitmap-RAM und gleichzeitige Decode-Arbeit sind nicht auf schwache Fire-TV-Hardware begrenzt oder priorisiert.
- **Beleg:** `src/main.js:471-550`; Assetgroessen unter `public/assets/` und `assets/`; Lobby-Preloadpfad.
- **Auswirkung:** Lange Lobby-Ready-Zeit, Frame-Drops, Speicherbereinigung oder WebView-Absturz sind auf Zielhardware moeglich; dieser Audit hat keinen Langzeit-RAM-Test ausgefuehrt.
- **Reproduktionsschritte:** Cache leeren, QR-Lobby auf Fire TV oeffnen und Speicher/Framezeit waehrend 36 Schiffvarianten plus Planeten beobachten.
- **Empfohlene spaetere Massnahme:** Kritische Assets priorisieren, Decode-Concurrency begrenzen, nur zur Spielerzahl/Farbe/Variante notwendige Varianten vorladen und grosse Rasterassets mit zielgerechten WebP/AVIF-Varianten versehen.
- **Abhaengigkeiten:** Assetmanifest, Cachestrategie `PWA-001`, VFX-Variantenwahl und Hardwareprofiling.
- **Akzeptanzkriterien:** Preload laedt keine im Spiel unerreichbaren Farb-/Variantenkombinationen unnoetig; definierte Speicher-/Zeitbudgets auf Fire TV und Smartphone werden eingehalten; keine sichtbaren Nachladeruckler nach Spielstart.
- **Verifikationsstatus:** URL-Sammlung und Dateigroessen verifiziert; reales Fire-TV-Speicherprofil **NICHT VERIFIZIERT**.

### TEST-001 - Tests decken keine vollstaendige Partie und zentrale Supernova-/Resume-Pfade ab

- **Bereich:** Tests / Verifikationsabdeckung
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** L
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Release-Readiness erfordert automatisierte Nachweise fuer Kernzug, alle Regelvarianten, Encounter-Pending-State, Save/Load, Mehrgeraetefluss und Supernova-Kaempfe/Missionen.
- **Aktuelles Istverhalten:** Struktur- und Game-State-Smokes sowie 7 Chromium-E2E-Tests laufen gruen. E2E deckt Hauptmenue, Lobby, Startbrett, Controllerbasis, Orientation, Remoteweg und Debugseiten ab. Supernova-Tests decken Initialisierung, Nachschub, Fabrikbasis/Mehrheit, Schlachtschiffbau und einen **manuell** markierten Missionssieg ab; keine Schlachtschiffkampfmatrix, keine 25 Missionsbedingungen und kein voller Save/Resume-Encounter.
- **Konkrete Abweichung:** Gruene Tests belegen Seitenstart und Teilregeln, nicht die behauptete vollstaendige Classic-/Supernova-Partie.
- **Beleg:** `scripts/check-game-state.js:1635-1800`; `tests/*.spec.js` bzw. E2E-Ausgabe mit 7 Tests; fehlende Treffer fuer Supernova-Kampffolgen.
- **Auswirkung:** Kritische Fehler wie `ENC-001`, `SN-004` und `SN-005` bleiben trotz gruener Suite bestehen; Regressionen koennen erst am Spielabend auffallen.
- **Reproduktionsschritte:** Testsuite ausfuehren; anschliessend Abdeckung gegen die in diesem Audit genannten Flows vergleichen.
- **Empfohlene spaetere Massnahme:** Regelbasierte Szenariotests in priorisierter Reihenfolge ergaenzen: P0-Encounter, 3-Spieler-Aufbau, Nachschubfrist, alle Missionen, Kampfmatrix, Pending-State Save/Load, Controllerprivacy, Cacheupgrade.
- **Abhaengigkeiten:** Zuerst fachliche Fixes der P0/P1-Befunde; deterministische Wuerfel-/Deckinjektion.
- **Akzeptanzkriterien:** Mindestens eine vollstaendige Classic- und Supernova-Szenariokette ist automatisiert; alle P0/P1-Akzeptanzkriterien besitzen Regressionstests; reale Controllerpayloads und Save/Resume werden geprueft.
- **Verifikationsstatus:** Vorhandene Testdateien und ausgefuehrte Suite vollstaendig verifiziert; reale Hardwaretests **NICHT VERIFIZIERT**.

### FIRE-001 - Fire-TV-Wrapper bleibt mit Debugging, Mixed Content und LAN-Default gehaertet unvollstaendig

- **Bereich:** Fire-TV-Wrapper / Sicherheit und Betrieb
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P2 - Wichtig
- **Aufwand:** S
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Produktionswrapper haelt Bildschirm wach und unterstuetzt Remote, sollte aber Debugzugriff und unnoetig permissive WebView-Einstellungen vermeiden; private Ziel-URL bleibt als lokale Preference, nicht als produktionsnaher Codewert.
- **Aktuelles Istverhalten:** Keep-awake/Fullscreen und DPAD-Weitergabe sind vorhanden. WebView-Debugging ist dauerhaft aktiv, Mixed Content wird immer erlaubt, und ein privater LAN-Default/Placeholder steht im Activity-Code. Cache ist deaktiviert, obwohl die Web-App eigenes Caching besitzt.
- **Konkrete Abweichung:** Der Wrapper ist funktional, aber nicht als gehartete Releasekonfiguration getrennt; permissive Einstellungen und Debugzugriff bleiben aktiv.
- **Beleg:** `fire-tv-wrapper/app/src/main/java/de/derdruckpilot/starodyssey/tv/MainActivity.java:31,46-49,87,93,97,103,325-353`.
- **Auswirkung:** Unnoetige Angriffs-/Debugoberflaeche im LAN, schwer vorhersehbares Cacheverhalten und potenzielle Abhaengigkeit von lokalem Default. Kein Absturz wurde beobachtet.
- **Reproduktionsschritte:** Debug-APK starten, WebView-Debugtargets und Mixed-Content-Einstellung pruefen; Preference ohne gespeicherte URL betrachten.
- **Empfohlene spaetere Massnahme:** Debugging an BuildConfig koppeln, Mixed Content nur bei nachgewiesenem Bedarf erlauben, URL-Default neutral halten und Cachepolitik mit PWA/Server abstimmen.
- **Abhaengigkeiten:** HTTPS-/PWA-Strategie `PWA-002`, lokaler URL-Setupflow und Debug-/Release-Buildtypen.
- **Akzeptanzkriterien:** Releasebuild hat kein WebView-Debugging; URL kommt aus Preference/neutralem Setup; Mixed Content ist begruendet/minimal; Keep-awake, Fullscreen und Remote funktionieren unveraendert; APK-Hardwaretest besteht.
- **Verifikationsstatus:** Java-Konfiguration statisch verifiziert; APK wurde in diesem Audit nicht gebaut/installiert, Fire-TV-Hardware **NICHT VERIFIZIERT**.

## 10. Offene P3-Befunde

### STATE-001 - Struktur-Normalisierung kann bei leerer Liste Legacy-Startstrukturen erzeugen

- **Bereich:** Game State / Migration
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P3 - Polish
- **Aufwand:** XS
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Normalisierung darf nur fehlende Felder alter Saves migrieren und keinen gueltigen spaeteren Zustand aufgrund einer leeren Liste als uninitialisiert interpretieren.
- **Aktuelles Istverhalten:** `normalizeStructures` greift bei fehlenden bzw. leeren Strukturen auf `createStartingStructures` zurueck. Damit ist "alte Save-Struktur fehlt" nicht sauber von "gueltiger Zustand enthaelt aktuell keine Strukturen" getrennt.
- **Konkrete Abweichung:** In einem theoretisch gueltigen Null-Strukturen-Zustand koennen beim Laden Startbauteile synthetisiert werden.
- **Beleg:** `src/game/gameState.js:5654-5679`; Legacy-Helfer `:5598+`.
- **Auswirkung:** Niedriges, aber reales Migrationsrisiko fuer Spezial-/Debug-/zukuenftige Zustaende; derzeitige normale Partien besitzen praktisch immer Strukturen.
- **Reproduktionsschritte:** Einen ansonsten gueltigen Save mit explizit leerem `structures` normalisieren und Ergebnis vergleichen.
- **Empfohlene spaetere Massnahme:** Schema-/Versionsmerkmal verwenden und nur bei wirklich fehlendem Legacy-Feld migrieren; explizit leere Arrays erhalten.
- **Abhaengigkeiten:** Save-Schemaversion und Alt-Save-Fixtures.
- **Akzeptanzkriterien:** Fehlendes Legacy-Feld migriert; explizit leere moderne Liste bleibt leer; normale Saves laden unveraendert.
- **Verifikationsstatus:** Statisch verifiziert; produktiver Null-Strukturen-Fall nicht beobachtet.

### UI-003 - Hauptmenue nutzt Unicode-Symbole statt der vorhandenen Icon-Familie

- **Bereich:** Hauptmenue / Icons
- **Status:** VISUELL VERBESSERUNGSWÜRDIG
- **Prioritaet:** P3 - Polish
- **Aufwand:** XS
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Die vier Hauptaktionen sollen dieselbe hochaufgeloeste, konsistente Icon-/Rahmensprache wie die Asset-Komposition verwenden.
- **Aktuelles Istverhalten:** Das echte Hauptmenue rendert Unicode-/Textsymbole fuer Neu, Laden, Beenden und Einstellungen, obwohl verarbeitete PNG-Icons und Buttonkompositionen im Projekt liegen.
- **Konkrete Abweichung:** Symbolform, Strichstaerke und Plattformrendering koennen zwischen TV/Browser variieren und brechen leicht die ornamentale Designfamilie.
- **Beleg:** `src/main.js:1779-1800`; Menueassets unter `public/assets/ui/menu/processed/icons/`.
- **Auswirkung:** Kleiner, aber sichtbarer Qualitaetsunterschied und potenziell abweichende Glyphen auf Fire-TV-WebView.
- **Reproduktionsschritte:** Hauptmenue auf unterschiedlichen Browser-/OS-Fonts vergleichen.
- **Empfohlene spaetere Massnahme:** Vorhandene freigestellte Iconassets oder eine einheitliche lokale Iconquelle in den echten Buttons verwenden; Text/ARIA getrennt erhalten.
- **Abhaengigkeiten:** Assetqualitaet und Preloader.
- **Akzeptanzkriterien:** Alle vier Icons stammen aus derselben Designfamilie, sind auf 1080p/4K scharf, laden ohne Flackern und besitzen zugreifbare Beschriftungen.
- **Verifikationsstatus:** Statisch und visuell verifiziert.

### TECH-001 - Produktionspfade enthalten verbleibende Debug-Logs

- **Bereich:** Technische Qualitaet / Konsole
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P3 - Polish
- **Aufwand:** XS
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Produktionskonsole soll nur relevante Warnungen/Fehler enthalten und keine dauerhaften Eingabe-/Platzierungsdetails ausgeben.
- **Aktuelles Istverhalten:** Controller- und Hostcode enthalten direkte Debug-`console`-Ausgaben fuer Verbindungs-/Interaktions- bzw. Platzierungsdaten.
- **Konkrete Abweichung:** Debugausgaben sind nicht an einen Debugmodus gekoppelt.
- **Beleg:** `src/controller.js:2183,2304`; `src/main.js:8474-8480`.
- **Auswirkung:** Unnoetige Konsole, moegliche Offenlegung lokaler Zustandsdetails und erschwerte Fehlersuche. Im geprueften Standardpfad trat kein Spam auf.
- **Reproduktionsschritte:** Entsprechende Controller-/Platzierungsaktion ausloesen und Browserkonsole beobachten.
- **Empfohlene spaetere Massnahme:** Entfernen oder hinter explizites Debugflag legen; echte Fehler/Warnungen beibehalten.
- **Abhaengigkeiten:** Keine.
- **Akzeptanzkriterien:** Normale Partie erzeugt keine Debuglogs; Fehler bleiben diagnostizierbar; Debugseiten koennen bei Bedarf explizit loggen.
- **Verifikationsstatus:** Statisch verifiziert.

### ASSET-001 - Alte Raw-/Legacy-Menueassets bleiben unbereinigt im Webbestand

- **Bereich:** Assets / Wartbarkeit und Downloadhygiene
- **Status:** VISUELL VERBESSERUNGSWÜRDIG
- **Prioritaet:** P3 - Polish
- **Aufwand:** S
- **Betroffene Spielvariante:** ausserhalb des Spiels/UI
- **Quelle bzw. Sollverhalten:** Release-Assetbestand soll verwendete, sauber benannte und weboptimierte Varianten enthalten; Rohbilder/alte Hero-PNGs gehoeren nicht unnoetig in den auslieferbaren `public`-Baum.
- **Aktuelles Istverhalten:** 27 JPEG-Rohreferenzen und mehrere schwere fruehere Menuevarianten liegen neben den aktuellen WebP-/Processed-Assets. Der aktive Hauptmenuepfad nutzt nur einen Teil davon.
- **Konkrete Abweichung:** Assetfamilie enthaelt schwer unterscheidbare Roh-, Zwischen- und Produktionsvarianten; versehentliche Referenz/Preload und Repository-/Deploymentballast sind moeglich.
- **Beleg:** `public/assets/ui/menu/raw/`; `public/assets/ui/menu/processed/`; aktive Referenzen `src/main.js:126-132`.
- **Auswirkung:** Wartungsrisiko, unklare Source-of-Truth und unnoetige Deploymentgroesse; aktuell keine sichtbare Fehlreferenz im Browser festgestellt.
- **Reproduktionsschritte:** Menue-Assetordner mit aktiven Importen/Manifest vergleichen.
- **Empfohlene spaetere Massnahme:** Nach Lizenz-/Reproduzierbarkeitspruefung Rohquellen ausserhalb des Webroots archivieren, aktive Produktionsassets manifestieren und ungenutzte Zwischenvarianten entfernen.
- **Abhaengigkeiten:** Assetmanifest und Reproduktionsskripte.
- **Akzeptanzkriterien:** Jeder ausgelieferte Menueassetpfad hat einen aktiven Verbraucher oder begruendeten Fallback; Rohquellen werden nicht vom Webserver ausgeliefert; keine Referenz bricht.
- **Verifikationsstatus:** Dateibestand und aktive Hauptreferenzen verifiziert; vollstaendige Bundlegroessenanalyse nicht ausgefuehrt.

## 11. Optionale P4-Verbesserungen

### SN-006 - Optionale Supernova-Profivariante mit zwei Missionen fehlt

- **Bereich:** Supernova / Setupoption
- **Status:** FEHLT
- **Prioritaet:** P4 - Optional
- **Aufwand:** S
- **Betroffene Spielvariante:** Supernova
- **Quelle bzw. Sollverhalten:** Das Supernova-Regelwerk beschreibt optional eine Profivariante mit nur zwei statt drei Missionen.
- **Aktuelles Istverhalten:** Supernova weist immer drei verschiedenfarbige Missionen zu; es gibt keine Setupoption oder gespeicherte Missionsanzahl.
- **Konkrete Abweichung:** Optionaler Regelmodus ist nicht verfuegbar; die normale Supernova-Variante ist davon nicht blockiert.
- **Beleg:** `src/game/gameState.js:2779-2811`; Setup `src/main.js:1901-1951`.
- **Auswirkung:** Erfahrene Gruppen koennen die optionale Variante nicht digital auswaehlen.
- **Reproduktionsschritte:** Supernova-Setup oeffnen; keine Profivariantenoption vorhanden.
- **Empfohlene spaetere Massnahme:** Nach Abschluss aller Missionsbedingungen eine explizite Setupoption mit persistierter Missionsanzahl ergaenzen.
- **Abhaengigkeiten:** `SN-001`, Setup-UI, Save-Migration.
- **Akzeptanzkriterien:** Option ist klar als Profi/optional bezeichnet; zieht zwei verschiedene Kategorien; Sieg-/Privacy-/Save-Logik funktioniert; Default bleibt drei.
- **Verifikationsstatus:** Vollstaendig verifiziert.

### AUDIO-001 - Kein zusammenhaengendes Audio- und Lautstaerkesystem vorhanden

- **Bereich:** Audio / Final Polish
- **Status:** FEHLT
- **Prioritaet:** P4 - Optional
- **Aufwand:** L
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Audio ist keine Brettspielregel, kann fuer ein final gepolishtes digitales Spiel aber Menue-, Wuerfel-, Ressourcen-, Schiffs-, Waffen- und Siegfeedback liefern; mit Lautstaerke/Stumm und Browser-Autoplay-Regeln.
- **Aktuelles Istverhalten:** Im geprueften aktiven Code/Assetpfad wurde kein zusammenhaengendes Audioabspiel-, Lautstaerke- oder Mutesystem gefunden.
- **Konkrete Abweichung:** Visuelle Aktionen besitzen kein akustisches Feedback; dies ist eine Polish-Luecke, kein Regel- oder Spielfunktionsfehler.
- **Beleg:** Suche in aktiven `src/`, HTML und Assetmanifesten ohne Audioengine/-controls.
- **Auswirkung:** Weniger Feedback und Atmosphaere auf TV; kein Einfluss auf Regelkorrektheit.
- **Reproduktionsschritte:** Menue, Wurf, Produktion, Bewegung und Kampf ausloesen; kein Audio-/Lautstaerkepfad vorhanden.
- **Empfohlene spaetere Massnahme:** Optionales, zentral priorisiertes Audiosystem mit lizenzierten/originalen Assets, Nutzerinteraktions-Unlock, Lautstaerke und Mute planen.
- **Abhaengigkeiten:** Assetlizenzierung, Settings-UI, Fire-TV-/Mobile-Autoplay.
- **Akzeptanzkriterien:** Falls umgesetzt: wichtige Aktionen haben dezentes Feedback; Lautstaerke/Mute persistieren; keine Autoplayfehler; Spiel bleibt vollstaendig ohne Ton bedienbar.
- **Verifikationsstatus:** Statisch verifiziert; bewusst als optional bewertet.

### OPS-001 - Spielstaende sind ausschliesslich an den Hostbrowser gebunden

- **Bereich:** Betrieb / Save-Portabilitaet
- **Status:** TECHNISCH RISKANT
- **Prioritaet:** P4 - Optional
- **Aufwand:** L
- **Betroffene Spielvariante:** beide
- **Quelle bzw. Sollverhalten:** Nicht regelnotwendig, aber fuer robusten Spielabend waere ein exportierbarer/portabler Save oder kontrolliertes Backup hilfreich.
- **Aktuelles Istverhalten:** Saves und Autosave liegen in LocalStorage des Hostbrowsers. Der Relay-Server persistiert nichts; Browserdatenloeschung, Profilwechsel oder Hostwechsel verlieren den Stand.
- **Konkrete Abweichung:** Keine geraeteuebergreifende oder dateibasierte Wiederherstellung. Dies ist eine bewusste statische-Web-App-Grenze, aber nicht explizit als Produktgrenze kommuniziert.
- **Beleg:** Savepfade in `src/main.js`; In-Memory-Relay `tools/tv-server.mjs:26-38`.
- **Auswirkung:** Optionaler Komfort-/Resilienzverlust, kein unmittelbarer Regelblocker.
- **Reproduktionsschritte:** Save in Browserprofil A anlegen und in Profil/Geraet B oeffnen.
- **Empfohlene spaetere Massnahme:** Optional JSON-Export/Import mit Schemaversion und Validierung oder klar dokumentiertes Backup anbieten; kein Backend ist zwingend.
- **Abhaengigkeiten:** Save-Schema, Datenschutz, Migrationen.
- **Akzeptanzkriterien:** Falls umgesetzt: Export/Import erhaelt Classic/Supernova/Pending-State, lehnt ungueltige Versionen sicher ab und veraendert lokale URL-/Wrapper-Preferences nicht.
- **Verifikationsstatus:** Architektur vollstaendig verifiziert; bewusst optional.

## 12. Visueller Asset-Audit

| Bereich | Beobachtung | Bewertung | Zugeordnete IDs |
|---|---|---|---|
| Hauptmenue | Bei 1920 x 1080 zusammenhaengender Hero-Screen, ein einzelner Titel, scharfer Hintergrund/Rahmen und vier klar fokussierbare Buttons. Bei 4K bleiben Titel und Controls relativ zu klein. | 1080p UMGESETZT; 4K VISUELL VERBESSERUNGSWÜRDIG | `UI-001`, `UI-003`, `PWA-001` |
| Untermenues/Setup | Neues-Spiel-Setup verwendet denselben Space-/Gold-/Cyan-Stil; Auswahl, Fokus, Zurueck/Weiter sind klar. Zentrale Flaeche ist stark abgedunkelt, aber lesbar. | UMGESETZT im geprueften Browserpfad | `UI-001` fuer 4K-Hardwarewirkung |
| QR-Lobby | Spieler-Cards, Farben, Status und QR-Flaechen sind gut lesbar. In der Nachpruefung waren beide QR-Codes nach dem asynchronen Rendern vollstaendig geladen. | UMGESETZT im Browser; reales TV-Scanning NICHT VERIFIZIERT | `TEST-001`, `FIRE-001` |
| Controller | Keine kaputten Bilder oder Viewport-Ueberlaeufe bei 852 x 393; Drehhinweis bei 393 x 852 korrekt. Dunkle Panels verdecken den Hintergrund fast vollstaendig. | VISUELL VERBESSERUNGSWÜRDIG | `UI-002`, `CTRL-001` |
| Spielfeld | Frisches Startbrett lud alle 12 Startplaneten ohne beobachtete Assetfehler; Linien, Punkte und Chips wirkten im simulierten 1080p-Viewport scharf. Ein dicht belegtes spaetes Brett wurde nicht erzeugt. | TEILWEISE UMGESETZT / NICHT VERIFIZIERT fuer volle Partie | `TEST-001`, `PERF-001` |
| Kolonieschiffe | 12 Asset-/VFX-Zuordnungen (4 Farben x 3 Varianten) vorhanden; normales Rendering greift auf den Schiffstyp zu. Nicht jede Variante wurde im realen Spiel einzeln visuell geprueft. | TEILWEISE UMGESETZT | `TEST-001` |
| Handelsschiffe | 12 getrennte Asset-/VFX-Zuordnungen vorhanden; keine Vermischung mit Kolonieschiffdaten gefunden. Vollsatz nicht visuell durchgespielt. | TEILWEISE UMGESETZT | `TEST-001`, `PERF-001` |
| Schlachtschiffe | 12 freigestellte Varianten, VFX-Anker, Engine-/Shot-Daten und Renderer-Auswahl vorhanden. Regelkampf ist fehlerhaft; dadurch ist die reale Waffen-/Kampfinszenierung nicht releaseverifiziert. | TEILWEISE UMGESETZT | `SN-004`, `SN-005`, `TEST-001` |
| Planeten/Systeme | Start- und Wild-Space-Daten vollstaendig; initiale Bilder geladen. Grosse Rasterdateien erhoehen Speicherlast. | UMGESETZT, Performance TECHNISCH RISKANT | `PERF-001` |
| Karten | Encounter-, Freundschafts- und Missionsdaten vorhanden; Texte werden als UI-Text gerendert. Missionsregeltext M06 und mehrere Flows sind fachlich offen. | TEILWEISE UMGESETZT | `SN-001`, `ENC-001` bis `ENC-004` |
| Blaupausen | Mutterschiff-/Schiffs-/Supernova-Assets und Baumenuepfade sind vorhanden; nicht alle Blaupausen wurden in jeder Farbe/Variante und auf Mobil visuell geprueft. | NICHT VERIFIZIERT als Vollsatz | `TEST-001` |
| Icons | Ressourcen-/Spielicons vorhanden; Hauptmenue nutzt weiterhin Unicode-Symbole statt der verarbeiteten Iconfamilie. | VISUELL VERBESSERUNGSWÜRDIG | `UI-003` |
| Rahmen/Ornamente | Hauptmenue, Setup und Lobby wirken im 1080p-Screenshot verwandt; keine sichtbaren weissen Saeume im aktiven Pfad. Raw-/Legacyvarianten bleiben im Webbestand. | UMGESETZT mit Assethygiene-Restpunkt | `ASSET-001` |

### Assetpfade und Aufloesung

- Der statische Referenzscan fand keine konkrete fehlende Datei in den aktiven, literal aufloesbaren Assetpfaden. Treffer mit `${color}` waren Templatepfade und keine fehlenden Dateien.
- Aktive Hauptmenue-Hero-/Interface-WebP-Dateien sind gegenueber den alten PNG-Zwischenstaenden sinnvoll komprimiert.
- Mehrere Planeten- und Schiff-PNGs sind einzeln gross; die Summe ist wegen des globalen Preloads relevant (`PERF-001`).
- Sichtbare Alpha-/Halo-Fehler wurden in den geprueften Hauptmenue-, Setup-, Lobby- und Startbrett-Screenshots nicht beobachtet. Eine Pixelkante-Analyse jedes Assets wurde nicht durchgefuehrt.

## 13. Animationen- und VFX-Audit

### Allgemeine Animationen

| Animation | Implementierungs-/Laufzeitstatus | Restunsicherheit / IDs |
|---|---|---|
| Menuefokus/Hover | Browser- und E2E-Pfad funktionieren; sichtbarer Fokus vorhanden | reale Fire-TV-DPAD-Latenz `FIRE-001`, `TEST-001` |
| Wuerfel/Produktion | Produktions-VFX und Staffelungslogik vorhanden; Start-/Smoke-Pfade ohne Fehler | komplette Mehrplanetenwelle auf Fire TV nicht gemessen; `PERF-001`, `TEST-001` |
| System-/Zahlenchip-Aufdeckung | Render-/Statepfade vorhanden | spaetes volles Brett nicht visuell verifiziert; `TEST-001` |
| Schiffsbewegung/Flamme | VFX-Layer und Bewegungszustand vorhanden | alle Schiffstypen/Rotationen auf Hardware nicht verifiziert; `TEST-001` |
| Encounter-Mutterschiff | Dualwuerfe und reine Antriebsvergleichsvorschau besitzen eigene Zustaende | Hehlerei-Einzelwurf umgeht Animation; `ENC-002` |
| Schlachtschiffkampf | Waffenburst kann vom Kampftrigger gequeued werden | Regel-/Interaktionspfad fehlerhaft; `SN-004`, `SN-005` |
| Sieg/Fehlerfeedback | UI-/Statuspfade vorhanden | vollstaendiges Spielende nicht E2E gespielt; `TEST-001` |

### Schiffs-VFX-Daten und normaler Renderer

- `src/data/shipVfxData.js:35-63` trennt `colonyShips`, `tradeShips` und `battleShips`.
- `src/data/battleShipVfxData.js` enthaelt alle 12 Schlachtschiffvarianten mit 1/2/3 Spulen, Triebwerk und zwei Plasma-Schussankern.
- `src/main.js:6061-6073` waehlt die VFX-Daten im normalen Spiel nach Schiffstyp/Farbe/Variante.
- Spulen werden im normalen Rendering ueber `src/main.js:7092-7166` gezeichnet; Engines/Trails/Bursts ueber `:5133-5176`; Schlachtschiff-Waffenbursts ueber `:5829-5937`.
- Die Debugseite bietet eine explizite Schussvorschau sowie Laser, Plasma und Raketen. Laengen bis 2000 und passende Dauer-/Geschwindigkeitsfelder sind im Debugpfad vorhanden (`debug-ship-vfx.html`; `src/debug-ship-vfx.js`).
- `prefers-reduced-motion` ist in Menue-/Controller-CSS vorhanden. Eine systemweite Pruefung jeder Spielanimation unter reduziertem Bewegungsmodus ist **NICHT VERIFIZIERT**.

### Schlachtschiff-VFX: 12er-Matrix

| Farbe | Variante 1 | Variante 2 | Variante 3 | Normaler Renderer | Visuell im echten Kampf |
|---|---|---|---|---|---|
| Rot | Daten vorhanden, 1 Spule | Daten vorhanden, 2 Spulen | Daten vorhanden, 3 Spulen | angebunden | NICHT VERIFIZIERT |
| Blau | Daten vorhanden, 1 Spule | Daten vorhanden, 2 Spulen | Daten vorhanden, 3 Spulen | angebunden | NICHT VERIFIZIERT |
| Gelb | Daten vorhanden, 1 Spule | Daten vorhanden, 2 Spulen | Daten vorhanden, 3 Spulen | angebunden | NICHT VERIFIZIERT |
| Gruen | Daten vorhanden, 1 Spule | Daten vorhanden, 2 Spulen | Daten vorhanden, 3 Spulen | angebunden | NICHT VERIFIZIERT |

Die Datenvollstaendigkeit ist belegt; eine sichtbare Validierung aller 12 Kombinationen bei Stand, Bewegung, Rotation und Waffenfeuer im normalen Spiel fehlt (`TEST-001`). Durch `SN-004`/`SN-005` kann der normale Kampfpfad derzeit ohnehin nicht als fachlich abgenommen gelten.

### VFX-Performance

- Keine endlos wachsende Partikelliste wurde im statischen Pfad festgestellt; kurzlebige Trails/Bursts besitzen Ablaufdaten.
- Im kurzen Chromium-Smoke wurden keine Konsolenfehler oder sichtbaren leeren Canvas-Layer beobachtet.
- Langzeit-Frametime, WebView-GPU-RAM und viele gleichzeitige Produktions-/Waffenpartikel auf Fire TV wurden **NICHT VERIFIZIERT** (`PERF-001`, `TEST-001`).

## 14. Controller-, Fire-TV- und PWA-Audit

### Controller-Tabs

| Tab | Funktionaler Pfad | Auditbewertung |
|---|---|---|
| Zug | Phasen-/Aktionsstatus, Encounteraktionen | TEILWEISE UMGESETZT wegen Encounter-/Kampfrestpunkten |
| Handeln | Ressourcen-/Handelsaktionen | UMGESETZT im statischen/Smoke-Umfang; Vollpartie nicht verifiziert |
| Mutterschiff | Ausbauten, Werte, Sonderwuerfe | UMGESETZT; Hehlerei-Ausloesung `ENC-002` |
| Bauen | Classic- und Supernova-Aktionen variantengesteuert | TEILWEISE UMGESETZT; Fabriken `SN-003`, Schlachtschiffkampf spaeter `SN-004`/`SN-005` |
| Aussenposten | Freundschaft/Mehrheiten | UMGESETZT im Smoke-Umfang |
| Uebersicht | Spieler-/Punkteinformationen | Private Payloads zu breit `SN-002` |
| Spielfeld | Pan/Zoom, Schiffs-/Zielauswahl | Grundpfad vorhanden; volle Randfallmatrix nicht verifiziert `TEST-001` |

### Mehrgeraetefluss

- QR-Erzeugung, lokale Testlinks, mehrere Spielerslots und Controller-Grundverbindung sind implementiert und im Chromium-E2E abgedeckt.
- Controlleraktionen werden hostseitig gegen den Game State validiert; die Uebertragung enthaelt jedoch zu viele fremde Daten (`SN-002`).
- Doppelverbindung/Reconnect besitzt keinen verbindungsspezifischen Berechtigungsnachweis (`NET-001`).
- Relay-Neustart verliert Sessions (`NET-002`).
- Netzwerkunterbrechung waehrend Encounter-/Kampf-Pending und mehrere Tabs auf demselben realen Smartphone sind **NICHT VERIFIZIERT** (`TEST-001`).

### Fire-TV-Remote

- Wrapper setzt Fullscreen und `FLAG_KEEP_SCREEN_ON` und reicht DPAD/Enter/Back an die WebView weiter.
- Webcode besitzt zentrales Keyboard-/Remote-Fokusmanagement; Chromium-E2E navigierte mit Pfeilen/Enter vom Hauptmenue ueber Setup bis zur QR-Lobby ohne Maus.
- Tatsachliche Keycodes, Fokus nach Android-Back, Fernbedienung in Dialogen und Langzeitbetrieb wurden nicht auf dem genannten Fire TV geprueft (`FIRE-001`, `TEST-001`).

### PWA/Mobile

- Manifest enthaelt `standalone`, Landscape, Icons, Start-URL und Scope.
- Apple-Metadaten, `viewport-fit=cover`, Safe-Area-Nutzung, `100dvh`/VisualViewport, Fullscreen-Featurecheck und einmaliger iOS-Home-Screen-Hinweis sind vorhanden.
- Sessionparameter werden beim PWA-Launcher ueber gespeicherte Controller-URL wiederhergestellt.
- Portrait zeigt im Browser-Smoke den Drehhinweis; Landscape nutzt den verfuegbaren Viewport ohne Ganzseitenueberlauf.
- Offene Betriebsprobleme: unsicherer HTTP-Kontext (`PWA-002`) und stale Assetcache (`PWA-001`).

## 15. Save-/Load- und Zustands-Audit

### Nachweislich normalisierte/persistierte Bereiche

- `gameVariant` mit Classic-Fallback fuer aeltere Saves.
- Aktive Phase, aktiver Spieler, Brett, Decks, Ressourcen, Strukturen und Schiffe.
- Aktive Begegnung, Pending-Entscheidungen, passive Aktionen, dualer Mutterschiffwurf und reine Antriebsvergleichsvorschau.
- Supernova-Missionen/-Erfuellungsstatus, Fabriken, Mehrheitskarten, Schlachtschiffe und gesperrte Schiffe.
- Pending-Handelsschiffgeschenke und blockierte Schiffe.

Beleg: `src/game/gameState.js:2515-2636,2814-2851,3149+` sowie die jeweiligen Normalisierer.

### Offene Risiken

1. Autosave-Schreibfehler sind unsichtbar (`SAVE-001`).
2. Relay-Verbindungszustand ist nicht Teil des Saves (`NET-002`).
3. Ein leerer moderner Strukturzustand kann als Legacyzustand fehlinterpretiert werden (`STATE-001`).
4. Save/Load mitten in `ENC-001`, jedem Schlachtschiffkampf, Karten 31/32, Fabrikmehrheitswechsel und mehreren passiven Controlleraktionen ist nicht automatisiert abgedeckt (`TEST-001`).
5. Browser-/Geraetewechsel besitzt keinen Saveexport (`OPS-001`, optional).

### Zustandsuebergaenge

- Normale Phasenmaschine und Controller-Gating sind vorhanden.
- Encounter-Dualwuerfe und Antriebsvergleich besitzen persistierte Zwischenzustaende.
- Supernova-Schlachtschiffkampf besitzt keinen entsprechenden interaktiven Zustand (`SN-004`).
- Bei schnell wiederholten Eingaben validiert der Host viele Aktionen erneut; eine systematische Double-Submit-/Race-Condition-Suite fehlt (`TEST-001`).

## 16. Lokalisierungs- und Text-Audit

- DE/EN-i18n ist fuer Host-/Menuebereiche breit vorhanden.
- Der automatische Schluesselvergleich ergab 443 deutsche und 440 englische Schluessel. In EN fehlen `logBattleShipBuilt`, `logSupernovaFactoryBuilt` und `logSupernovaBattleResolved` (`CTRL-001`).
- Direkte deutsche Controller-Literale verhindern vollstaendige Umschaltung (`CTRL-001`).
- Die festgelegte Bezeichnung **halbe Medaille** wird im geprueften Supernova-/Encounter-State statt RR/Ruhmesring verwendet.
- Fabriknamen verwenden `Nahrungsfabrik`; die Quelle nennt auch Farm/Treibstoff-Farm als missverstaendliche Varianten. Die aktuelle Benennung ist als bewusste Klarstellung vertretbar, sollte aber in einem versionierten Glossar festgehalten werden (`DOC-001`).
- Mission M06 gibt die Quellanforderung "je eine Kolonie" nicht exakt wieder (`SN-001`).
- Encounter-Markdowns sind als fachliche Quelle vorhanden; die vier gefundenen Flowabweichungen sind `ENC-001` bis `ENC-004`.
- Fest in aktiven Menuehintergruenden eingebrannte Bedienungstexte wurden nicht gefunden; Buttons/Titel bleiben HTML-Text.

## 17. Testabdeckung und nicht verifizierte Bereiche

### Ausgefuehrte Checks

| Check | Ergebnis | Aussagekraft |
|---|---|---|
| `npm run check` | PASS | Syntax/Projektcheck bestanden |
| `npm test` | PASS | `Project structure check passed`; `Game state check passed` |
| `npm run test:e2e` | PASS, 7 Chromium-Tests in ca. 20,3 s | Hauptmenue, Lobby/Start, Controllerbasis, 16:9/Portrait, Remoteweg, Debugseiten |
| `git diff --check` | PASS vor Audit-Erstellung | Keine vorbestehenden Whitespacefehler |
| Statischer Assetpfad-Scan | PASS fuer konkrete Literalpfade | Keine fehlenden aktiven Dateien; Templatepfade separat bewertet |
| Browser-Smoke auf bestehendem lokalen Server | PASS | Keine beobachteten Konsolenwarnungen/-fehler oder kaputten Bilder in den geprueften Seiten |

### Gepruefte Viewports/Oberflaechen

- Hauptmenue: 1920 x 1080 und 3840 x 2160 simuliert.
- Spielsetup: 1920 x 1080.
- QR-Lobby: 1920 x 1080; QR-Bilder nach asynchronem Laden vorhanden.
- Controller: ca. 852 x 393 Landscape und 393 x 852 Portrait.
- Startbrett: frisches Spiel, initiale Planetenassets.
- Schiffs-VFX-Debugseite: Grundseite/Preview geladen.

### Nicht verifiziert

- Vollstaendige Classic-Partie von Aufbau bis Sieger mit 3 und 4 Spielern.
- Vollstaendige Supernova-Partie mit realer Missionspruefung, fuenf Fabriktypen und allen drei Kampfarten.
- Alle 32 Encounter als komplette Controller-/Host-/Save-Resume-Pfade.
- Alle 12 Varianten je Schiffstyp im normalen Spiel bei Stand, Bewegung, Rotation und VFX.
- Spaetes, dicht belegtes Brett mit Pan/Zoom und allen Overlays.
- Fire-TV-Hardware: DPAD/Back, 4K-Skalierung, Keep-awake-Langzeitlauf, Framezeit/RAM.
- Reale iOS-/Android-PWA-Installation, Safe Areas/Dynamic Island, Browserleisten und Fullscreen.
- Netzwerkabbrueche, zwei Tabs/Geraete fuer denselben Spieler und Relay-Neustart.
- LocalStorage-Quota-/Korruptionsfall und Migration einer breiten Alt-Save-Stichprobe.

Diese Luecken sind nicht als automatischer Fehler gewertet; wo sie ein relevantes Release-Risiko erzeugen, sind sie in `TEST-001`, `PERF-001`, `NET-002`, `PWA-002` oder `FIRE-001` konkretisiert.

## 18. Empfohlene spaetere Umsetzungsreihenfolge

Noch keine Umsetzung; die Reihenfolge minimiert Regel-/State-Rueckarbeit.

1. **Blocker**
   - `ENC-001`: Null-Optionen-Fallback fuer Ausbau-Belohnung inklusive Save/Load-Test.

2. **Classic-Regelkorrekturen**
   - `CLS-001`: Produktentscheidung fuer 2-Spieler-Modus treffen.
   - `CLS-002`: 3-Spieler-Neutralaufbau und Zwei-Kolonien-Grenze.
   - `CLS-003`: Nachschubanspruch bis zum normalen Mutterschiffwurf.
   - `ENC-002`, `ENC-003`, `ENC-004`: Encounter-Wurf, physische Frachtwertung und Zahn-der-Zeit-Phasen.

3. **Supernova-Vervollstaendigung**
   - `SN-001`: Alle 25 Missionsbedingungen und exakte Texte.
   - `SN-003`: Fabrikbestand und Brettdarstellung.
   - `SN-004`: Interaktiver, persistierter Schlachtschiffkampf.
   - `SN-005`: Drei getrennte Kampffolgen, Entscheidungen und Positionen.

4. **State, Save/Load und Privatsphaere**
   - `SN-002`: Player-spezifische Controllerpayloads.
   - `NET-001`, `NET-002`: Controllerberechtigung und Restore-Handshake.
   - `SAVE-001`, `STATE-001`: sichtbare Speicherfehler und eindeutige Migration.

5. **Controller, Fire TV und PWA**
   - `PWA-001`: Cacheversionierung zuerst, damit weitere UI-Fixes sicher ausgeliefert werden.
   - `PWA-002`: realer sicherer PWA-Betrieb.
   - `FIRE-001`: Release-Wrapper haerten und auf Hardware testen.
   - `CTRL-001`: Controllertexte vollstaendig lokalisieren.

6. **Performance und Assets**
   - `PERF-001`: priorisierter, begrenzter Preload und Hardwareprofiling.
   - `ASSET-001`: danach ungenutzte Webassets bereinigen.

7. **Finales UI-/VFX-Polishing**
   - `UI-001`: 4K-Skalierung.
   - `UI-002`: Controller-Flaechenhierarchie/Transparenz.
   - `UI-003`: konsistente Menueicons.
   - Vollstaendige 12er-Schiffs-/VFX-Sichtpruefung im Rahmen von `TEST-001`.

8. **Test- und Release-Gate**
   - `TEST-001`: Szenariotests parallel zu jedem obigen Fix, abschliessend reale 3-/4-Spieler-Classic- und Supernova-Testpartie.
   - `DOC-001`: Quellenindex und aktuelle Dokumentationskennzeichnung vor Release einfrieren.
   - `TECH-001`: Debuglogs entfernen.

9. **Optionale Erweiterungen nach Release-Reife**
   - `SN-006`: Profivariantenoption.
   - `AUDIO-001`: Audiosystem.
   - `OPS-001`: Saveexport/-import.

## 19. Release-Readiness-Checkliste

Legende: `[x]` sicher erfuellt, `[ ]` offen, `[-]` nicht verifiziert, `[~]` teilweise erfuellt.

### Quellen und Regeln

- [ ] Massgebliche Classic-/Supernova-Quellen sind in einem frischen Checkout eindeutig verfuegbar (`DOC-001`).
- [~] Classic-Regeln sind implementiert; Spielerzahl, 3-Spieler-Aufbau und Nachschubfrist sind offen (`CLS-001` bis `CLS-003`).
- [x] Fuenf Rohstoffe, Produktion und Sieben-Grundlogik sind vorhanden.
- [x] Physische Mutterschiff-Anbauten und Freundschaftsboni sind getrennt.
- [~] Alle 32 Encounter sind als Daten vorhanden; vier konkrete Flow-/Regelfehler sind offen (`ENC-001` bis `ENC-004`).
- [x] 20 Freundschaftskarten und eindeutige Mehrheitswertung sind vorhanden.
- [x] Klassische Siegpruefung bei 15 SP im eigenen Zug ist vorhanden.

### Supernova

- [x] Variantenwahl und Save-Fallback auf Classic sind vorhanden.
- [x] Supernova-Nachschubstaffel entspricht der Quelle.
- [ ] Alle 25 Missionen werden regelkonform automatisch geprueft (`SN-001`).
- [ ] Private Missionen/Ressourcen bleiben technisch privat (`SN-002`).
- [~] Fabrikbau, Produktion und Mehrheiten funktionieren; Bestand/Brettdarstellung fehlen (`SN-003`).
- [x] Schlachtschiffbaukosten, Maximum und Kanonenvoraussetzung sind vorhanden.
- [ ] Schlachtschiffkaempfe sind interaktiv, gleichstands- und folgenkorrekt (`SN-004`, `SN-005`).
- [~] Siegbedingung 15 SP plus Mission ist technisch vorhanden, aber von unvollstaendiger Missionspruefung abhaengig.
- [ ] Optionale Profivariante ist vorhanden (`SN-006`, optional).

### State und Save/Load

- [x] Classic-/Supernova-Kerndaten werden normalisiert.
- [x] Encounter-Dualwurf und Antriebsvergleich werden persistiert.
- [ ] Autosavefehler werden sichtbar behandelt (`SAVE-001`).
- [ ] Alle kritischen Pending-Zustaende besitzen Save/Resume-Regressionstests (`TEST-001`).
- [ ] Relay-/Controllerzustand kann nach Serverneustart kontrolliert wiederhergestellt werden (`NET-002`).
- [ ] Strukturmigration unterscheidet fehlend von explizit leer (`STATE-001`).
- [ ] Optionaler Saveexport/-import ist vorhanden (`OPS-001`, optional).

### Controller und Netzwerk

- [x] QR-Lobby und Controller-Grundverbindung funktionieren im Chromium-E2E.
- [x] Alle sieben Controller-Tabs besitzen Render-/Aktionspfade.
- [ ] Jeder Controller erhaelt nur seine privaten Daten (`SN-002`).
- [ ] Doppelverbindung/alter QR-Link besitzt sichere Replace-/Reconnect-Regel (`NET-001`).
- [-] Netzwerkunterbrechung in Encounter/Kampf wurde mit realen Geraeten getestet (`TEST-001`).
- [ ] Controller ist vollstaendig DE/EN-lokalisiert (`CTRL-001`).

### Fire TV, PWA und Mobile

- [x] Webcode kann per Pfeiltasten/Enter bis zur QR-Lobby navigiert werden.
- [x] Wrapper setzt Fullscreen und Keep-screen-on.
- [-] Tatsaechliche Fire-TV-DPAD-/Back-Events und 4K-Hardwarebetrieb sind abgenommen (`FIRE-001`, `TEST-001`).
- [ ] Releasewrapper ist ohne dauerhaftes Debugging/permissive Defaults gehaertet (`FIRE-001`).
- [x] Manifest, Apple-Metadaten, Fullscreen-Button, iOS-Hinweis und Safe-Area-CSS sind vorhanden.
- [ ] PWA funktioniert ueber die reale LAN-URL in sicherem Kontext (`PWA-002`).
- [ ] Service-Worker-Updates liefern neue Assets garantiert aus (`PWA-001`).
- [x] Portrait-Drehhinweis und Landscape-Grundlayout funktionieren im Browser-Smoke.

### Visuelles Niveau, Assets und VFX

- [x] Hauptmenue zeigt den Titel nur einmal und wirkt bei 1080p zusammenhaengend.
- [ ] Hauptmenue ist auf 4K proportional lesbar (`UI-001`).
- [x] Setup und QR-Lobby verwenden dieselbe Designfamilie.
- [ ] Controller macht den Space-Hintergrund deutlich sichtbar (`UI-002`).
- [ ] Hauptmenueicons sind plattformunabhaengig und assetkonsistent (`UI-003`).
- [~] Aktive Assets laden ohne beobachtete Fehler; Legacy-/Rawbestand bleibt (`ASSET-001`).
- [~] VFX-Daten fuer 12 Kolonie-, 12 Handels- und 12 Schlachtschiffe sind vorhanden und technisch angebunden.
- [-] Alle Schiffvarianten/VFX sind im normalen Spiel auf TV und Smartphone visuell abgenommen (`TEST-001`).
- [ ] Assetpreload bleibt innerhalb gemessener Fire-TV-/Smartphone-Budgets (`PERF-001`).
- [ ] Optionales Audio-/Lautstaerkesystem ist vorhanden (`AUDIO-001`, optional).

### Qualitaetssicherung

- [x] `npm run check` ist gruen.
- [x] `npm test` ist gruen.
- [x] `npm run test:e2e` ist gruen (7 Chromium-Tests).
- [x] Gepruefte Browserseiten laden ohne beobachtete Konsolen-/Assetfehler.
- [ ] P0- und P1-Akzeptanzkriterien besitzen Regressionstests (`TEST-001`).
- [-] Vollstaendige reale Classic- und Supernova-Testpartien sind protokolliert.
- [-] Fire-TV-, iOS-PWA- und Android-PWA-Hardwarematrix ist abgenommen.
- [ ] Produktions-Debuglogs sind entfernt (`TECH-001`).

## 20. Abschlussurteil

### 1. Kann eine vollstaendige klassische Partie regelkonform gespielt werden?

**Nein, derzeit nicht belastbar regelkonform.** Der Kern ist weitgehend spielbar, aber `CLS-001` bis `CLS-003` sind relevante Abweichungen. Zusaetzlich kann `ENC-001` eine Partie blockieren; `ENC-002` bis `ENC-004` betreffen Encounter-Regel-/Ablauftreue. Ohne diese Korrekturen und eine reale Vollpartie kann Classic nicht als vollstaendig abgenommen gelten.

### 2. Kann eine vollstaendige Supernova-Partie regelkonform gespielt werden?

**Nein.** Missionen sind fuer 13 Karten nicht automatisch regelgeprueft (`SN-001`), Fabriken sind unvollstaendig (`SN-003`) und Schlachtschiffkaempfe entsprechen weder Interaktion noch allen Folgen (`SN-004`, `SN-005`). Die technische Siegpruefung allein macht die Variante nicht vollstaendig.

### 3. Gibt es bekannte Faelle von Datenverlust oder festhaengenden Spielzustaenden?

**Ja, ein nachgewiesenes Stuck-Risiko:** `ENC-001`. Ein bereits beobachteter konkreter Datenverlust ist in diesem Audit nicht belegt. Autosavefehler sind aber unsichtbar (`SAVE-001`), und Relay-Neustart/Controllerrestore ist nicht abgesichert (`NET-002`).

### 4. Sind alle notwendigen Spielobjekte, Karten und Assets vorhanden?

**Die zentralen Datenbestaende sind zahlenmaessig vorhanden:** 32 Encounter, 20 Freundschaftskarten, 25 Missionen, 5 Fabriktypen/-Mehrheitskarten und je 12 Schiffvarianten. Funktionale Vollstaendigkeit fehlt bei Missionen, Fabrikdarstellung und Kampf. Nicht jede Blaupause/VFX-Kombination wurde visuell abgenommen.

### 5. Ist die TV-/Fire-TV-Bedienung vor Verbindung der Controller vollstaendig moeglich?

**Im Browserpfad ja, auf echter Hardware nicht abschliessend verifiziert.** Pfeil-/Enter-E2E bis zur QR-Lobby ist gruen; Wrapper leitet DPAD/Back weiter. Der reale Fire-TV-Keycode-, Fokus-, Dialog- und Langzeittest fehlt (`FIRE-001`, `TEST-001`).

### 6. Sind die Smartphone-Controller fuer reale Mehrspieler-Partien geeignet?

**Funktional grundlegend ja, releasefertig nein.** Verbindung, Tabs, Orientation und Grundaktionen funktionieren. Private Daten werden jedoch an alle Controller gesendet (`SN-002`), Reconnect/Doppelverbindung ist nicht robust abgesichert (`NET-001`, `NET-002`), und PWA ueber reales HTTP-LAN ist nicht bestaetigt (`PWA-002`).

### 7. Ist das visuelle Niveau konsistent und professionell?

**Bei 1080p fuer Hauptmenue, Setup und Lobby weitgehend ja; insgesamt noch nicht.** 4K-Skalierung (`UI-001`), nahezu deckende Controller-Panels (`UI-002`), Unicode-Menueicons (`UI-003`) und nicht vollstaendig abgenommene Schiff-/VFX-Kombinationen verhindern ein durchgaengiges Final-Polish-Urteil.

### 8. Welche Punkte verhindern aktuell die Bezeichnung "final polished"?

- Encounter-Softlock `ENC-001`.
- Classic-Regelabweichungen `CLS-001` bis `CLS-003`.
- Unvollstaendige Missionen/Fabriken/Schlachtschiffkaempfe `SN-001` bis `SN-005`.
- Fehlende Privatsphaere und robuste Mehrgeraete-Wiederherstellung `SN-002`, `NET-001`, `NET-002`.
- Stale-Cache-/PWA-/Fire-TV-Risiken `PWA-001`, `PWA-002`, `FIRE-001`.
- 4K-/Controller-/VFX-Abnahme und zu geringe End-to-End-Testabdeckung `UI-001`, `UI-002`, `TEST-001`, `PERF-001`.

### 9. Welche Punkte sind nur optionaler Zusatzkomfort?

- Supernova-Profivariante mit zwei Missionen (`SN-006`).
- Audio-/Lautstaerkesystem (`AUDIO-001`).
- Portabler Saveexport/-import (`OPS-001`).
- Legacy-Assetbereinigung (`ASSET-001`) ist Polish/Wartbarkeit und kein Spielblocker.

**Gesamturteil:** Der aktuelle Stand ist ein fortgeschrittener, technisch lauffaehiger Prototyp mit guter 1080p-Praesentation, aber wegen eines P0-Softlocks, mehrerer P1-Regel-/Supernova-Fehler und nicht abgeschlossener Hardware-/Mehrgeraeteabnahme noch nicht release- oder final-polish-bereit.
