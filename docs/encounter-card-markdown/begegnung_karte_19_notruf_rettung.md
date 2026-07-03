# Begegnungskarte 19 – Notruf / Rettungsversuch

## Initialer Text
Du erhältst den Notruf eines Raumschiffes, das antriebslos auf eine Sonne zutreibt. Möchtest du helfen?

## Auswahl aktiver Spieler
- Ja
- Nein

---

## Zweig: Nein

### Anzeige aktiver Spieler
Dein rücksichtsloses Verhalten bleibt ohne Folgen.

### Effekt
Keine weiteren Effekte.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: Ja

### Anzeige aktiver Spieler
Dein zweiter rechter Nachbar und du ermitteln eure Geschwindigkeit.

Bist du gleich schnell oder schneller als dein Nachbar?

### Betroffener passiver Spieler
Der zweite rechte Nachbar des aktiven Spielers wird als Vergleichsspieler bestimmt.

### Anzeige betroffener passiver Spieler
{activePlayerName} versucht ein antriebsloses Raumschiff zu retten. Ermittle deine Geschwindigkeit mit deinem Mutterschiff.

### Aktion aktiver Spieler
Der aktive Spieler muss per Button einen Mutterschiffwurf auslösen.

### Aktion betroffener passiver Spieler
Der zweite rechte Nachbar muss per Button einen Mutterschiffwurf auslösen.

### Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Vergleichswert Geschwindigkeit
Die Geschwindigkeit für diese Begegnung ist:

```text
Geschwindigkeit = Punktzahl der farbigen Kugeln + physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für diese Begegnung.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Antriebe zählen.
- Zusätzlich wirksame Antriebs-Boni aus Freundschaftskarten zählen ebenfalls zur effektiven Geschwindigkeit.
- Freundschaftskarten-Boni zählen weiterhin nicht als echte Mutterschiff-Anbauten.

---

## Ergebnis: Aktiver Spieler ist gleich schnell oder schneller

### Anzeige aktiver Spieler
Du rettest einen Handelsfürsten. Als Dank schenkt er dir ein Handelsschiff, das du so bald wie möglich auf einen deiner Raumhafenpunkte aufstellst.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss ein geschenktes Handelsschiff auf einem freien eigenen Raumhafenpunkt platzieren.

### Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle einen freien Raumhafenpunkt eines deiner Raumhäfen.

### Spielfeld-Aktion
- Freie Raumhafenpunkte eigener Raumhäfen werden hervorgehoben.
- Der aktive Spieler wählt genau 1 freien eigenen Raumhafenpunkt.
- Dort wird kostenlos ein Handelsschiff platziert.
- Danach kehrt der Flow zur Begegnung zurück.

### Pending-Regel
Falls kein freier eigener Raumhafenpunkt verfügbar ist, verfällt das Geschenk nicht.

- Das geschenkte Handelsschiff wird in einen Pending-Status gelegt.
- Es kann später kostenlos platziert werden, sobald ein eigener Raumhafenpunkt frei ist.
- Die Platzierung erfolgt so bald wie möglich.

### Effekt
- Aktiver Spieler erhält ein geschenktes Handelsschiff.
- Wenn möglich, wird es sofort auf einem freien eigenen Raumhafenpunkt platziert.
- Wenn keine Platzierung möglich ist, wird es als Pending-Geschenk gespeichert.

### Anzeige betroffener passiver Spieler
{activePlayerName} war gleich schnell oder schneller und hat die Rettung geschafft.

### Danach
Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist langsamer

### Anzeige aktiver Spieler
Dein Rettungsversuch scheitert. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn.

### Nächster Schritt aktiver Spieler
Der aktive Spieler wählt einen vorhandenen echten Mutterschiff-Ausbau aus.

### Ausbau-Auswahl
Angeboten werden nur tatsächlich vorhandene echte Anbauten:

- Antrieb
- Frachtmodul
- Bordkanone

Freundschaftskarten-Boni werden nicht entfernt.

### Effekt
- Der gewählte echte Mutterschiff-Ausbau wird entfernt.

### Anzeige betroffener passiver Spieler
{activePlayerName} war langsamer und der Rettungsversuch ist gescheitert.

### Danach
Begegnung abschließen.
