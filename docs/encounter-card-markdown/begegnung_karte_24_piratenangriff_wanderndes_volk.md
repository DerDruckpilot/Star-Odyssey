# Begegnungskarte 24 – Piratenangriff / Wanderndes Volk / Raumsprung

## Kartentyp
Begegnungskarte

## Initialer Text
Du siehst ein Raumschiff, das von einem Piraten angegriffen wird. Möchtest du helfen?

## Auswahl aktiver Spieler
- Ja
- Nein

---

## Zweig: Nein

### Anzeige aktiver Spieler
Deine feige Flucht wird bekannt. Du verlierst eine halbe Medaille.

### Effekt
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: Ja

### Anzeige aktiver Spieler
Du musst kämpfen. Dein linker Nachbar (als Pirat) und du ermitteln eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

### Betroffener passiver Spieler
Der linke Nachbar des aktiven Spielers wird als Pirat bestimmt.

### Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

### Aktion aktiver Spieler
Der aktive Spieler muss per Button einen Kampf-Mutterschiffwurf auslösen.

### Aktion betroffener passiver Spieler
Der linke Nachbar muss per Button einen Kampf-Mutterschiffwurf auslösen.

### Spielfeld-Animation
Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Kampfkraft
```text
Kampfkraft = Punktzahl der farbigen Kugeln + physisch montierte Bordkanonen + Bordkanonen-Boni aus Freundschaftskarten
```

### Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für den Kampf.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Bordkanonen zählen.
- Zusätzlich wirksame Bordkanonen-Boni aus Freundschaftskarten zählen ebenfalls zur effektiven Kampfkraft, zählen aber weiterhin nicht als echte Anbauten.

---

## Kampf-Ergebnis: Aktiver Spieler ist gleich stark oder stärker

### Anzeige aktiver Spieler
Sieg. Du rettest ein Raumschiff des wandernden Volkes. Wähle eines deiner Schiffe. Mit diesem Schiff darfst du einen Raumsprung ausführen. Zusätzlich erhältst du eine halbe Medaille.

### Effekt
- Aktiver Spieler erhält 1 halbe Medaille.
- Aktiver Spieler darf mit genau 1 eigenen Schiff einen Raumsprung ausführen.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss in den Tab `Spielfeld` wechseln.

### Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld, wähle eines deiner Schiffe und führe mit diesem Schiff einen Raumsprung aus.

### Spielfeld-Aktion: Schiff wählen
- Eigene Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Danach werden gültige Ziel-Raumpunkte für den Raumsprung markiert.

### Spielfeld-Aktion: Raumsprung-Ziel wählen
- Das gewählte Schiff darf auf einen beliebigen Raumpunkt auf der Karte springen.
- Ungültige Raumpunkte sind nicht als finales Ziel erlaubt.
- Das Zentrum eines sichtbaren Planetensystems ist kein gültiger Raumpunkt.
- Bereits besetzte oder anderweitig blockierte Raumpunkte bleiben ungültig.

### Verdeckte Raumquadranten / keine Spoiler
Bei verdeckten Raumquadranten darf der Spieler nicht erkennen können, ob darunter ein Planetensystem liegt.

- Der mittlere Raumpunkt eines verdeckten Raumquadranten darf zunächst auswählbar bleiben.
- Falls sich darunter später ein Planetensystem befindet und der gewählte Punkt dadurch eigentlich ungültig wäre, wird das Schiff automatisch auf den nächstgelegenen gültigen Raumpunkt aus der Anflugrichtung kommend versetzt.
- Die Auswahl darf verdeckte Planetensysteme nicht vorzeitig verraten.

### Raumsprung-Animation
- Für den Raumsprung wird die bereits vorhandene Spawn-/Raumsprung-Animation verwendet.
- Das Schiff verschwindet am alten Ort und erscheint am neuen Zielpunkt mit der bestehenden Raumsprung-Spawn-Animation.
- Es wird keine normale Flugbewegung verbraucht.

### Aufdeckung
Falls der Raumsprung auf einem Raumpunkt endet, der angrenzend zu einem verdeckten Raumquadranten liegt, wird die normale Aufdeckungslogik nach der Ankunft ausgelöst.

### Danach
Nach abgeschlossenem Raumsprung kehrt der Flow zur Begegnung zurück und die Begegnung kann beendet werden.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

---

## Kampf-Ergebnis: Aktiver Spieler ist schwächer

### Anzeige aktiver Spieler
Niederlage. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen. Für deinen Mut erhältst du aber eine halbe Medaille.

### Effekt
- Aktiver Spieler erhält 1 halbe Medaille.
- Aktiver Spieler muss 1 eigenes verfügbares Schiff auswählen.
- Dieses Schiff darf in dieser Runde nicht fliegen.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss in den Tab `Spielfeld` wechseln.

### Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

### Spielfeld-Aktion
- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert.
- Danach kehrt der Flow zur Begegnung zurück.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach
Begegnung abschließen.
