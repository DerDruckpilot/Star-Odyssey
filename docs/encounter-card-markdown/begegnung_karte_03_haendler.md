# Begegnung Karte 3 – Händler

## Ausgangstext / Spielfeld

Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

## Anzeige aktiver Spieler

Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

## Auswahl aktiver Spieler

Der aktive Spieler wählt eine Anzahl:

- 0 Rohstoffe
- 1 Rohstoff
- 2 Rohstoffe
- 3 Rohstoffe

## Passive / nicht betroffene Spieler – Standardanzeige

Wenn passive Spieler in einem Zweig keine eigene Aktion haben, sehen sie nur:

`{activePlayerName} ist gerade in einer Begegnung.`

---

## Zweig: 0 Rohstoffe

### Anzeige aktiver Spieler

Der Händler ist außer sich vor Wut und schwärzt dich bei den anderen Völkern an. Du verlierst eine halbe Medaille.

### Effekt

- Aktiver Spieler verliert 1 halbe Medaille.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Danach

Begegnung abschließen.

---

## Zweig: 1 Rohstoff

### Vorbedingung / Auswahl

Der aktive Spieler hat `1 Rohstoff` gewählt.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe

Der Händler nimmt dein Geschenk mürrisch entgegen, macht dir aber kein Gegengeschenk.

### Effekt

- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
- Aktiver Spieler erhält nichts.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Danach

Begegnung abschließen.

---

## Zweig: 2 Rohstoffe

### Vorbedingung / Auswahl

Der aktive Spieler hat `2 Rohstoffe` gewählt.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe

Leider hast du einen geizigen Händler erwischt. Immerhin erhältst du eine halbe Medaille.

### Effekt

- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Danach

Begegnung abschließen.

---

## Zweig: 3 Rohstoffe

### Vorbedingung / Auswahl

Der aktive Spieler hat `3 Rohstoffe` gewählt.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 3 vorhandene Rohstoffe auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe

Leider hast du einen geizigen Händler erwischt. Immerhin erhältst du eine Handelsware und eine halbe Medaille.

### Effekt

- Aktiver Spieler gibt 3 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 Handelsware.
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Danach

Begegnung abschließen.

---

## Hinweise für Codex

- Diese Karte ist eine Händlerkarte mit Auswahl `0`, `1`, `2` oder `3` Rohstoffe.
- Bei Auswahl von `1`, `2` oder `3` Rohstoffen muss der aktive Spieler zuerst die konkrete Rohstoffauswahl treffen und bestätigen.
- Ergebnistext und Effekte dürfen erst nach bestätigter Rohstoffabgabe ausgelöst werden.
- Passive Spieler haben bei dieser Karte keine Aktion.
- Passive Spieler sehen nur den neutralen Hinweis `{activePlayerName} ist gerade in einer Begegnung.`
- Öffentliche Logs sollen keine konkreten abgegebenen Rohstoffarten nennen, sondern nur die Anzahl, z. B. `{activePlayerName} gibt für die Begegnung 3 Rohstoffe ab.`
