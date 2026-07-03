# Begegnungskarte 30 – Wanderndes Volk / Spende / Raumsprung

## Kartentyp
Begegnungskarte

## Initialer Text
Du triffst ein Raumschiff des wandernden Volkes. Dieses in der ganzen Galaxie verehrte Volk bittet dich um eine Spende. Wie viele Rohstoffe (bis zu 3) schenkst du?

## Auswahl aktiver Spieler
Der aktive Spieler wählt eine Anzahl:

- 0 Rohstoffe
- 1 Rohstoff
- 2 Rohstoffe
- 3 Rohstoffe

Hinweis: Auswahlmöglichkeiten, für die der aktive Spieler nicht genügend Rohstoffe besitzt, sollen deaktiviert sein.

---

## Zweig: 0 Rohstoffe

### Anzeige aktiver Spieler
In der ganzen Galaxie spricht man über deine schlechte Behandlung des wandernden Volkes. Du verlierst eine halbe Medaille.

### Effekt
- Aktiver Spieler gibt keine Rohstoffe ab.
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: 1 Rohstoff

### Vorbedingung / Auswahl
Der aktive Spieler hat `1 Rohstoff` gewählt.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe
In der ganzen Galaxie spricht man über deine schlechte Behandlung des wandernden Volkes. Du verlierst eine halbe Medaille.

### Effekt
- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: 2 Rohstoffe

### Vorbedingung / Auswahl
Der aktive Spieler hat `2 Rohstoffe` gewählt.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe
Du erhältst den Segen des wandernden Volkes und eine halbe Medaille.

### Effekt
- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen.

---

## Zweig: 3 Rohstoffe

### Vorbedingung / Auswahl
Der aktive Spieler hat `3 Rohstoffe` gewählt.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss genau 3 vorhandene Rohstoffe auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe
Als Dank wird dir ein Raumsprung gewährt. Wähle eines deiner Schiffe, mit diesem darfst du den Raumsprung ausführen. Zusätzlich erhältst du eine halbe Medaille.

### Effekt
- Aktiver Spieler gibt 3 selbst gewählte Rohstoffe ab.
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

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Nach abgeschlossenem Raumsprung kehrt der Flow zur Begegnung zurück und die Begegnung kann beendet werden.
