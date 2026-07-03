# Begegnungskarte 20 – Notruf / Rettung eines Diplomaten

## Kartentyp
Begegnung / Notruf / Rettung

## Anfangstext
Du erhältst den Notruf eines Raumschiffes, das antriebslos auf eine Sonne zutreibt. Möchtest du helfen?

## Auswahl aktiver Spieler
- Ja
- Nein

---

## Zweig: Nein – Hilfe verweigern

### Anzeige aktiver Spieler
Es wird bekannt, dass du einem hohen Diplomaten deine Hilfe versagt hast. Du verlierst eine halbe Medaille.

### Effekt
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: Ja – Hilfe leisten

### Anzeige aktiver Spieler
Dein linker Nachbar und du ermitteln eure Geschwindigkeit.

Bist du gleich schnell oder schneller als dein Nachbar?

### Betroffener passiver Spieler
Der linke Nachbar des aktiven Spielers wird als Vergleichspartner bestimmt.

### Anzeige betroffener passiver Spieler
{activePlayerName} versucht, einen hohen Diplomaten zu retten. Ermittle deine Geschwindigkeit mit deinem Mutterschiff.

### Aktion aktiver Spieler
Der aktive Spieler muss per Button einen Mutterschiffwurf auslösen.

### Aktion betroffener passiver Spieler
Der linke Nachbar muss per Button einen Mutterschiffwurf auslösen.

### Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Geschwindigkeitswert
Die Geschwindigkeit eines Spielers ist:

```text
Geschwindigkeit = Punktzahl der farbigen Kugeln + physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für diesen Geschwindigkeitsvergleich.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Antriebe zählen.
- Zusätzlich wirksame Antriebs-Boni aus Freundschaftskarten zählen ebenfalls zur effektiven Geschwindigkeit, zählen aber weiterhin nicht als echte Anbauten.

---

## Ergebnis: Aktiver Spieler ist gleich schnell oder schneller

### Anzeige aktiver Spieler
Du rettest einen hohen Diplomaten. Als Dank erhältst du eine halbe Medaille. Zusätzlich ziehe von jedem Mitspieler eine Karte.

### Effekt
- Aktiver Spieler erhält 1 halbe Medaille.
- Von jedem Mitspieler wird zufällig 1 vorhandene Rohstoffkarte gezogen und an den aktiven Spieler übertragen.
- Es gibt keine aktive Auswahl der gezogenen Rohstoffkarten.
- Hat ein Mitspieler keine Rohstoffkarte, wird von diesem Mitspieler nichts gezogen.

### Anzeige betroffene passive Spieler
{activePlayerName} rettet einen hohen Diplomaten und zieht zufällig eine deiner Rohstoffkarten.

### Anzeige nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist langsamer

### Anzeige aktiver Spieler
Dein Rettungsversuch scheitert. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn. Aber du erhältst für deinen Mut eine halbe Medaille.

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
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.
