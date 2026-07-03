# Begegnungskarte 06 – Händler

## Kartentyp
Händlerkarte

## Ausgangstext / Spielfeld
Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

## Anzeige aktiver Spieler
Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

## Auswahl aktiver Spieler
Der aktive Spieler wählt eine Anzahl:

- 0 Rohstoffe
- 1 Rohstoff
- 2 Rohstoffe
- 3 Rohstoffe

## Passive / nicht betroffene Spieler allgemein
Solange sie nicht direkt betroffen sind, erhalten passive Spieler keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

# Zweig: 0 Rohstoffe

## Vorbedingung / Auswahl
Der aktive Spieler hat `0 Rohstoffe` gewählt.

## Anzeige aktiver Spieler
Der beleidigte Handelsfürst sabotiert dein Schiff. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen. Zusätzlich verlierst du eine halbe Medaille.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss ein eigenes verfügbares Schiff auswählen.

## Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

## Spielfeld-Aktion
- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert und darf in dieser Flugphase nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

## Effekt
- Aktiver Spieler verliert 1 halbe Medaille.
- Ein gewähltes eigenes Schiff des aktiven Spielers wird für diese Runde blockiert.

## Danach
Begegnung abschließen.

---

# Zweig: 1 Rohstoff

## Vorbedingung / Auswahl
Der aktive Spieler hat `1 Rohstoff` gewählt.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe
Dein Gegenüber, ein Handelsfürst, ist nicht sehr begeistert. Du verlierst eine halbe Medaille.

## Effekt
- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
- Aktiver Spieler verliert 1 halbe Medaille.

## Danach
Begegnung abschließen.

---

# Zweig: 2 Rohstoffe

## Vorbedingung / Auswahl
Der aktive Spieler hat `2 Rohstoffe` gewählt.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe
Der Handelsfürst ist zufrieden. Du erhältst einen beliebigen Rohstoff und eine halbe Medaille.

## Nächster Schritt aktiver Spieler
Der aktive Spieler wählt genau 1 beliebigen Rohstoff als Belohnung.

## Effekt
- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 selbst gewählten beliebigen Rohstoff.
- Aktiver Spieler erhält 1 halbe Medaille.

## Danach
Begegnung abschließen.

---

# Zweig: 3 Rohstoffe

## Vorbedingung / Auswahl
Der aktive Spieler hat `3 Rohstoffe` gewählt.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 3 vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe
Der begeisterte Handelsfürst schenkt dir ein Handelsschiff, das du so bald wie möglich auf einen deiner Raumhafenpunkte aufstellst.

## Nächster Schritt aktiver Spieler
Der aktive Spieler soll in den Tab Spielfeld wechseln und einen freien verfügbaren Raumhafenpunkt eines eigenen Raumhafens auswählen.

## Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle einen freien Raumhafenpunkt an einem deiner Raumhäfen.

## Spielfeld-Aktion
- Freie verfügbare Raumhafenpunkte eigener Raumhäfen werden hervorgehoben.
- Der aktive Spieler wählt genau 1 freien Raumhafenpunkt.
- Dort wird kostenlos ein Handelsschiff platziert.
- Danach kehrt der Flow zur Begegnung zurück.

## Falls kein freier Raumhafenpunkt verfügbar ist
- Das geschenkte Handelsschiff verfällt nicht.
- Es wird als ausstehendes Geschenk im Pending-Status gespeichert.
- Sobald später ein freier Raumhafenpunkt verfügbar wird, kann das Handelsschiff dort kostenlos platziert werden.

## Effekt
- Aktiver Spieler gibt 3 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 kostenloses Handelsschiff.
- Wenn sofort ein freier Raumhafenpunkt verfügbar ist, wird das Handelsschiff dort platziert.
- Wenn kein freier Raumhafenpunkt verfügbar ist, wird das Handelsschiff als Pending-Geschenk gespeichert.

## Danach
Begegnung abschließen.
