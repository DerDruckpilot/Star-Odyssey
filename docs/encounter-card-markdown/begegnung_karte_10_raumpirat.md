# Begegnungskarte 10 – Raumpirat fordert Rohstoffe

## Kartentyp
Begegnung / Raumpirat

## Ausgangstext / Spielfeld

Ein Raumpirat fordert zwei deiner Rohstoffe. Gibst du ihm die Rohstoffe?

## Anzeige aktiver Spieler

Ein Raumpirat fordert zwei deiner Rohstoffe. Gibst du ihm die Rohstoffe?

## Auswahl aktiver Spieler

- Ja
- Nein

---

# Zweig: Ja

## Vorbedingung / Auswahl

Der aktive Spieler hat `Ja` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

Der Pirat wünscht dir einen guten Weiterflug.

## Effekt

- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Es gibt keine weitere Belohnung und keinen Kampf.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

{activePlayerName} ist gerade in einer Begegnung.

## Danach

Begegnung abschließen.

---

# Zweig: Nein

## Vorbedingung / Auswahl

Der aktive Spieler hat `Nein` gewählt.

## Anzeige aktiver Spieler

Du musst kämpfen. Du und dein zweiter rechter Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein zweiter rechter Nachbar?

## Betroffener passiver Spieler

Der zweite rechte Nachbar des aktiven Spielers wird als Pirat bestimmt.

Die Ermittlung erfolgt über die Sitzreihenfolge der Spieler und läuft umlaufend weiter.

## Anzeige betroffener passiver Spieler

Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

## Aktionen

Beide beteiligten Spieler müssen jeweils per Button einen Mutterschiffwurf auslösen:

- Aktiver Spieler würfelt mit seinem Mutterschiff.
- Zweiter rechter Nachbar würfelt als Pirat mit seinem Mutterschiff.

## Spielfeld-Animation

Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

## Kampfkraft

Die Kampfkraft eines Spielers ist:

```text
Punktzahl der farbigen Kugeln + effektive Anzahl Bordkanonen
```

Zur effektiven Anzahl Bordkanonen zählen:

- physisch montierte Bordkanonen am Mutterschiff,
- zusätzliche Bordkanonen-Boni durch Freundschaftskarten, falls vorhanden.

## Technische Regel

Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für den Kampf.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Freundschaftskarten-Boni zählen für die Kampfkraft, zählen aber weiterhin nicht als echte Mutterschiff-Anbauten.

---

# Auswertung Kampf

Nach beiden Kampf-Mutterschiffwürfen wird automatisch geprüft:

- Aktiver Spieler ist gleich stark oder stärker als der Pirat.
- Aktiver Spieler ist schwächer als der Pirat.

Die Anzeige „Bist du gleich stark oder stärker als dein zweiter rechter Nachbar?“ entspricht dieser Auswertung und ist keine freie Entscheidung unabhängig vom Kampfergebnis.

---

## Ergebnis: Aktiver Spieler ist gleich stark oder stärker

### Anzeige aktiver Spieler

Sieg! Die Ladung des Piratenschiffs gehört dir. Du erhältst zwei Karbon und dazu eine halbe Medaille.

### Effekt

- Aktiver Spieler erhält 2 Karbon.
- Aktiver Spieler erhält 1 halbe Medaille.

### Anzeige betroffener passiver Spieler / Pirat

{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach

Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist schwächer

### Anzeige aktiver Spieler

Niederlage. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen. Für deinen Mut erhältst du aber eine halbe Medaille.

### Effekt

- Aktiver Spieler erhält 1 halbe Medaille.
- Aktiver Spieler muss 1 eigenes verfügbares Schiff auswählen.
- Dieses Schiff darf in dieser Runde nicht fliegen.

### Hinweis aktiver Spieler

Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

### Spielfeld-Aktion

- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert und darf in dieser Flugphase nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

### Sonderfall: Kein eigenes verfügbares Schiff vorhanden

Wenn kein eigenes verfügbares Schiff auswählbar ist, entfällt die Schiff-Blockade.

- Die Begegnung bleibt trotzdem gültig.
- Die halbe Medaille wird trotzdem vergeben.

### Anzeige betroffener passiver Spieler / Pirat

{activePlayerName} hat den Kampf gegen dich verloren.

### Danach

Begegnung abschließen.
