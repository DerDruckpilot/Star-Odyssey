# Begegnungskarte 13 – Raumpirat / Hehlerei

## Ausgangstext / Spielfeld
Du triffst einen Raumpiraten, der dir anbietet, einen deiner Rohstoffe gegen zwei beliebige andere umzutauschen. Willigst du ein?

## Anzeige aktiver Spieler
Du triffst einen Raumpiraten, der dir anbietet, einen deiner Rohstoffe gegen zwei beliebige andere umzutauschen. Willigst du ein?

## Auswahl aktiver Spieler
- Ja
- Nein

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

# Zweig: Nein

## Anzeige aktiver Spieler
Du fliegst weiter.

## Effekt
- Keine Rohstoffe werden getauscht.
- Keine Medaille wird vergeben oder verloren.

## Danach
Begegnung abschließen.

---

# Zweig: Ja

## Anzeige aktiver Spieler
Tausche einen beliebigen Rohstoff gegen zwei beliebige andere ein. Würfle anschließend mit deinem Mutterschiff.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss:

1. genau 1 vorhandenen Rohstoff auswählen und abgeben,
2. genau 2 beliebige Rohstoffe als Tausch-Ertrag auswählen,
3. anschließend per Button einen Mutterschiffwurf auslösen.

## Tausch-Effekt
- Aktiver Spieler gibt 1 selbst gewählten vorhandenen Rohstoff ab.
- Aktiver Spieler erhält 2 selbst gewählte beliebige Rohstoffe.

## Mutterschiffwurf
Nach dem Tausch würfelt der aktive Spieler mit seinem Mutterschiff.

### Spielfeld-Animation
- Auf dem großen Spielfeld wird das Mutterschiff des aktiven Spielers angezeigt.
- Der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase wird abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Wertung
Für diesen Sonderwurf zählen ausschließlich die Punkte der farbigen Kugeln.

```text
Wurfwert = Punktzahl der farbigen Kugeln
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für diese Begegnung.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Mutterschiff-Ausbauten zählen bei diesem Wurf nicht.
- Freundschaftskarten-Boni zählen bei diesem Wurf nicht.

---

# Auswertung Mutterschiffwurf

## Ergebnis: Wurfwert 1 oder 2

### Anzeige aktiver Spieler
Der Pirat bedankt sich und wünscht dir einen guten Weiterflug.

### Effekt
- Der Tausch bleibt bestehen.
- Keine Medaille wird vergeben oder verloren.

### Danach
Begegnung abschließen.

---

## Ergebnis: Wurfwert 3

### Anzeige aktiver Spieler
Die galaktische Polizei überführt dich der Hehlerei. Du verlierst die eingetauschten zwei Rohstoffe und eine halbe Medaille.

### Effekt
- Der aktive Spieler verliert die 2 Rohstoffe, die er durch den Tausch erhalten hat.
- Der aktive Spieler verliert 1 halbe Medaille.

### Danach
Begegnung abschließen.

---

## Ergebnis: Wurfwert 4 oder 5

### Anzeige aktiver Spieler
Es gibt Gerüchte, dass du dich der Hehlerei schuldig gemacht hast. Du verlierst eine halbe Medaille.

### Effekt
- Der Tausch bleibt bestehen.
- Der aktive Spieler verliert 1 halbe Medaille.

### Danach
Begegnung abschließen.
