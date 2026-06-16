# Board Layout

Das digitale Spielfeld von Star Odyssey soll wie ein Weltraum-Brett auf einem Tisch wirken: Top-Down, klar lesbar und dauerhaft als Gesamtbild erfassbar.

## Anzeige

- Landscape Orientation ist die Zielausrichtung.
- Das komplette Brett soll sichtbar bleiben.
- Freies Scrollen oder Herumfahren ist nicht der Standard.
- Der Startbereich liegt an der kurzen linken Bildschirmkante.
- Die visuelle Progression verlaeuft nach rechts in die Galaxie hinein.
- Das Hauptdisplay zeigt das Brett, nicht einzelne Spielerhaende.

## Visueller Aufbau

- Schwarzer Weltraum-Hintergrund.
- Kleine Sterne mit dezenter Helligkeitsanimation.
- Helle Hex-, Kanten- oder Raumpunktlinien.
- Klare Kontraste fuer Spielbrett, Marker, Schiffe und Zielpunkte.
- Planetensysteme, Aussenposten und feste Orientierungspunkte bleiben sichtbar.

## Logische Boardelemente

- Planetensysteme bestehen aus Dreiergruppen von Planeten.
- Jeder Planet hat Typ, Zahlenmarker und optional einen verdeckten Zustand.
- Raumpunkte sind die Knoten fuer Bewegung.
- Verbindungen definieren, welche Raumpunkte erreichbar sind.
- Koloniebauplaetze sind spezielle Raumpunkte zwischen zwei Planeten.
- Andockpunkte sind spezielle Knoten an Aussenposten.
- Docks/Stationsplaetze liegen logisch um einen Aussenposten herum.
- Raumhafenpunkte sind Startpunkte fuer neu gebaute Schiffe.

## Referenzbeobachtungen

Die PDF-Referenz zeigt eine breite Galaxiekarte mit klaren Hexlinien, festen Aussenposten, leeren Raumquadranten, bekannten Startsystemen und verdeckten Systemen. Fuer Star Odyssey soll diese Logik uebernommen werden: ein links verankerter Startbereich, mehrere Systeme als Etappen, Aussenposten als dauerhafte Ziele und ein klares Netz aus Raumpunkten.

## Datengetriebene Koordinaten

Konkrete Koordinaten sollen spaeter nicht hart im Rendering verteilt werden. Stattdessen soll ein Board-Datensatz definieren:

- Boardgroesse und Skalierung.
- Raumpunkte mit ID und Position.
- Verbindungen zwischen Raumpunkten.
- Planetensysteme mit Planetenpositionen.
- Bauplaetze, Andockpunkte und Raumhafenpunkte.
- Startpositionen fuer Spielerfarben.
- Sichtbarer oder verdeckter Zustand einzelner Marker.

## Referenznahe digitale Umsetzung

Die aktuelle Board-Shell nutzt `src/data/boardLayout.js` als Datenquelle. Das Koordinatenbild mit roten Hex-IDs ist jetzt die Source of Truth fuer die Brettform. Beschriftungen wurden ignoriert; massgeblich sind die gueltigen Hex-Koordinaten und die markierte Sternennebelzone.

Das Board nutzt ein `odd-r offset rows` Koordinatensystem mit Koordinaten-IDs wie `A2`, `J7` und `O10`. Die sichtbare Brettform ist kein Rechteck, sondern eine feste Hexliste mit 11 Reihen und 135 sichtbaren Hexfeldern.

Gueltig sind exakt die Koordinaten aus dem Koordinatenbild: Reihe 1 `A1 B1`, dann alternierend `A` bis `O` bzw. `A` bis `N` von Reihe 2 bis 10, und Reihe 11 `A11 B11`. Der Sternennebel ist anhand der festen Koordinaten gesetzt: `I4`, `H5`, `H6`, `K2`, `J3`, `J4`, `I5`, `I6`, `H7`, `I8`, `I9`, `J8`, `K8`, `K9`, `L10`.

Die Hexfelder sind die primaere Geometriequelle. Jedes Hexfeld wird ueber eine einheitliche Grid-Formel berechnet. Aus den sechs Hex-Ecken werden anschliessend die Raumpunkte abgeleitet: identische Ecken benachbarter Hexfelder werden dedupliziert, normale Raumpunkte entstehen an gemeinsamen Kreuzungen von drei Hexfeldern, Randpunkte bleiben als Boundary-Nodes erhalten. Verbindungen werden aus den Hexkanten zwischen benachbarten Raumpunkten generiert.

Die Planetensysteme und Aussenposten sind weiterhin als Hilfsdaten an Koordinaten gebunden. Die sichtbaren Sektor-Beschriftungen werden im digitalen Board nicht mehr gerendert.

Umgesetzt sind:

- 4 Startsysteme links mit Startkolonien und Raumhaefen.
- Vorderer Sektor als grosser linker/mittlerer Hexbereich.
- Gelb markierter Sternennebel als zackige Zone mittig/rechts.
- Hinterer Sektor rechts des Sternennebels.
- 8 erkundbare Planetensysteme als Dreiergruppen.
- 4 zufaellig platzierte Aussenposten/Fraktionsorte an passenden System-Slots.
- Bewegungs-, Kolonie- und Dockpunkte liegen auf generierten Hex-Ecken. Wichtige bestehende IDs bleiben als semantische Bindungen an diese Ecken erhalten, damit bestehende Interaktionen robust bleiben.

## Variante Wilder Weltraum

Fuer neue Partien wird vorerst nur die Variante Wilder Weltraum genutzt. Die vier Startsysteme links bleiben fest:

- Alpha: `A1` Nahrung, `A2` Carbon, `B2` Treibstoff.
- Beta: `A4` Erz, `B4` Treibstoff, `A5` Handelsware.
- Gamma: `A7` Erz, `A8` Nahrung, `B8` Carbon.
- Delta: `A10` Treibstoff, `B10` Handelsware, `A11` Erz.

Alle uebrigen Planetensysteme und Aussenposten werden beim Start eines neuen Spiels zufaellig auf einen gemeinsamen Pool aus 15 Dreier-Hex-Slots verteilt. Es gibt acht Planetensystem-Templates und vier Aussenposten-Templates; drei Slots bleiben dadurch leer und werden wie normale leere Hexfelder gerendert. Die fruehere `*`/`**`-Unterscheidung bleibt nur als interne Herkunftsnotiz am Slot.

Die Sternennebel-Hexe sind fest: `I4`, `H5`, `H6`, `K2`, `J3`, `J4`, `I5`, `I6`, `H7`, `I8`, `I9`, `J8`, `K8`, `K9`, `L10`. Nebel ist kein System-Slot und wird nicht durch zufaellige Inhalte ueberschrieben.

Die zufaellige Verteilung wird im Game-State gespeichert. Save/Load stellt deshalb dieselbe Platzierung wieder her; nur ein neues Spiel erzeugt eine neue Verteilung.

## Zahlenchips und Spezialmarker

Die Zahlenchip-Pools liegen zentral in `src/data/numberTokens.js`. Startsysteme nutzen feste Alpha/Beta/Gamma/Delta-Chips und sind sofort offen. Variable Planetensysteme nutzen die Symbolgruppen `triangle`, `bracket` und `hex`; ihre Chips bleiben bis zur Erkundung verdeckt. Spezialchips fuer Piratenstuetzpunkte und Eisplaneten blockieren Produktion und angrenzende Koloniebauplaetze, bis sie mit Bordkanonen beziehungsweise Frachtmodulen entfernt werden. Danach wird ein Reserve-Zahlenchip auf den Planeten gelegt.

Beim Bau neuer Schiffe wird kein Startpunkt mehr automatisch gewaehlt. Der Spieler startet einen Bauauftrag und waehlt anschliessend einen freien Raumhafenpunkt neben einem eigenen Raumhafen auf dem Board.

Offen fuer spaeter:

- Finale Platzierung von Planetensystemen, Aussenposten, Koloniepunkten und Docks anhand weiterer Referenzen weiter praezisieren.
- Sternennebel-Sonderregeln und Marker erst in spaeteren Regel-PRs ergaenzen.
