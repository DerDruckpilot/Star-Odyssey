# Turn Structure

Star Odyssey ist rundenbasiert. Es gibt keinen Echtzeitdruck und keine freie Action-Steuerung. Jede relevante Aktion wartet auf eine bewusste Spielerbestaetigung.

## Geplante State Machine

1. Spielstart
2. Spieler initialisieren
3. Aktiven Spieler setzen
4. Ertragsphase
5. Handels-/Bauphase
6. Flug-/Bewegungsphase
7. Ereignis/Begegnung bei Bedarf
8. Zug beenden
9. Naechsten Spieler setzen
10. Spielende pruefen

## Spielstart

- Spieleranzahl und Spielerfarben werden festgelegt.
- Startstrukturen, Startschiffe, erste Rohstoffe und Anfangswerte werden gesetzt.
- Das Board wird mit bekannten und verdeckten Bereichen initialisiert.
- Der erste aktive Spieler wird bestimmt.

## Ertragsphase

- Der aktive Spieler loest die Produktion fuer alle Spieler aus.
- Die Wuerfelsumme aktiviert passende Zahlenmarker auf Planeten.
- Angrenzende Kolonien und Raumhaefen erzeugen Rohstoffe.
- Sonderregeln wie Nachschub oder Kartenabgabe werden als eigene Unterstates modelliert.

## Handels-/Bauphase

- Der aktive Spieler kann handeln und bauen.
- Spielerhandel, Vorratshandel und Bauaktionen duerfen wiederholt werden.
- Jede Aktion ist explizit bestaetigungspflichtig.
- Der Spieler beendet die Phase aktiv.

## Flug-/Bewegungsphase

- Falls der Spieler Schiffe hat, wird die Bewegung bestimmt.
- Bewegungspunkte gelten fuer die Schiffe des aktiven Spielers.
- Ein Schiff bewegt sich Schritt fuer Schritt ueber verbundene Raumpunkte.
- Zielpunkte werden angezeigt, ausgewaehlt und bestaetigt.
- Erkundung, Gruendung oder Hindernisbewaeltigung koennen waehrend der Bewegung ausgeloest werden.

## Ereignis/Begegnung

- Begegnungen werden als optionale State-Machine-Abzweigung modelliert.
- Eine Begegnung kann vor oder waehrend der Bewegung abgehandelt werden.
- Entscheidungen, Vergleiche und Belohnungen sollen spaeter datengetrieben aus Eventdefinitionen kommen.

## Controller-Tauglichkeit

Die State Machine soll spaeter Handycontroller unterstuetzen:

- Hauptdisplay zeigt Board und oeffentliche Informationen.
- Controller zeigt nur spielerspezifische Aktionen, Handkarten und Bestaetigungen.
- Bewegung kann ueber digitalen Analogstick oder Buttons Zielpunkte markieren.
- Ein separater Button bestaetigt den naechsten Schritt oder schliesst Bewegung/Zug ab.
