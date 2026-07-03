# Begegnungskarte 23 – Piratenangriff / Fürstin des grünen Volkes

## Kartentyp
Begegnungskarte

## Ausgangstext / Spielfeld
Du siehst ein Raumschiff, das von einem Piraten angegriffen wird. Möchtest du helfen?

## Anzeige aktiver Spieler
Du siehst ein Raumschiff, das von einem Piraten angegriffen wird. Möchtest du helfen?

## Auswahl aktiver Spieler
- Ja / kämpfen
- Nein / fliehen

---

## Zweig: Nein / fliehen

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

## Zweig: Ja / kämpfen

### Anzeige aktiver Spieler
Du musst kämpfen. Dein rechter Nachbar (als Pirat) und du ermitteln eure Kampfkraft.

Bist du gleich stark oder stärker als dein Nachbar?

### Betroffener passiver Spieler
Der rechte Nachbar des aktiven Spielers wird als Pirat bestimmt.

### Anzeige betroffener passiver Spieler
Du kämpfst als Pirat gegen {activePlayerName}. Würfle mit deinem Mutterschiff.

### Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

## Kampf-Mutterschiffwurf

### Beteiligte Spieler
- Aktiver Spieler
- Rechter Nachbar des aktiven Spielers als Pirat

### Aktionen
Beide beteiligten Spieler müssen jeweils per Button einen Mutterschiffwurf auslösen:

- Aktiver Spieler würfelt mit seinem Mutterschiff.
- Rechter Nachbar würfelt als Pirat mit seinem Mutterschiff.

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
- Freundschaftskarten-Boni zählen zur effektiven Kampfkraft, werden aber nicht als echte Mutterschiff-Anbauten behandelt.

---

## Kampf-Ergebnis: Aktiver Spieler ist gleich stark oder stärker

### Anzeige aktiver Spieler
Sieg. Du rettest eine Fürstin des grünen Volkes und erhältst zwei beliebige Rohstoffe und eine halbe Medaille.

### Nächster Schritt aktiver Spieler
Der aktive Spieler wählt genau 2 beliebige Rohstoffe als Belohnung.

### Effekt
- Aktiver Spieler erhält 2 selbst gewählte beliebige Rohstoffe.
- Aktiver Spieler erhält 1 halbe Medaille.

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich gewonnen.

### Danach
Begegnung abschließen, sobald die zwei Rohstoffe gewählt wurden.

---

## Kampf-Ergebnis: Aktiver Spieler ist schwächer

### Anzeige aktiver Spieler
Niederlage. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn. Für deine mutige Tat erhältst du aber eine halbe Medaille.

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

### Anzeige betroffener passiver Spieler / Pirat
{activePlayerName} hat den Kampf gegen dich verloren.

### Danach
Begegnung abschließen.
