# Begegnung Karte 15 – Raumpirat / Überfall

## Kartentyp
Begegnungskarte

## Ausgangstext / Spielfeld
Du begegnest einem Raumpiraten, der dir anbietet, für einen beliebigen Rohstoff deine Mitspieler zu überfallen. Bist du einverstanden?

## Anzeige aktiver Spieler
Du begegnest einem Raumpiraten, der dir anbietet, für einen beliebigen Rohstoff deine Mitspieler zu überfallen. Bist du einverstanden?

## Auswahl aktiver Spieler
- Ja
- Nein

---

## Zweig: Nein

### Anzeige aktiver Spieler
Du fliegst weiter.

### Effekt
- Keine Rohstoffe werden abgegeben.
- Keine Rohstoffe werden erhalten.
- Keine Medaillenänderung.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: Ja

### Anzeige aktiver Spieler
Gib einen beliebigen Rohstoff ab und würfle anschließend mit deinem Mutterschiff.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

### Danach
Der aktive Spieler würfelt mit seinem Mutterschiff.

## Mutterschiffwurf

### Anzeige aktiver Spieler
Würfle mit deinem Mutterschiff.

### Spielfeld-Animation
- Auf dem großen Spielfeld wird das Mutterschiff des aktiven Spielers angezeigt.
- Das Mutterschiff wird mit allen sichtbaren Anbauten dargestellt.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Wertung
Für diese Begegnung zählt nur der Punktwert der farbigen Kugeln.

```text
Ergebnis = Punktzahl der farbigen Kugeln
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für diese Begegnung.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Ausbauten, Bordkanonen und Freundschaftskarten-Boni zählen bei dieser Karte nicht zum Ergebnis.

---

## Ergebnis: Mutterschiffwurf 1 oder 2

### Anzeige aktiver Spieler
Zieh von jedem Mitspieler eine Rohstoffkarte.

### Effekt
- Von jedem Mitspieler wird zufällig 1 vorhandener Rohstoff gezogen.
- Die gezogenen Rohstoffe werden dem aktiven Spieler gutgeschrieben.
- Es erfolgt keine aktive Auswahl durch den aktiven Spieler.
- Es erfolgt keine aktive Auswahl durch die betroffenen passiven Spieler.
- Falls ein Mitspieler keine Rohstoffe besitzt, wird von diesem Mitspieler nichts gezogen.
- Der zuvor abgegebene Rohstoff bleibt verloren.
- Keine Medaillenänderung.

### Betroffene passive Spieler
Alle Mitspieler des aktiven Spielers.

### Anzeige betroffene passive Spieler
{activePlayerName} zieht zufällig einen Rohstoff von dir.

### Danach
Begegnung abschließen.

---

## Ergebnis: Mutterschiffwurf 3

### Anzeige aktiver Spieler
Zieh von jedem deiner Mitspieler eine Rohstoffkarte, du verlierst aber eine halbe Medaille.

### Effekt
- Von jedem Mitspieler wird zufällig 1 vorhandener Rohstoff gezogen.
- Die gezogenen Rohstoffe werden dem aktiven Spieler gutgeschrieben.
- Es erfolgt keine aktive Auswahl durch den aktiven Spieler.
- Es erfolgt keine aktive Auswahl durch die betroffenen passiven Spieler.
- Falls ein Mitspieler keine Rohstoffe besitzt, wird von diesem Mitspieler nichts gezogen.
- Der zuvor abgegebene Rohstoff bleibt verloren.
- Aktiver Spieler verliert 1 halbe Medaille.

### Betroffene passive Spieler
Alle Mitspieler des aktiven Spielers.

### Anzeige betroffene passive Spieler
{activePlayerName} zieht zufällig einen Rohstoff von dir.

### Danach
Begegnung abschließen.

---

## Ergebnis: Mutterschiffwurf 4 oder 5

### Anzeige aktiver Spieler
Der ehrlose Pirat verschwindet mit deinem Rohstoff und du verlierst eine halbe Medaille.

### Effekt
- Der zuvor abgegebene Rohstoff bleibt verloren.
- Aktiver Spieler verliert 1 halbe Medaille.
- Aktiver Spieler erhält keine Rohstoffe.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.
