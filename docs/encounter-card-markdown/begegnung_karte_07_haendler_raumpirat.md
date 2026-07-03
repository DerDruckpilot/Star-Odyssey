# Begegnungskarte 07 – Händler / Raumpirat

## Kartentyp
Begegnungskarte

## Grundsituation
Diese Karte beginnt wie eine Händlerkarte. Der aktive Spieler entscheidet zunächst, wie viele Rohstoffe er dem vermeintlichen Händler schenken möchte.

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

## Rohstoffabgabe
Falls der aktive Spieler 1, 2 oder 3 Rohstoffe auswählt, muss er entsprechend viele vorhandene Rohstoffe auswählen und abgeben.

Die gewählte Anzahl und die konkret abgegebenen Rohstoffe werden für den weiteren Verlauf der Begegnung gespeichert.

---

# Gemeinsamer Zwischenstep nach jeder Rohstoffauswahl

## Anzeige aktiver Spieler
Der Händler entpuppt sich als Raumpirat. Greifst du ihn an?

## Auswahl aktiver Spieler
- Ja
- Nein

---

# Zweig: Nein

## Vorbedingung
Der aktive Spieler hat nach der Meldung „Der Händler entpuppt sich als Raumpirat. Greifst du ihn an?“ die Option `Nein` gewählt.

## Anzeige aktiver Spieler
Der Pirat verschwindet. Hast du ihm Rohstoffe gegeben, nimmt er sie mit.

## Effekt
- Falls der aktive Spieler Rohstoffe als Geschenk gegeben hat, bleiben diese verloren.
- Falls der aktive Spieler 0 Rohstoffe gegeben hat, verliert er keine Rohstoffe.
- Es gibt keine Belohnung.
- Es gibt keine weitere Aktion.

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

## Danach
Begegnung abschließen.

---

# Zweig: Ja

## Vorbedingung
Der aktive Spieler hat nach der Meldung „Der Händler entpuppt sich als Raumpirat. Greifst du ihn an?“ die Option `Ja` gewählt.

## Anzeige aktiver Spieler
Du musst kämpfen. Du und dein rechter Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Betroffener passiver Spieler
Der rechte Nachbar des aktiven Spielers wird als Pirat bestimmt.

## Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

# Kampf-Mutterschiffwurf

## Beteiligte Spieler
- Aktiver Spieler
- Rechter Nachbar des aktiven Spielers als Pirat

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
- Danach werden die Mutterschiffe nebeneinander gehalten, bis das Ergebnis ausgewertet wurde.

## Kampfkraft
Die Kampfkraft eines Spielers ist:

```text
Punktzahl der farbigen Kugeln + effektive Anzahl Bordkanonen
```

Zur effektiven Anzahl Bordkanonen zählen ausdrücklich:

- physisch montierte Bordkanonen aus echten Mutterschiff-Anbauten
- zusätzliche Bordkanonen-Boni aus Freundschaftskarten

Freundschaftskarten-Bordkanonen erhöhen also die Kampfkraft in diesem Kampf, zählen aber weiterhin nicht als echte Mutterschiff-Anbauten und belegen keinen Mutterschiff-Ausbauplatz.

## Technische Regel
Dieser Wurf ist ein Sonderwurf für diese Begegnung.

- Er zählt nur für den Kampf.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Bordkanonen aus echten Mutterschiff-Anbauten zählen.
- Zusätzlich wirksame Bordkanonen-Boni aus Freundschaftskarten zählen ebenfalls zur effektiven Kampfkraft, zählen aber weiterhin nicht als echte Anbauten.

---

# Auswertung Kampf

## Ergebnis: Aktiver Spieler ist gleich stark oder stärker

### Anzeige aktiver Spieler
Sieg. Du erhältst deine Geschenke zurück und dazu eine halbe Medaille.

### Effekt
- Aktiver Spieler erhält alle zuvor gegebenen Rohstoffe zurück.
- Aktiver Spieler erhält 1 halbe Medaille.
- Es gibt keine weitere Strafe.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach
Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist schwächer

### Anzeige aktiver Spieler
Niederlage. Hast du dem Piraten Rohstoffe gegeben, verschwindet er damit. Außerdem musst du eins deiner Schiffe auswählen. Es darf in dieser Runde nicht fliegen.

### Effekt
- Falls der aktive Spieler Rohstoffe als Geschenk gegeben hat, bleiben diese verloren.
- Falls der aktive Spieler 0 Rohstoffe gegeben hat, verliert er keine Rohstoffe.
- Aktiver Spieler muss 1 eigenes verfügbares Schiff auswählen.
- Dieses Schiff darf in dieser Runde nicht fliegen.

### Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

### Spielfeld-Aktion
- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert.
- Danach kehrt der Flow zur Begegnung zurück.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich verloren.

### Danach
Begegnung abschließen.
