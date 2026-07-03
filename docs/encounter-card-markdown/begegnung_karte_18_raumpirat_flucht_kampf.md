# Begegnungskarte 18 – Raumpirat / Flucht oder Kampf

## Kartentyp
Raumpirat-Begegnung

## Grundlage
Diese Karte ist regeltechnisch identisch mit Begegnungskarte 16, aber der Vergleichs- und Kampfspieler ist immer der linke Nachbar des aktiven Spielers.

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
Hast du gleich viele oder mehr Antriebe als dein linker Nachbar?

## Vergleichsspieler
Der linke Nachbar des aktiven Spielers.

## Spielfeld-Anzeige
- Das Mutterschiff des aktiven Spielers und das Mutterschiff des linken Nachbarn werden kurz nebeneinander auf dem großen Spielfeld eingeblendet.
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

Der aktive Spieler landet in der Kampfsequenz gegen den linken Nachbarn als Pirat.

---

# Zweig: Nein – Nicht fliehen

## Regel
Wenn der aktive Spieler nicht fliehen möchte, wird direkt dieselbe Kampfsequenz ausgelöst wie bei gescheiterter Flucht.

## Anzeige aktiver Spieler
Du musst kämpfen. Du und dein linker Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Betroffener passiver Spieler
Der linke Nachbar des aktiven Spielers wird als Pirat bestimmt.

---

# Gemeinsame Kampfsequenz

Diese Kampfsequenz wird ausgelöst, wenn:

- der aktive Spieler beim Anfangstext `Nein` wählt,
- oder der aktive Spieler beim Fluchtversuch weniger effektive Antriebe als der linke Nachbar hat.

## Anzeige aktiver Spieler
Du musst kämpfen. Du und dein linker Nachbar (als Pirat) ermittelt eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

## Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

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
Sieg, du erbeutest das Schiff. Stelle so bald wie möglich ein Handelsschiff auf einen deiner Raumhafenpunkte.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss ein kostenloses Handelsschiff auf einem freien verfügbaren Raumhafenpunkt eines eigenen Raumhafens platzieren.

## Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle einen freien Raumhafenpunkt eines deiner Raumhäfen.

## Spielfeld-Aktion
- Freie verfügbare Raumhafenpunkte eigener Raumhäfen werden hervorgehoben.
- Der aktive Spieler wählt genau 1 freien eigenen Raumhafenpunkt.
- Dort wird kostenlos ein Handelsschiff platziert.
- Danach kehrt der Flow zur Begegnung zurück.

## Pending-Regel
Wenn aktuell kein freier verfügbarer Raumhafenpunkt vorhanden ist, verfällt das Geschenk nicht.

- Das Handelsschiff wird als ausstehendes Geschenk im Pending-Status gespeichert.
- Es kann später kostenlos platziert werden, sobald ein freier Raumhafenpunkt verfügbar ist.
- Die spätere Platzierung erfolgt ebenfalls auf einem freien Raumhafenpunkt eines eigenen Raumhafens.

## Effekt
- Aktiver Spieler erhält ein kostenloses Handelsschiff.
- Das Handelsschiff wird sofort platziert, wenn ein gültiger Raumhafenpunkt verfügbar ist.
- Falls kein gültiger Raumhafenpunkt verfügbar ist, wird das Handelsschiff als Pending-Geschenk gespeichert.

## Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

## Danach
Begegnung abschließen, sobald das Handelsschiff platziert oder als Pending-Geschenk gespeichert wurde.

---

# Kampf-Ergebnis: Aktiver Spieler ist schwächer

## Anzeige aktiver Spieler
Niederlage, wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss ein eigenes verfügbares Schiff auswählen.

## Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

## Spielfeld-Aktion
- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert.
- Dieses Schiff darf in dieser Runde nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

## Effekt
- Ein gewähltes eigenes Schiff des aktiven Spielers wird für diese Runde blockiert.

## Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

## Danach
Begegnung abschließen.
