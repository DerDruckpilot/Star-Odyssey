# Begegnungskarte 25 – Raumzerrung / Raumsprung

## Typ
Begegnung / Raumzerrung

## Anfangstext

Du gerätst in die Nähe einer Raumzerrung. Willst du einen Raumsprung versuchen?

## Auswahl aktiver Spieler

- Ja
- Nein

---

## Zweig: Nein

### Anzeige aktiver Spieler

Ziehe eine neue Begegnungskarte.

### Effekt

- Diese Begegnung endet sofort.
- Direkt danach wird eine neue Begegnungskarte gezogen.
- Es gibt keinen Loop-Test und kein künstliches Limit.
- Auch mehrere direkt hintereinander gezogene Begegnungen sind erlaubt.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Anzeige passive / nicht betroffene Spieler

{activePlayerName} ist gerade in einer Begegnung.

### Danach

Neue Begegnung starten.

---

## Zweig: Ja

### Anzeige aktiver Spieler

Dein linker Nachbar und du ermittelt eure Geschwindigkeit.

Bist du gleich schnell oder schneller als dein Nachbar?

### Betroffener passiver Spieler

Der linke Nachbar des aktiven Spielers wird als Gegenspieler bestimmt.

### Anzeige betroffener passiver Spieler

Du ermittelst deine Geschwindigkeit gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

### Aktion aktiver Spieler

Der aktive Spieler löst per Button einen Mutterschiffwurf aus.

### Aktion betroffener passiver Spieler

Der linke Nachbar löst per Button einen Mutterschiffwurf aus.

### Spielfeld-Animation

Sobald beide Spieler ihren Mutterschiffwurf ausgelöst haben:

- Auf dem großen Spielfeld werden beide Mutterschiffe nebeneinander angezeigt.
- Beide Mutterschiffe müssen mit allen sichtbaren Anbauten dargestellt werden.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

### Geschwindigkeitswert

```text
Geschwindigkeit = Punktzahl der farbigen Kugeln + physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

### Technische Regel

Dieser Wurf ist ein Sonderwurf für diese Begegnung.

- Er zählt nur für den Geschwindigkeitsvergleich dieser Begegnung.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.
- Physisch montierte Antriebe zählen.
- Zusätzlich wirksame Antriebs-Boni aus Freundschaftskarten zählen ebenfalls.
- Freundschaftskarten-Boni zählen weiterhin nicht als echte Anbauten.

---

## Ergebnis: Aktiver Spieler ist gleich schnell oder schneller

### Anzeige aktiver Spieler

Wähle eins deiner Schiffe. Du darfst mit diesem einen Raumsprung durchführen.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss in den Tab Spielfeld wechseln und dort ein eigenes Schiff auswählen.

### Hinweis aktiver Spieler

Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe für den Raumsprung.

### Spielfeld-Aktion

- Eigene Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Danach werden gültige Raumpunkte für den Raumsprung angezeigt.
- Der aktive Spieler darf auf jeden beliebigen Raumpunkt auf der Karte springen, sofern der Punkt grundsätzlich als Zielpunkt gültig ist.
- Ungültige Raumpunkte wie das Zentrum eines Planetensystems sind keine echten Zielpunkte.

### Regel für verdeckte Raumquadranten

Verdeckte Raumquadranten dürfen durch die Zielauswahl nicht verraten werden.

- Auch bei verdeckten Raumquadranten darf zunächst der mittlere Raumpunkt auswählbar wirken.
- Dadurch darf nicht erkennbar sein, ob sich darunter ein Planetensystem befindet oder nicht.
- Falls durch die Auswahl tatsächlich ein ungültiger Raumpunkt getroffen wurde, wird das Schiff automatisch auf den nächstgelegenen gültigen Raumpunkt aus der Flugrichtung kommend versetzt.

### Raumsprung-Animation

- Für den Raumsprung wird die bereits vorhandene Spawn-/Raumsprung-Animation verwendet.
- Es wird keine normale Flugbewegung verbraucht.
- Der Raumsprung löst nach der Ankunft die normale Aufdeckungs-/Explorationsprüfung aus.

### Effekt

- Ein eigenes gewähltes Schiff des aktiven Spielers führt einen Raumsprung aus.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Anzeige passive / nicht betroffene Spieler

{activePlayerName} ist gerade in einer Begegnung.

### Danach

Begegnung abschließen.

---

## Ergebnis: Aktiver Spieler ist langsamer

### Anzeige aktiver Spieler

Der Antrieb deines Schiffs wird beschädigt. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss in den Tab Spielfeld wechseln und dort ein eigenes verfügbares Schiff auswählen.

### Hinweis aktiver Spieler

Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

### Spielfeld-Aktion

- Eigene verfügbare Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert und darf in dieser Flugphase nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

### Effekt

- Ein gewähltes eigenes Schiff des aktiven Spielers wird für diese Runde blockiert.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Anzeige passive / nicht betroffene Spieler

{activePlayerName} ist gerade in einer Begegnung.

### Danach

Begegnung abschließen.
