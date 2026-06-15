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
