# Performance-Optimierungsbericht

Stand: 16. Juli 2026

Ausgangsrevision: `5b3d7ef`

Messrevision: `83390e7`

## Kurzfazit

Star Odyssey besitzt jetzt drei getrennte Ladephasen. Das Hauptmenü wird erst nach dem Dekodieren seiner Pflichtassets freigegeben. Die QR-Lobby lädt und dekodiert den konkreten Classic- oder Supernova-Bestand und bereitet den Game State vor. Erst danach kann die Partie gestartet werden. Im gemessenen Classic-Ablauf entstanden nach dem Start **keine weiteren Transfers zentraler Board- oder Spielassets**.

Der vollständige Setup-, Drei-Controller- und Lobbyablauf sank durch eine gezielte Fortschrittsanzeige von zwischenzeitlich 171 auf 37 komplette Host-Renderings. Eine reale Schiffplatzierung benötigt während ihrer Animation nur einen App- und einen Board-Neuaufbau; die übrigen 93 Animationsframes aktualisieren ausschließlich den dynamischen VFX-Layer.

## Messmethode und Grenzen

Die reproduzierbare Messung läuft mit:

```text
npm run perf:measure
```

Messumgebung:

- Chromium headless, 1920 x 1080
- lokaler TV-Server über `http://127.0.0.1:5173`
- frischer Browserkontext
- Service Worker blockiert, damit kalte Transfers sichtbar bleiben
- drei Controllerseiten für eine Classic-Partie mit Rot, Blau und Grün
- separate frische Seite für eine reale Kolonieschiff-Platzierung

Die Werte sind lokale Chromium-Messungen. Es wurden **keine** realen Fire-TV-, iOS- oder Android-Leistungswerte erhoben. `performance.memory` liefert in Headless Chromium nur grob gerundete Werte und wird deshalb nicht als belastbares Speicherbudget verwendet. Browser-Resource-Größen bilden übertragene Dateien ab, nicht den GPU-Speicher dekodierter Texturen.

## Vorher-/Nachher-Messung

| Messpunkt | Vorher (`5b3d7ef`) | Nachher (`83390e7`) | Einordnung |
| --- | ---: | ---: | --- |
| DOM bereit | 323,0 ms | 185,1 ms | 42,7 % schneller |
| Hauptmenü vollständig bereit | 1.344,0 ms | 1.180,8 ms | 12,1 % schneller |
| App-Start Requests | 39 | 40 | ein zusätzlicher Loader-/Managerpfad |
| App-Start Transfer | 10.969.416 B | 10.993.448 B | praktisch unverändert (+0,2 %) |
| App-Start Long Tasks | nicht erhoben | 0 | keine Long Tasks im finalen Kaltstart |
| Lobby Requests kumuliert | 84 | 101 | jetzt vollständiger Partie-Preload |
| Lobby Transfer kumuliert | 38.704.066 B | 57.678.453 B | mehr Daten bewusst vor Spielstart |
| Konkrete Lobbyvorbereitung | nicht vollständig vorhanden | 7.543,7 ms | Laden, Dekodieren und Game-State-Vorbereitung |
| Host-Renderings Setup + 3 Controller + Lobby | nicht instrumentiert | 37 | davon Setup 5, Controllerphase 30, Abschluss 1 |
| Zwischenmessung vor Progress-DOM-Fix | 171 | 37 | 78,4 % weniger vollständige Renderings |
| Erster Boardframe nach Start | nicht erhoben | 763,4 ms | bereits 12 Planeten und 3 Strukturen vollständig |
| Zentrale Assettransfers nach Boardstart | sichtbar vorhanden | 0 | Pflichtassets liegen vor Start dekodiert vor |
| Platzierung App-Renderings | nicht erhoben | 1 | State-Abschluss, nicht pro Frame |
| Platzierung Board-Renderings | nicht erhoben | 1 | dynamische Frames ohne Board-Neuaufbau |
| Platzierung Animationsframes | nicht erhoben | 93 | zentraler Scheduler |
| Platzierung mittlere Framezeit | nicht erhoben | 19,57 ms | ca. 51 FPS inklusive Headless-Ausreißer |
| Platzierung p90 | nicht erhoben | 16,8 ms | überwiegend 60-FPS-Niveau |
| Platzierung maximale Framezeit | nicht erhoben | 100,0 ms | einzelner Headless-Ausreißer; Qualitätsstufe blieb `high` |
| Browser-/Requestfehler | fehlerhafte `/src/public/...`-Pfade beobachtet | 0 | Assetpfade korrigiert |

Die frühere Lobbyzahl beschreibt nur den damals unvollständigen Ladevorgang und ist deshalb nicht direkt mit der neuen Spielbereitschaft vergleichbar. Die neue Lobby lädt rund 19 MB zusätzlich, verhindert dafür aber das sichtbare Nachladen nach Spielbeginn.

## Gefundene Hauptursachen

### Laden und Dekodieren

- Es gab keinen gemeinsamen Promise- und Image-Cache für alle UI- und Spielassets.
- Ein abgeschlossener Request galt teilweise als bereit, obwohl das Bild noch nicht dekodiert war.
- Der Lobby-Preloader deckte nicht alle tatsächlich gerenderten Assets ab.
- Dreispieler-Partien benötigen neutrale gelbe Startgebäude unabhängig von den Spielerfarben; diese fehlten zunächst im konkreten Ladeplan.
- Fehlerhafte relative Menü-Iconpfade erzeugten zusätzliche fehlgeschlagene Requests.
- Der Service Worker verwendete eine zu grobe Strategie und der lokale TV-Server bot keine belastbare Revalidierung mit ETag/Last-Modified.

### Rendering

- Board, VFX und Remote-Controller konnten dieselbe SVG-Struktur mehrfach vollständig erzeugen.
- Platzierungsanimationen lösten zuvor komplette App-/Board-Renderings pro Frame aus.
- Statische SVG-Bestandteile wurden wiederholt neu aufgebaut.
- Jeder Fortschrittsschritt eines dekodierten Lobbyassets baute die komplette Lobby inklusive QR-Codes neu auf.
- Der Controller verarbeitete mehrere eingehende Zustände ohne Frame-Coalescing.

### Animationen

- Mehrere unabhängige `requestAnimationFrame`-Schleifen konkurrierten miteinander.
- Animationen besaßen keine gemeinsame Sichtbarkeitspause und keine zentrale Frametimemessung.
- Partikelmengen waren nicht an tatsächlich gemessene Framezeiten gekoppelt.

## Neue Ladearchitektur

### Phase A: App-Start

`index.html` zeigt sofort einen rein per CSS aufgebauten schwarzen Screen mit Titel, Ladebalken und Prozentwert. Dafür wird kein Bild benötigt.

Vor Freigabe des Menüs lädt `src/asset-preloader.js`:

- Menü-Hintergrund und Interface-Hintergrund
- ornamentalen Hauptrahmen und Kompass
- Buttonplatte und Menüicons
- benötigte Fonts über `document.fonts.ready`

Der `AssetManager` verwaltet eindeutige URLs, Promise-Caching, Zustände (`idle`, `loading`, `ready`, `error`), begrenzte Parallelität und `HTMLImageElement.decode()`. Kritische Fehler zeigen einen Retry statt einer leeren Seite. Das Hauptmenü erscheint erst bei 100 %.

### Phase B: QR-Lobby und Partievorbereitung

Der konkrete Ladeplan wird aus Spielerzahl, Variante und gewählten Farben erzeugt:

- `board-core`: Boardhintergrund, Planeten und Außenposten
- `player-pieces`: Kolonie-, Handels-, Gebäude- und Stationsassets der gewählten Farben
- `build-ui`: benötigte Blaupausen und Ausbauansichten
- `supernova`: nur bei Supernova Fabriken, Schlachtschiffe und zugehörige Assets
- Dreispieler-Pflichtbestand: neutrale gelbe Startkolonien und Raumhafen

Währenddessen werden Boarddaten und der konkrete Game State vorbereitet. Controllerstatus und Spielvorbereitung werden getrennt angezeigt. Der Start-Button wird nur aktiv, wenn:

1. alle Slots verbunden, benannt, verschiedenfarbig und bereit sind,
2. alle erforderlichen Bilder geladen und dekodiert sind,
3. der konkrete Game State erfolgreich vorbereitet wurde,
4. kein kritischer Ladefehler vorliegt.

Fortschrittsänderungen aktualisieren nur Text, ARIA-Wert und Balkenbreite. QR-Cards und Lobby werden nicht für jedes dekodierte Bild neu erstellt.

### Phase C: Laufende Partie

Im gemessenen Classic-Start gab es nach Betätigung des freigegebenen Start-Buttons keine Transfers unter `assets/generated` oder `assets/backgrounds`. Der erste sichtbare Boardzustand enthielt bereits alle 12 Planeten und die drei neutralen Startstrukturen.

Seltene, nicht zum gewählten Modus gehörende Inhalte bleiben aus dem Ladeplan ausgeschlossen. Classic lädt insbesondere keine Schlachtschiff- und Fabrikbestände.

## Rendering und Platzierung

- Boardpunkte, Hexfelder und Verbindungen sind als ID-Maps vorbereitet.
- Unveränderliche SVG-Definitionen, Grid und Links werden als Templates gecacht und geklont.
- Statische, selten veränderte und dynamische Layer sind getrennt.
- Platzierungsanimationen verändern nur den VFX- und Asset-Layer; das Board wird nicht pro Frame neu aufgebaut.
- Der Remote-Controller erhält die bereits gerenderte Boarddarstellung statt einen zweiten vollständigen Host-Aufbau auszulösen.
- Controllerzustände werden höchstens einmal pro Browserframe gerendert; wiederholtes SVG-Parsen nutzt ein Template.
- Der lokale TV-Server streamt Dateien und unterstützt `ETag`, `Last-Modified` und `304 Not Modified`.

Eine vollständige UI-Framework-Migration wurde bewusst nicht durchgeführt. Zustandsänderungen ersetzen weiterhin die aktuell sichtbare Vanilla-DOM-Ansicht, aber hochfrequente Lade-, Animations- und Controllerpfade sind davon entkoppelt.

## Animationsarchitektur

`src/animation-scheduler.js` stellt einen gemeinsamen zeitbasierten Scheduler bereit:

- eine zentrale RAF-Schleife für aktive Animationen
- Delta-Time statt frameabhängiger Fortschritte
- automatisches Entfernen abgeschlossener Animationen
- Pause über Page Visibility API
- Messung von Durchschnitt, p90 und langen Frames
- automatische Qualitätsstufen anhand realer Framezeiten

Platzierung, Würfel, Mutterschiff, Schiffsbewegung und Schiffs-VFX verwenden diesen Scheduler. Bei anhaltend schlechter Framerate werden sekundäre Partikel und Glow-Aufwände reduziert, nicht aber Positionen, Spielerfarben oder spielrelevante Hinweise.

## Controller und Netzwerk

- Hostzustände werden nur gesendet, wenn sich das serialisierte private Viewmodel tatsächlich geändert hat.
- Controller-Renderings werden auf einen Updatezyklus pro RAF zusammengeführt.
- Das Board wird auf dem Controller nicht bei jedem Statussignal neu konstruiert.
- Verbindungs-, Zug- und private Spielerdaten bleiben getrennt; die Autorität verbleibt beim Host.
- Assets und vollständige Boarddaten werden nicht über die Controllerverbindung übertragen.

## Assets

Vorhandene optimierte WebP-Dateien werden nun tatsächlich verwendet:

| Verwendung | Alt | Neu | Reduktion |
| --- | ---: | ---: | ---: |
| Menü-Hintergrund | 2.457.517 B PNG | 716.084 B WebP | 70,9 % |
| Interface-Hintergrund | 1.976.580 B PNG | 452.304 B WebP | 77,1 % |
| zusammen | 4.434.097 B | 1.168.388 B | 73,6 % |

Die größten verbleibenden Runtime-Dateien sind:

- `assets/backgrounds/space-background-4k.png`: 7.169.612 B
- Planeten: 1.592.040 bis 2.384.275 B je Datei
- einzelne Handelsschiffe: bis 1.699.960 B
- `star-odyssey-frame-ornate-4k.webp`: 2.067.738 B

Diese Dateien werden vor Nutzung dekodiert. Eine erneute verlustbehaftete Konvertierung der Spielgrafiken wurde nicht erzwungen, weil für Fire-TV-Alpha-Kompatibilität und 4K-Qualität keine belastbare visuelle Freigabe vorlag. Sie bleiben der größte mögliche spätere Download-/Speicherhebel.

Die vier Menüicons erscheinen in der Resource-Timeline je zweimal, aber der zweite Eintrag überträgt jeweils **0 Byte**. Ursache sind Asset-Manager-Dekodierung und anschließende CSS-Maskennutzung derselben URL; der Browsercache verhindert einen zweiten Netzwerktransfer.

## Service Worker und Cache

- Cacheversion auf `star-odyssey-v3` angehoben
- Bild-, Font- und Audioassets: cache-first
- HTML und Code: network-first mit Cache-Fallback
- kontrollierte Bereinigung alter Cacheversionen
- begrenzter Runtime-Cache
- keine erzwungene Controller-Neuladung bei Service-Worker-Wechsel
- API-, WebSocket- und lokale Sessiondaten werden nicht als statische Assets gecacht

Der TV-Server setzt statische Assets auf `stale-while-revalidate`, HTML/Code auf Revalidierung und dynamische API-Antworten auf `no-store`.

## Performancebudgets

| Bereich | Budget |
| --- | --- |
| Ladescreen | vor dem ersten schweren Asset sichtbar, kein weißer Zwischenframe |
| Menübereit lokal | unter 1,5 s im kalten Chromium-Loopback-Test |
| Menüinteraktion | sichtbares Feedback im nächsten Frame, keine Assettransfers |
| Lobby | Start erst nach 100 % Dekodierung und Game-State-Vorbereitung |
| Boardstart | erster sichtbarer Boardframe vollständig, lokal unter 1 s angestrebt |
| zentrale Assets nach Start | 0 Transfers |
| Animationen | p90 nahe 16,7 ms, Ziel 60 FPS; schwache Hardware stabil über 30 FPS |
| Platzierung | kein Board-Neuaufbau pro Animationsframe |
| Controller | maximal ein Render pro Browserframe und nur bei geändertem Viewmodel |

## Verifikation

Automatisiert abgedeckt sind:

- Startloader, echter Fortschritt, Fehler und Retry
- Classic-/Supernova-Ladeplan und gewählte Farben
- Start-Button-Gate für Controller, Assets und vorbereiteten Game State
- keine zentralen Transfers nach Boardstart
- Platzierungsanimation ohne Board-Neuaufbau pro Frame
- gemeinsamer Scheduler, Pause und Qualitätsstufen
- Service-Worker-Cacheversion und Strategien
- TV-Server ETag/304/Cache-Header
- Classic, Supernova, Save/Load, Controller, Fire-TV-Fokus und VFX über die bestehende Suite

Abschließende Befehle:

- `npm run check`
- `npm test`
- `npm run test:e2e`
- `npm run perf:measure`
- `git diff --check`

Finale Ergebnisse:

- `npm run check`: erfolgreich, einschließlich aller Runtime-, Daten-, Loader-, Scheduler-, Server- und Messmodule
- `npm test`: erfolgreich; Save-Portabilität, Assetloader, Scheduler, Projektstruktur, Game State, Controller-Datenschutz und TV-Relay
- `npm run test:e2e`: **21/21 Tests erfolgreich** in 94,1 Sekunden
- `npm run perf:measure`: erfolgreich; keine Browser-/Requestfehler und keine zentralen Transfers nach Spielstart
- `git diff --check`: erfolgreich
- automatisierte Viewports: 1920 x 1080, 3840 x 2160, 844 x 390 und 390 x 844

Das Projekt besitzt keinen separaten Bundle-Build oder TypeScript-Typecheck; `npm run check` ist der vorhandene vollständige Syntaxcheck. Die E2E-Suite nutzt den realen TV-Server und den Browserpfad statt eines künstlichen Komponenten-Harnesses.

## Nicht auf echter Hardware verifiziert

- tatsächliche Start- und Frametimes auf einem Fire TV Stick
- GPU-Speicher und thermisches Verhalten eines Fire TV Sticks
- iPhone-/iPad-PWA-Leistung
- Android-Chromium-Leistung und Fullscreen-Verhalten
- reales WLAN mit mehreren physischen Smartphones

Die implementierten Fallbacks vermeiden eine Abhängigkeit von `OffscreenCanvas`, `createImageBitmap` oder anderen nicht überall verfügbaren APIs. Hardwaretests bleiben dennoch notwendig, bevor verbindliche Gerätebudgets festgelegt werden.
