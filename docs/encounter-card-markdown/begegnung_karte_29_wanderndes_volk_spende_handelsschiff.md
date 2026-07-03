# Begegnungskarte 29 – Wanderndes Volk / Spende / Handelsschiff

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
Du hast Glück, dein Geiz bleibt diesmal ohne Folgen.

### Effekt
- Keine Rohstoffabgabe.
- Keine Belohnung.
- Keine Strafe.

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
Du erhältst den Segen des wandernden Volkes und eine halbe Medaille.

### Effekt
- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
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
Du erhältst ein Handelsschiff als Geschenk. Stelle das Handelsschiff so bald wie möglich auf einen deiner Raumhafenpunkte.

### Nächster Schritt aktiver Spieler
Der aktive Spieler muss das geschenkte Handelsschiff auf einem freien verfügbaren Raumhafenpunkt eines eigenen Raumhafens platzieren, sobald dies möglich ist.

### Hinweis aktiver Spieler
Wechsle in den Tab Spielfeld und wähle einen freien Raumhafenpunkt eines deiner Raumhäfen.

### Spielfeld-Aktion
- Freie verfügbare Raumhafenpunkte eigener Raumhäfen werden hervorgehoben.
- Der aktive Spieler wählt genau 1 freien eigenen Raumhafenpunkt.
- Dort wird kostenlos ein Handelsschiff platziert.
- Danach kehrt der Flow zur Begegnung zurück.

### Pending-Regel
Wenn aktuell kein freier verfügbarer Raumhafenpunkt vorhanden ist, verfällt das Geschenk nicht.

- Das Handelsschiff wird als ausstehendes Geschenk im Pending-Status gespeichert.
- Es kann später kostenlos platziert werden, sobald ein freier Raumhafenpunkt verfügbar ist.
- Die spätere Platzierung erfolgt ebenfalls auf einem freien Raumhafenpunkt eines eigenen Raumhafens.

### Transporter-/Schiffslimit
- Das geschenkte Handelsschiff zählt gegen das normale Transporter-/Raumschiff-Limit von maximal 3.
- Falls das Limit aktuell erreicht ist, bleibt das Geschenk pending, bis wieder ein Transporter verfügbar ist.
- Beim Platzieren entstehen keine zusätzlichen Rohstoffkosten.

### Effekt
- Aktiver Spieler gibt 3 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 kostenloses Handelsschiff.
- Das Handelsschiff wird sofort platziert, wenn ein gültiger Raumhafenpunkt verfügbar ist.
- Falls kein gültiger Raumhafenpunkt verfügbar ist oder das Schiffslimit erreicht ist, wird das Handelsschiff als Pending-Geschenk gespeichert.

### Passive / nicht betroffene Spieler
Keine Aktion.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

### Danach
Begegnung abschließen, sobald das Handelsschiff platziert oder als Pending-Geschenk gespeichert wurde.

---

# Technische Hinweise für Codex

- Bei allen Rohstoffabgaben wählt der aktive Spieler konkrete vorhandene Rohstoffe aus.
- Öffentlicher Log nennt bei privaten Rohstoffabgaben nur die Anzahl, nicht die konkreten Rohstofftypen.
- Passive Spieler sehen bei dieser Karte keine Details und führen keine Aktionen aus.
- Bei 3 Rohstoffen wird eine Handelsschiff-Platzierung über den Spielfeld-Tab oder ein Pending-Geschenk benötigt.
