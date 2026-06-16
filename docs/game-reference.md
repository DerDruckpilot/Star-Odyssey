# Game Reference

Diese Datei fasst die wichtigsten Regel- und Strukturelemente aus der bereitgestellten PDF-Referenz in eigenen Worten zusammen. Sie ist eine interne Designreferenz fuer Star Odyssey und keine UI- oder Markenvorgabe.

## Grundstruktur

- Mehrere Spieler erkunden ein Weltraum-Brett mit bekannten Startsystemen, weiteren Planetensystemen und festen Aussenposten.
- Jeder Spieler beginnt mit mehreren Kolonie- oder Raumhafen-artigen Startstrukturen.
- Die Startaufstellung gibt bereits erste Siegpunkte und erste Produktionsmoeglichkeiten.
- Ziel ist es, ueber Kolonien, Raumhaefen, Stationen, Sondermarker und Fraktionsmehrheiten Siegpunkte zu sammeln.
- Ein sinnvoller erster Zielwert fuer den Prototyp ist 15 Siegpunkte, weil die Referenz damit das Spielende definiert.

## Rohstoffe und Planeten

Planetensysteme bestehen aus Dreiergruppen von Planeten. Jeder Planet hat einen Typ, einen Zahlenmarker und erzeugt bei passender Wuerfelzahl genau einen Rohstoff fuer angrenzende Strukturen.

- Roter Planet: Erz.
- Orangener Planet: Treibstoff.
- Blauer Planet: Carbon.
- Gruener Planet: Nahrung.
- Lila gestreifter Planet: Handelsware.

Kolonien und Raumhaefen grenzen typischerweise an zwei Planeten. Dadurch kann eine Struktur je nach Wuerfelwurf unterschiedliche Rohstoffe liefern.

## Ertraege

- Zu Beginn eines Zuges wird die Rohstoffproduktion fuer alle Spieler bestimmt.
- Die Summe zweier Wuerfel aktiviert alle Planeten mit passendem Zahlenmarker.
- Spieler erhalten Rohstoffe, wenn eigene Kolonien oder Raumhaefen an aktivierten Planeten liegen.
- Eine besondere Unterstuetzung ueber einen Nachschubstapel kann Spielern mit niedrigerem Punktestand helfen.
- Bei einer Sonderzahl kann die normale Planetenerzeugung ausfallen und eine Karten-/Ressourcenabgabe ausgeloest werden.

## Handel und Bau

- Der aktive Spieler darf handeln und bauen.
- Handel mit Mitspielern laeuft ueber Angebote und Gegenangebote, aber nur mit dem aktiven Spieler.
- Handel mit dem Vorrat ist als fester Tauschkurs geplant, z. B. 3 gleiche Rohstoffe gegen 1 beliebigen Rohstoff.
- Handelsware hat als Ressource eine Sonderrolle und kann guenstiger gegen den Vorrat getauscht werden.
- Bauen verbraucht konkrete Rohstoffkombinationen und platziert neue Figuren oder verbessert das Mutterschiff-/Spielerprofil.
- Neue Kolonie- und Handelsschiffe werden nicht automatisch gesetzt: Nach dem Bau waehlt der Spieler einen freien Raumhafenpunkt neben einem eigenen Raumhafen.

## Schiffe und Bewegung

- Schiffe bewegen sich nicht frei, sondern diskret ueber Raumpunkte und Verbindungen.
- Eine Flugphase bestimmt die Bewegungspunkte fuer alle Schiffe des aktiven Spielers.
- Bewegung darf teilweise genutzt werden; ein Schiff muss nicht alle Punkte ausgeben.
- Besetzte Punkte koennen in bestimmten Situationen uebersprungen werden, bleiben aber logisch Teil der Route.
- Wichtige Punkte duerfen nicht dauerhaft blockiert werden.

## Erkundung

- Unerforschte Planetensysteme haben verdeckte Zahlen- oder Sondermarker.
- Wenn ein Schiff einen angrenzenden Raumpunkt erreicht, wird das System aufgedeckt.
- Danach sind die Produktionszahlen der Planeten bekannt.
- Sondermarker koennen Hindernisse wie Piraten-/Gefahrenorte oder Eis-/Blockadeplaneten darstellen.
- Nach einer Erkundung kann das Schiff weiterfliegen, wenn noch Bewegungspunkte uebrig sind.

## Zahlenchips und Sondermarker

- Zahlenchips gehoeren zu Symbolgruppen und werden nur auf passende Planetengruppen gelegt.
- Jeder Zahlenchip wird pro Partie nur einmal verwendet.
- Startsysteme sind offen; variable Systeme starten verdeckt und decken ihre Chips erst bei der Erkundung auf.
- Piratenstuetzpunkte und Eisplaneten blockieren den betroffenen Planeten: Er produziert nicht und angrenzende Koloniebauplaetze sind gesperrt.
- Ein Piratenstuetzpunkt kann durch ein angrenzendes Schiff entfernt werden, wenn der Spieler genug Bordkanonen besitzt.
- Ein Eisplanet kann durch ein angrenzendes Schiff terraformt werden, wenn der Spieler genug Frachtmodule besitzt.
- Nach dem Entfernen eines Sondermarkers erhaelt der Spieler den Marker als Siegpunkt; der Planet bekommt einen offenen Reserve-Zahlenchip.

## Gruendung

- Kolonieschiffe koennen auf geeigneten Koloniebauplaetzen zwischen zwei Planeten Kolonien gruenden.
- Jedes Planetensystem hat mehrere logische Bauplaetze.
- Blockierte oder gefaehrdete Planeten koennen angrenzende Bauplaetze sperren, bis das Hindernis beseitigt ist.
- Handelsschiffe koennen an Aussenposten andocken und dort Handelsstationen gruenden.
- Aussenposten haben einen zentralen Andockpunkt und mehrere Stationsplaetze/Docks.
- Fuer jede neue Handelsstation an einem Aussenposten steigt die benoetigte Frachtmodul-Stufe um 1.
- Der Spieler mit der klaren Mehrheit an Handelsstationen eines Aussenpostens haelt den Freundschaftsmarker dieses Volkes und erhaelt dafuer 2 Siegpunkte.
- Jede gegruendete Handelsstation liefert zusaetzlich eine Freundschaftskarte des jeweiligen Volkes.

## Ausbauten

Ausbauten verbessern die Schiffe eines Spielers global:

- Antriebe erhoehen Bewegung.
- Frachtmodule erhoehen Transport-/Stationsfaehigkeit und koennen fuer bestimmte Herausforderungen noetig sein.
- Bordkanonen erhoehen Kampf- oder Gefahrenbewaeltigung.

Diese Werte sollten spaeter als Teil des Spielerzustands modelliert werden, nicht als verstreute Einzelregeln.

## Ereignisse und Begegnungen

- Begegnungen koennen in der Flugphase ausgeloest werden.
- Sie stellen Entscheidungen, Risiken, Belohnungen und manchmal Kampfvergleiche dar.
- Ergebnisse koennen Rohstoffe, Ausbauten, Bewegungsbeschraenkungen, Medaillen oder Verluste betreffen.
- Fuer Star Odyssey sollten Begegnungen spaeter datengetrieben als Karten-/Eventdefinitionen entstehen.

## Siegpunktlogik und Spielende

- Kolonien, Raumhaefen, Stationserfolge, Fraktionsmehrheiten und besondere Medaillen koennen Siegpunkte liefern.
- Manche Punkte sind dauerhaft, andere koennen durch Mehrheiten wechseln.
- Das Spiel endet mit dem Zug, in dem der aktive Spieler das Siegpunktziel erreicht oder ueberschreitet.
