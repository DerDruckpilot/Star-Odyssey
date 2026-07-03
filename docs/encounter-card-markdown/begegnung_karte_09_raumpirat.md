# Begegnungskarte 09 – Raumpirat fordert Rohstoffe

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

Du musst kämpfen. Du und dein rechter Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Betroffener passiver Spieler

Der rechte Nachbar des aktiven Spielers wird als Pirat bestimmt.

## Anzeige betroffener passiver Spieler

Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

## Aktionen

Beide beteiligten Spieler müssen jeweils per Button einen Mutterschiffwurf auslösen:

- Aktiver Spieler würfelt mit seinem Mutterschiff.
- Rechter Nachbar würfelt als Pirat mit seinem Mutterschiff.

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

Die Anzeige „Bist du gleich stark oder stärker als dein Nachbar?“ entspricht dieser Auswertung und ist keine freie Entscheidung unabhängig vom Kampfergebnis.

---

## Ergebnis: Aktiver Spieler ist gleich stark oder stärker

### Anzeige aktiver Spieler

Sieg. Du erbeutest das Schiff. Stelle so bald wie möglich ein Handelsschiff auf einen deiner Raumhafenpunkte.

### Effekt

- Aktiver Spieler erhält ein kostenloses Handelsschiff.
- Das Handelsschiff muss auf einem freien verfügbaren Raumhafenpunkt eines eigenen Raumhafens platziert werden.
- Das Handelsschiff verfällt nicht.

### Hinweis aktiver Spieler

Wechsle in den Tab Spielfeld und wähle einen freien Raumhafenpunkt eines deiner Raumhäfen.

### Spielfeld-Aktion

- Freie verfügbare Raumhafenpunkte eigener Raumhäfen werden hervorgehoben.
- Der aktive Spieler wählt genau 1 gültigen Raumhafenpunkt.
- Dort wird das kostenlose Handelsschiff platziert.
- Danach kehrt der Flow zur Begegnung zurück.

### Pending-Regel

Wenn aktuell kein freier verfügbarer Raumhafenpunkt vorhanden ist, wandert das geschenkte Handelsschiff in einen Pending-Status.

- Das Geschenk verfällt nicht.
- Das Handelsschiff kann später kostenlos platziert werden, sobald ein freier gültiger Raumhafenpunkt verfügbar ist.
- Der Pending-Status bleibt beim Spieler gespeichert.

### Anzeige betroffener passiver Spieler / Pirat

{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach

Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist schwächer

### Anzeige aktiver Spieler

Niederlage. Dein Schiff wird beschädigt. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn. Du erhältst für deinen Mut aber eine halbe Medaille.

### Effekt

- Aktiver Spieler muss 1 beliebigen echten montierten Ausbau seines Mutterschiffs entfernen.
- Aktiver Spieler erhält 1 halbe Medaille.
- Freundschaftskarten-Boni gelten nicht als echte montierte Ausbauten und werden dabei nicht entfernt.

### Nächster Schritt aktiver Spieler

Der aktive Spieler wählt einen vorhandenen echten Mutterschiff-Ausbau zum Entfernen:

- Antrieb
- Frachtmodul
- Bordkanone

Nur tatsächlich montierte echte Ausbauten können ausgewählt werden.

### Sonderfall: Kein entfernbarer Ausbau vorhanden

Wenn der aktive Spieler keinen echten montierten Ausbau besitzt, entfällt das Entfernen eines Ausbaus.

- Die Begegnung bleibt trotzdem gültig.
- Die halbe Medaille wird trotzdem vergeben.

### Anzeige betroffener passiver Spieler / Pirat

{activePlayerName} hat den Kampf gegen dich verloren.

### Danach

Begegnung abschließen.
