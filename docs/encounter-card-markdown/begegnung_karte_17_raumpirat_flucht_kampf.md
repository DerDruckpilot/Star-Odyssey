# Begegnungskarte 17 – Raumpirat / Flucht oder Kampf

## Kartentyp
Raumpirat-Begegnung

## Grundlage
Diese Karte ist regeltechnisch identisch mit Begegnungskarte 16, aber der Vergleichs- und Kampfspieler ist immer der zweite linke Nachbar des aktiven Spielers.

## Anfangstext
Ein Raumpirat greift dich an. Möchtest du fliehen?

## Auswahl aktiver Spieler
- Ja
- Nein

## Passive / nicht betroffene Spieler
Keine Aktion, solange sie nicht als Pirat betroffen sind.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

# Zweig: Ja – Flucht versuchen

## Anzeige aktiver Spieler
Hast du gleich viele oder mehr Antriebe als dein zweiter linker Nachbar?

## Vergleichsspieler
Der zweite linke Nachbar des aktiven Spielers.

## Spielfeld-Anzeige
- Das Mutterschiff des aktiven Spielers und das Mutterschiff des zweiten linken Nachbarn werden kurz nebeneinander auf dem großen Spielfeld eingeblendet.
- Alle sichtbaren Anbauten müssen dargestellt werden.
- Zusätzlich wirksame Antriebs-Boni aus Freundschaftskarten werden berücksichtigt und können angezeigt werden.
- Es findet kein Mutterschiffwurf statt.
- Kein Shake, keine Kugelanimation.
- Nach ca. 2–3 Sekunden werden die Mutterschiffe wieder ausgeblendet.

## Vergleichswert
```text
Effektive Antriebe = physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

## Ergebnis: Aktiver Spieler hat gleich viele oder mehr Antriebe

### Anzeige aktiver Spieler
Deine Flucht gelingt.

### Effekt
Keine weiteren Effekte.

### Danach
Begegnung abschließen.

## Ergebnis: Aktiver Spieler hat weniger Antriebe

Der aktive Spieler landet in der Kampfsequenz gegen den zweiten linken Nachbarn als Pirat.

---

# Zweig: Nein – Nicht fliehen

## Regel
Wenn der aktive Spieler nicht fliehen möchte, wird direkt dieselbe Kampfsequenz ausgelöst wie bei gescheiterter Flucht.

## Anzeige aktiver Spieler
Du musst kämpfen. Du und dein zweiter linker Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Betroffener passiver Spieler
Der zweite linke Nachbar des aktiven Spielers wird als Pirat bestimmt.

---

# Gemeinsame Kampfsequenz

Diese Kampfsequenz wird ausgelöst, wenn:

- der aktive Spieler beim Anfangstext `Nein` wählt,
- oder der aktive Spieler beim Fluchtversuch weniger effektive Antriebe als der zweite linke Nachbar hat.

## Anzeige aktiver Spieler
Du musst kämpfen. Du und dein zweiter linker Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

## Aktionen
Beide beteiligten Spieler müssen jeweils per Button einen Mutterschiffwurf auslösen:

- Aktiver Spieler würfelt mit seinem Mutterschiff.
- Zweiter linker Nachbar würfelt als Pirat mit seinem Mutterschiff.

## Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

## Kampfkraft
```text
Kampfkraft = Punktzahl der farbigen Kugeln + physisch montierte Bordkanonen + Bordkanonen-Boni aus Freundschaftskarten
```

## Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für den Kampf.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Bordkanonen zählen.
- Zusätzlich wirksame Bordkanonen-Boni aus Freundschaftskarten zählen ebenfalls.
- Freundschaftskarten-Boni zählen weiterhin nicht als echte Mutterschiff-Anbauten.

---

# Kampf-Ergebnis: Aktiver Spieler ist gleich stark oder stärker

## Anzeige aktiver Spieler
Sieg! Die Ladung des Piratenschiffs gehört dir. Du erhältst zwei Erz und dazu eine halbe Medaille.

## Effekt
- Aktiver Spieler erhält 2 Erz.
- Aktiver Spieler erhält 1 halbe Medaille.

## Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

## Danach
Begegnung abschließen.

---

# Kampf-Ergebnis: Aktiver Spieler ist schwächer

## Anzeige aktiver Spieler
Niederlage! Dein Schiff wird beschädigt. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn. Für deinen Mut erhältst du aber eine halbe Medaille.

## Nächster Schritt aktiver Spieler
Der aktive Spieler wählt einen vorhandenen echten Mutterschiff-Ausbau aus.

## Ausbau-Auswahl
Angeboten werden nur tatsächlich vorhandene echte Anbauten:

- Antrieb
- Frachtmodul
- Bordkanone

Freundschaftskarten-Boni werden nicht entfernt.

## Effekt
- Der gewählte echte Mutterschiff-Ausbau wird entfernt.
- Aktiver Spieler erhält 1 halbe Medaille.

## Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

## Danach
Begegnung abschließen.
