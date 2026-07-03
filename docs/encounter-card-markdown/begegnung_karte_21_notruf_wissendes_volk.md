# Begegnungskarte 21 – Notruf / Fürst des wissenden Volkes

## Anfangstext
Du erhältst den Notruf eines Raumschiffes, das antriebslos auf eine Sonne zutreibt. Möchtest du helfen?

## Auswahl aktiver Spieler
- Ja
- Nein

---

## Zweig: Nein – Hilfe verweigern

### Anzeige aktiver Spieler
Dein eigennütziges Verhalten wird bekannt. Du verlierst eine halbe Medaille.

### Effekt
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: Ja – Helfen

### Anzeige aktiver Spieler
Dein rechter Nachbar und du ermitteln eure Geschwindigkeit.

Bist du gleich schnell oder schneller als dein Nachbar?

### Betroffener passiver Spieler
Der rechte Nachbar des aktiven Spielers wird als Vergleichsspieler bestimmt.

### Anzeige betroffener passiver Spieler
{activePlayerName} versucht ein Raumschiff zu retten. Ermittle deine Geschwindigkeit mit deinem Mutterschiff.

### Aktion aktiver Spieler
Der aktive Spieler löst per Button einen Mutterschiffwurf aus.

### Aktion betroffener passiver Spieler
Der rechte Nachbar löst per Button einen Mutterschiffwurf aus.

### Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase wird abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Geschwindigkeitswert
Die Geschwindigkeit eines Spielers ist:

```text
Punktzahl der farbigen Kugeln + physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für den Geschwindigkeitsvergleich.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Antriebe zählen.
- Zusätzlich wirksame Antriebs-Boni aus Freundschaftskarten zählen ebenfalls zur effektiven Geschwindigkeit, zählen aber weiterhin nicht als echte Anbauten.

---

## Ergebnis: Aktiver Spieler ist gleich schnell oder schneller

### Anzeige aktiver Spieler
Du rettest einen Fürsten des wissenden Volkes. Erweitere dein Mutterschiff sofort um einen beliebigen Ausbau. Du erhältst eine halbe Medaille.

### Nächster Schritt aktiver Spieler
Der aktive Spieler wählt einen verfügbaren Mutterschiff-Ausbau.

### Ausbau-Auswahl
Angeboten werden nur Ausbauten, deren Limit noch nicht erreicht ist:

- Antrieb, maximal 6 echte Anbauten
- Frachtmodul, maximal 5 echte Anbauten
- Bordkanone, maximal 6 echte Anbauten

### Effekt
- Aktiver Spieler erhält 1 gewählten Mutterschiff-Ausbau.
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist langsamer

### Anzeige aktiver Spieler
Dein Rettungsversuch scheitert. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn.

### Nächster Schritt aktiver Spieler
Der aktive Spieler wählt einen vorhandenen echten Mutterschiff-Ausbau aus.

### Ausbau-Auswahl
Angeboten werden nur tatsächlich vorhandene echte Anbauten:

- Antrieb
- Frachtmodul
- Bordkanone

Freundschaftskarten-Boni werden nicht entfernt.

### Effekt
- Der gewählte echte Mutterschiff-Ausbau wird entfernt.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.
