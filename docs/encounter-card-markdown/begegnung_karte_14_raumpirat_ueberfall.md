# Begegnungskarte 14 – Raumpirat / Überfall

## Kartentyp
Begegnungskarte – Raumpirat

## Ausgangstext / Spielfeld
Du begegnest einem Raumpiraten, der dir anbietet, für einen beliebigen Rohstoff deine Mitspieler zu überfallen. Bist du einverstanden?

## Anzeige aktiver Spieler
Du begegnest einem Raumpiraten, der dir anbietet, für einen beliebigen Rohstoff deine Mitspieler zu überfallen. Bist du einverstanden?

## Auswahl aktiver Spieler
Der aktive Spieler wählt:

- Ja
- Nein

---

# Zweig: Nein

## Anzeige aktiver Spieler
Du fliegst weiter und erhältst eine halbe Medaille.

## Effekt
- Aktiver Spieler erhält 1 halbe Medaille.

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

## Danach
Begegnung abschließen.

---

# Zweig: Ja

## Anzeige aktiver Spieler
Gib einen beliebigen Rohstoff ab und würfle anschließend mit deinem Mutterschiff.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

## Danach
Der aktive Spieler löst per Button einen Mutterschiffwurf aus.

---

# Mutterschiffwurf

## Anzeige aktiver Spieler
Würfle mit deinem Mutterschiff.

## Spielfeld-Animation
- Auf dem großen Spielfeld wird das Mutterschiff des aktiven Spielers angezeigt.
- Das Mutterschiff muss mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

## Wertung
Für diese Begegnung zählt ausschließlich der Punktwert der farbigen Kugeln.

```text
Wurfwert = Punktzahl der farbigen Kugeln
```

## Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für diese Begegnung.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Ausbauten, Bordkanonen und Freundschaftskarten-Boni zählen bei dieser Karte nicht zum Ergebnis.

---

# Auswertung Mutterschiffwurf

## Ergebnis: Wurfwert 1 oder 2

### Anzeige aktiver Spieler
Der ehrlose Pirat verschwindet mit deinem Rohstoff und du verlierst eine halbe Medaille.

### Effekt
- Der zuvor abgegebene Rohstoff bleibt verloren.
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Ergebnis: Wurfwert 3

### Anzeige aktiver Spieler
Zieh von jedem deiner Mitspieler eine Rohstoffkarte, du verlierst aber eine halbe Medaille.

### Effekt
- Der zuvor abgegebene Rohstoff bleibt verloren.
- Von jedem Mitspieler wird zufällig 1 Rohstoffkarte gezogen und dem aktiven Spieler gegeben.
- Aktiver Spieler verliert 1 halbe Medaille.

### Technische Regel Rohstoffziehung
- Die Rohstoffe werden automatisch zufällig aus dem Bestand der jeweiligen Mitspieler gezogen.
- Der aktive Spieler wählt die Rohstoffe nicht selbst aus.
- Die passiven Spieler wählen die Rohstoffe ebenfalls nicht selbst aus.
- Hat ein Mitspieler keine Rohstoffe, wird von diesem Mitspieler nichts gezogen.
- Konkrete gezogene Rohstoffarten bleiben im öffentlichen Log geheim.

### Anzeige betroffene passive Spieler
{activePlayerName} zieht zufällig eine deiner Rohstoffkarten.

### Anzeige nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Ergebnis: Wurfwert 4 oder 5

### Anzeige aktiver Spieler
Zieh von jedem deiner Mitspieler eine Rohstoffkarte.

### Effekt
- Der zuvor abgegebene Rohstoff bleibt verloren.
- Von jedem Mitspieler wird zufällig 1 Rohstoffkarte gezogen und dem aktiven Spieler gegeben.
- Aktiver Spieler verliert keine halbe Medaille.

### Technische Regel Rohstoffziehung
- Die Rohstoffe werden automatisch zufällig aus dem Bestand der jeweiligen Mitspieler gezogen.
- Der aktive Spieler wählt die Rohstoffe nicht selbst aus.
- Die passiven Spieler wählen die Rohstoffe ebenfalls nicht selbst aus.
- Hat ein Mitspieler keine Rohstoffe, wird von diesem Mitspieler nichts gezogen.
- Konkrete gezogene Rohstoffarten bleiben im öffentlichen Log geheim.

### Anzeige betroffene passive Spieler
{activePlayerName} zieht zufällig eine deiner Rohstoffkarten.

### Anzeige nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.
