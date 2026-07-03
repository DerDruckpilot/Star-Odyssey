# Begegnung Karte 2 – Händler

## Grunddaten

- **Kartentyp:** Händler-Begegnung
- **Aktiver Spieler:** Spieler, der die Begegnung ausgelöst hat
- **Passive Spieler:** Alle anderen Spieler
- **Öffentliche Anzeige:** Der Begegnungstext darf auf dem Spielfeld angezeigt werden.
- **Private/aktive Anzeige:** Die Auswahl und die konkreten Folgeschritte laufen im Menü des aktiven Spielers.

---

## Ausgangstext / Spielfeld

> Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

## Anzeige aktiver Spieler

> Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

## Auswahl aktiver Spieler

Der aktive Spieler wählt eine Anzahl:

- `0 Rohstoffe`
- `1 Rohstoff`
- `2 Rohstoffe`
- `3 Rohstoffe`

---

# Zweig: 0 Rohstoffe

## Anzeige aktiver Spieler

> Der Händler ist schockiert. Du verlierst eine halbe Medaille.

## Effekt

- Aktiver Spieler verliert `1 halbe Medaille`.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

> {activePlayerName} ist gerade in einer Begegnung.

## Danach

- Begegnung abschließen.

---

# Zweig: 1 Rohstoff

## Vorbedingung / Auswahl

Der aktive Spieler hat `1 Rohstoff` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau `1` vorhandenen Rohstoff auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

> Der Händler bedankt sich und du erhältst einen beliebigen Rohstoff.

## Nächster Schritt aktiver Spieler

Der aktive Spieler wählt genau `1` beliebigen Rohstoff als Belohnung.

## Effekt

- Aktiver Spieler gibt `1` selbst gewählten Rohstoff ab.
- Aktiver Spieler erhält `1` selbst gewählten beliebigen Rohstoff.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

> {activePlayerName} ist gerade in einer Begegnung.

## Danach

- Begegnung abschließen.

---

# Zweig: 2 Rohstoffe

## Vorbedingung / Auswahl

Der aktive Spieler hat `2 Rohstoffe` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau `2` vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

> Der Händler ist begeistert. Du erhältst einen beliebigen Rohstoff und eine halbe Medaille.

## Nächster Schritt aktiver Spieler

Der aktive Spieler wählt genau `1` beliebigen Rohstoff als Belohnung.

## Effekt

- Aktiver Spieler gibt `2` selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält `1` selbst gewählten beliebigen Rohstoff.
- Aktiver Spieler erhält `1 halbe Medaille`.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

> {activePlayerName} ist gerade in einer Begegnung.

## Danach

- Begegnung abschließen.

---

# Zweig: 3 Rohstoffe

## Vorbedingung / Auswahl

Der aktive Spieler hat `3 Rohstoffe` gewählt.

## Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau `3` vorhandene Rohstoffe auswählen und abgeben.

## Anzeige aktiver Spieler nach Abgabe

> Der Händler ist überglücklich. Du darfst dein Mutterschiff um einen beliebigen Ausbau erweitern und erhältst eine halbe Medaille.

## Nächster Schritt aktiver Spieler

Der aktive Spieler wählt genau `1` verfügbaren Mutterschiff-Ausbau.

Mögliche Ausbauten:

- `Antrieb`
- `Frachtmodul`
- `Bordkanone`

## Einschränkungen bei der Ausbauauswahl

Ein Ausbau darf nur auswählbar sein, wenn das jeweilige Limit noch nicht erreicht ist:

- Antrieb: maximal `6`
- Frachtmodul: maximal `5`
- Bordkanone: maximal `6`

Wenn ein Ausbau bereits am Maximum ist, darf dieser Ausbau in dieser Begegnung nicht als Belohnung gewählt werden.

Wenn nur noch eine Ausbauart verfügbar ist, kann diese direkt gewählt oder als einzige Option angezeigt werden.

Wenn keine Ausbauart mehr verfügbar ist, wird kein Ausbau hinzugefügt; die halbe Medaille wird trotzdem vergeben.

## Effekt

- Aktiver Spieler gibt `3` selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält `1` selbst gewählten verfügbaren Mutterschiff-Ausbau.
- Aktiver Spieler erhält `1 halbe Medaille`.

## Passive / nicht betroffene Spieler

Keine Aktion.

## Anzeige passive / nicht betroffene Spieler

> {activePlayerName} ist gerade in einer Begegnung.

## Danach

- Begegnung abschließen.

---

# Hinweise für Codex

## Flow-Regel

Die Karte darf nicht als vollständiger Textblock angezeigt werden. Jeder Zweig muss interaktiv und schrittweise abgearbeitet werden:

1. Ausgangstext anzeigen.
2. Aktiver Spieler wählt `0`, `1`, `2` oder `3` Rohstoffe.
3. Falls `1–3` gewählt wurde, muss der aktive Spieler zuerst die konkret abzugebenden Rohstoffe auswählen.
4. Erst nach bestätigter Abgabe wird der jeweilige Ergebnistext angezeigt.
5. Falls eine Belohnung gewählt werden muss, folgt danach die passende Auswahl:
   - bei `1` oder `2` Rohstoffen: beliebigen Rohstoff wählen
   - bei `3` Rohstoffen: verfügbaren Mutterschiff-Ausbau wählen
6. Danach Begegnung abschließen.

## Öffentliche/private Informationen

- Die konkrete Auswahl der abgegebenen Rohstoffe ist private Hand-/Ressourceninformation und soll nicht im öffentlichen Log detailliert angezeigt werden.
- Öffentlicher Log genügt z. B.:
  - `{activePlayerName} gibt für die Begegnung 2 Rohstoffe ab.`
- Passive Spieler sehen nur:
  - `{activePlayerName} ist gerade in einer Begegnung.`
