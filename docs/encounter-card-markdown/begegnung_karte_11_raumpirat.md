# Begegnung Karte 11 – Raumpirat

## Kartentyp
Raumpirat-Begegnung.

## Ausgangstext / Spielfeld
Ein Raumpirat fordert zwei deiner Rohstoffe. Gibst du ihm die Rohstoffe?

## Anzeige aktiver Spieler
Ein Raumpirat fordert zwei deiner Rohstoffe. Gibst du ihm die Rohstoffe?

## Auswahl aktiver Spieler
Der aktive Spieler wählt:

- Ja
- Nein

---

# Zweig: Ja – Rohstoffe geben

## Vorbedingung / Auswahl
Der aktive Spieler hat `Ja` gewählt.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe
Der Pirat verschwindet mit deinen Rohstoffen. Er sabotiert eins deiner Schiffe. Wähle eines deiner Schiffe. Es darf in dieser Runde nicht fliegen.

## Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

## Spielfeld-Aktion
- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert und darf in dieser Flugphase nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

## Effekt
- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Ein gewähltes eigenes Schiff des aktiven Spielers wird für diese Runde blockiert.

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

## Danach
Begegnung abschließen.

---

# Zweig: Nein – Kampf gegen den Piraten

## Vorbedingung / Auswahl
Der aktive Spieler hat `Nein` gewählt.

## Anzeige aktiver Spieler
Du musst kämpfen. Du und dein linker Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Betroffener passiver Spieler
Der linke Nachbar des aktiven Spielers wird als Pirat bestimmt.

## Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

## Anzeige aktiver Spieler
Würfle mit deinem Mutterschiff.

## Aktionen
Beide beteiligten Spieler müssen jeweils per Button einen Mutterschiffwurf auslösen:

- Aktiver Spieler würfelt mit seinem Mutterschiff.
- Linker Nachbar würfelt als Pirat mit seinem Mutterschiff.

## Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.
- Danach wird die Kampfkraft beider Spieler verglichen.

## Kampfkraft
Die Kampfkraft eines Spielers ist:

```text
Punktzahl der farbigen Kugeln + effektive Anzahl Bordkanonen
```

## Regel zu Bordkanonen
Für die Kampfkraft zählen:

- physisch am Mutterschiff montierte Bordkanonen
- zusätzliche wirksame Bordkanonen-Boni aus Freundschaftskarten

Freundschaftskarten-Boni zählen für diesen Kampf zur effektiven Kampfkraft, bleiben aber weiterhin keine echten Mutterschiff-Anbauten.

## Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für den Kampf.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.

---

# Ergebnis: Aktiver Spieler ist gleich stark oder stärker

## Anzeige aktiver Spieler
Sieg! Die Ladung des Piratenschiffs gehört dir. Du erhältst zwei Erz und dazu eine halbe Medaille.

## Effekt
- Aktiver Spieler erhält 2 Erz.
- Aktiver Spieler erhält 1 halbe Medaille.

## Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

## Danach
Begegnung abschließen.

---

# Ergebnis: Aktiver Spieler ist schwächer

## Anzeige aktiver Spieler
Niederlage. Dein Schiff wird beschädigt. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 1 vorhandenen echten Mutterschiff-Ausbau auswählen und entfernen.

## Auswahl aktiver Spieler
Der aktive Spieler kann einen beliebigen vorhandenen echten Ausbau seines Mutterschiffs entfernen:

- Antrieb
- Frachtmodul
- Bordkanone

Nur tatsächlich montierte echte Mutterschiff-Anbauten können entfernt werden.

## Regel zu Freundschaftskarten
Freundschaftskarten-Boni sind keine echten Mutterschiff-Anbauten und können hier nicht entfernt werden.

## Effekt
- Aktiver Spieler entfernt 1 selbst gewählten echten Mutterschiff-Ausbau.
- Es wird keine halbe Medaille vergeben.

## Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich verloren.

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

## Danach
Begegnung abschließen.
