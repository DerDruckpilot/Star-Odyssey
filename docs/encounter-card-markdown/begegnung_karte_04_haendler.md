# Begegnung Karte 04 – Händler

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

---

## Zweig: 0 Rohstoffe

### Anzeige aktiver Spieler

Der freundliche Händler ist enttäuscht. Aus Mitleid schenkt er dir eine Handelsware.

### Effekt

- Aktiver Spieler gibt keine Rohstoffe ab.
- Aktiver Spieler erhält 1 Handelsware.

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

Der freundliche Händler ist von deinem Geschenk angetan. Du erhältst einen beliebigen Rohstoff und eine halbe Medaille.

### Nächster Schritt aktiver Spieler

Der aktive Spieler wählt genau 1 beliebigen Rohstoff als Belohnung.

### Effekt

- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
- Aktiver Spieler erhält 1 selbst gewählten beliebigen Rohstoff.
- Aktiver Spieler erhält 1 halbe Medaille.

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

Der freundliche Händler ist höchstbegeistert. Du erhältst zwei beliebige Rohstoffe und eine halbe Medaille.

### Nächster Schritt aktiver Spieler

Der aktive Spieler wählt genau 2 beliebige Rohstoffe als Belohnung.

### Effekt

- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 2 selbst gewählte beliebige Rohstoffe.
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

Der Händler wird misstrauisch und gibt dir dein Geschenk zurück.

### Effekt

- Aktiver Spieler gibt zunächst 3 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält genau diese 3 abgegebenen Rohstoffe wieder zurück.
- Netto ändern sich die Rohstoffe nicht.

### Passive / nicht betroffene Spieler

Keine Aktion.

### Anzeige passive / nicht betroffene Spieler

{activePlayerName} ist gerade in einer Begegnung.

### Danach

Begegnung abschließen.
