# Begegnungskarte 22 – Piratenangriff / Hilfe im Kampf

## Anfangstext
Du siehst ein Raumschiff, das von einem Piraten angegriffen wird. Möchtest du helfen?

## Auswahl aktiver Spieler
- Ja
- Nein

---

## Zweig: Nein – Nicht helfen

### Anzeige aktiver Spieler
Deine feige Flucht bleibt ohne Folgen.

### Effekt
Keine weiteren Effekte.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: Ja – Helfen und kämpfen

### Anzeige aktiver Spieler
Du musst kämpfen. Dein zweiter rechter Nachbar (als Pirat) und du ermitteln eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

### Betroffener passiver Spieler
Der zweite rechte Nachbar des aktiven Spielers wird als Pirat bestimmt.

### Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

### Anzeige andere passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

## Kampf-Mutterschiffwurf

### Aktionen
Beide beteiligten Spieler müssen jeweils per Button einen Mutterschiffwurf auslösen:

- Aktiver Spieler würfelt mit seinem Mutterschiff.
- Zweiter rechter Nachbar würfelt als Pirat mit seinem Mutterschiff.

### Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Kampfkraft
Die Kampfkraft eines Spielers ist:

```text
Punktzahl der farbigen Kugeln + physisch montierte Bordkanonen + Bordkanonen-Boni aus Freundschaftskarten
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für den Kampf.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Bordkanonen zählen.
- Zusätzlich wirksame Bordkanonen-Boni aus Freundschaftskarten zählen ebenfalls zur effektiven Kampfkraft.
- Freundschaftskarten-Boni zählen weiterhin nicht als echte Anbauten.

---

## Kampf-Ergebnis: Aktiver Spieler ist gleich stark oder stärker

### Anzeige aktiver Spieler
Sieg. Du rettest einen Händler. Als Dank schenkt er dir zwei Handelswaren. Zusätzlich erhältst du eine halbe Medaille.

### Effekt
- Aktiver Spieler erhält 2 Handelswaren.
- Aktiver Spieler erhält 1 halbe Medaille.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach
Begegnung abschließen.

---

## Kampf-Ergebnis: Aktiver Spieler ist schwächer

### Anzeige aktiver Spieler
Niederlage. Wähle eines deiner Schiffe. Es darf in dieser Runde nicht fliegen.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss ein eigenes verfügbares Schiff auswählen.

### Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

### Spielfeld-Aktion
- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert und darf in dieser Flugphase nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

### Effekt
- Ein gewähltes eigenes Schiff des aktiven Spielers wird für diese Runde blockiert.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach
Begegnung abschließen.
