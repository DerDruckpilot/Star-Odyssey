# Begegnung Karte 5 – Händler / Handelsfürst

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

Passive / nicht betroffene Spieler sehen währenddessen nur:

`{activePlayerName} ist gerade in einer Begegnung.`

---

# Zweig: 0 Rohstoffe

## Anzeige aktiver Spieler

Der beleidigte Handelsfürst sabotiert dein Schiff. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen. Zusätzlich verlierst du eine halbe Medaille.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss ein eigenes verfügbares Schiff auswählen.

## Hinweis aktiver Spieler

Wechsle in den Tab Spielfeld und wähle eines deiner Schiffe.

## Spielfeld-Aktion

- Eigene Schiffe des aktiven Spielers werden hervorgehoben.
- Der aktive Spieler wählt genau 1 eigenes Schiff.
- Das gewählte Schiff wird für diese Runde blockiert und darf in dieser Flugphase nicht fliegen.
- Danach kehrt der Flow zur Begegnung zurück.

## Effekt

- Aktiver Spieler verliert 1 halbe Medaille.
- Ein gewähltes eigenes Schiff des aktiven Spielers wird für diese Runde blockiert.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

`{activePlayerName} ist gerade in einer Begegnung.`

## Danach

Begegnung abschließen.

---

# Zweig: 1 Rohstoff

## Vorbedingung / Auswahl

Der aktive Spieler hat `1 Rohstoff` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

Der Handelsfürst ist enttäuscht. Du verlierst eine halbe Medaille.

## Effekt

- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
- Aktiver Spieler verliert 1 halbe Medaille.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

`{activePlayerName} ist gerade in einer Begegnung.`

## Danach

Begegnung abschließen.

---

# Zweig: 2 Rohstoffe

## Vorbedingung / Auswahl

Der aktive Spieler hat `2 Rohstoffe` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

Der Handelsfürst ist zufrieden. Du erhältst einen beliebigen Rohstoff und eine halbe Medaille.

## Nächster Schritt aktiver Spieler

Der aktive Spieler wählt genau 1 beliebigen Rohstoff als Belohnung.

## Effekt

- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 selbst gewählten beliebigen Rohstoff.
- Aktiver Spieler erhält 1 halbe Medaille.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

`{activePlayerName} ist gerade in einer Begegnung.`

## Danach

Begegnung abschließen.

---

# Zweig: 3 Rohstoffe

## Vorbedingung / Auswahl

Der aktive Spieler hat `3 Rohstoffe` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 3 vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

Der begeisterte Handelsfürst schenkt dir ein Handelsschiff, das du so bald wie möglich auf einen deiner Raumhafenpunkte aufstellst.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss das geschenkte Handelsschiff auf einem eigenen freien Raumhafenpunkt platzieren, sobald dies möglich ist.

## Spielfeld-Aktion

- Wenn mehrere freie eigene Raumhafenpunkte verfügbar sind:
  - Wechsle in den Tab Spielfeld.
  - Hebe alle gültigen freien Raumhafenpunkte eigener Raumhäfen hervor.
  - Der aktive Spieler wählt genau 1 gültigen Punkt.
  - Das Handelsschiff wird dort kostenlos platziert.
- Wenn genau 1 freier eigener Raumhafenpunkt verfügbar ist:
  - Das Handelsschiff wird automatisch dort platziert.
- Wenn kein freier eigener Raumhafenpunkt verfügbar ist:
  - Das Handelsschiff wird als pending Geschenk gespeichert.
  - Das Geschenk verfällt nicht.
  - Es muss später kostenlos platziert werden, sobald der Spieler erneut an der Reihe ist und ein freier eigener Raumhafenpunkt verfügbar ist.

## Effekt

- Aktiver Spieler gibt 3 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 geschenktes Handelsschiff.
- Das geschenkte Handelsschiff zählt gegen das normale Transporter-/Raumschiff-Limit von maximal 3.
- Falls das Limit aktuell erreicht ist, bleibt das Geschenk pending, bis wieder ein Transporter verfügbar ist.
- Beim Platzieren entstehen keine zusätzlichen Rohstoffkosten.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

`{activePlayerName} ist gerade in einer Begegnung.`

## Danach

- Wenn das Handelsschiff sofort platziert werden konnte: Begegnung abschließen.
- Wenn das Handelsschiff pending bleibt: Pending-Status speichern und Begegnung abschließen.

---

# Technische Hinweise für Codex

- Bei allen Rohstoffabgaben wählt der aktive Spieler konkrete vorhandene Rohstoffe aus.
- Öffentlicher Log nennt bei privaten Rohstoffabgaben nur die Anzahl, nicht die konkreten Rohstofftypen.
- Bei 0 Rohstoffen wird eine Schiffsauswahl über den Spielfeld-Tab benötigt.
- Bei 3 Rohstoffen wird eine Handelsschiff-Platzierung über den Spielfeld-Tab oder ein Pending-Geschenk benötigt.
- Passive Spieler sehen bei dieser Karte keine Details und führen keine Aktionen aus.
