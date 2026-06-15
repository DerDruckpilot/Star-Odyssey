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

## Erste digitale Umsetzung

Die erste Board-Shell nutzt `src/data/boardLayout.js` als Datenquelle. Ausgewertet wurden die gerenderten Seiten 2 und 3 der Spielanleitung fuer die grosse Startaufbau-Abbildung sowie Seite 7 fuer Erkundungs-, Kolonie- und Andockpunkte.

Die Anleitung nennt 15 platzierte Raumquadranten, 4 Startsysteme im Startbereich, 8 zu erkundende Planetensysteme und 4 Aussenposten. Diese Zaehlung ist in der ersten digitalen Boardstruktur abgebildet:

- 15 Raumquadranten als grosses Boardraster.
- 4 Startsysteme links.
- 8 verdeckte/erkundbare Planetensysteme als Dreiergruppen.
- 4 Aussenposten als eigene Marker.
- Ein erstes Netz aus 38 Raumpunkten und Verbindungen.
- Spezielle Punktarten fuer Raumhafenpunkte, Koloniebauplaetze und Andockpunkte.

Die genaue Anzahl jedes einzelnen Raumpunkts ist in der Anleitung nicht tabellarisch angegeben und der Almanach liegt im aktuellen Projektkontext nicht als eigene Datei vor. Die Raumpunktstruktur ist deshalb eine visuelle Rekonstruktion in passender Groessenordnung und soll spaeter mit einer vollstaendigen Boardreferenz praezisiert werden.
