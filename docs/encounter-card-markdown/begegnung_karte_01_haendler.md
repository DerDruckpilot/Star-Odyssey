# Begegnungskarte 1 – Händler: Rohstoffe schenken

## Zweck dieser Datei

Diese Datei beschreibt die Begegnungskarte 1 als exakt umzusetzenden, interaktiven Ablauf für Codex.  
Die Begegnung darf im Spiel nicht als vollständiger Textblock angezeigt werden, sondern muss Schritt für Schritt abgehandelt werden.

---

## Grundregel Anzeige

### Öffentliche Anzeige auf dem Spielfeld

Zu Beginn der Begegnung wird öffentlich angezeigt:

> Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

### Anzeige beim aktiven Spieler

Der aktive Spieler sieht denselben Text:

> Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?

Darunter erhält der aktive Spieler vier Auswahlmöglichkeiten:

- `0 Rohstoffe`
- `1 Rohstoff`
- `2 Rohstoffe`
- `3 Rohstoffe`

### Anzeige bei nicht betroffenen passiven Spielern

Solange sie keine eigene Aktion durchführen müssen:

> {activePlayerName} ist gerade in einer Begegnung.

---

# Ablauf

## Auswahl: 0 Rohstoffe

### Anzeige aktiver Spieler

Nach Auswahl von `0 Rohstoffe` sieht der aktive Spieler:

> Der Händler erzählt allen von deiner Armut. Jeder Mitspieler schenkt dir einen Rohstoff. Du verlierst aber eine ganze Medaille.

### Passive Spieleraktion

Alle Mitspieler sind betroffen und müssen je genau 1 Rohstoff abgeben.

### Anzeige betroffener passiver Spieler

Jeder betroffene Mitspieler sieht:

> Ein Händler erzählt dir von {activePlayerName}s Armut. Schenke ihm einen Rohstoff.

Darunter wählt der betroffene Spieler genau 1 vorhandenen Rohstoff aus.

### Effekt

- Jeder Mitspieler gibt 1 selbst gewählten Rohstoff ab.
- Der aktive Spieler erhält alle so abgegebenen Rohstoffe.
- Der aktive Spieler verliert 1 ganze Medaille.

### Technische Medaillen-Präzisierung

„Eine ganze Medaille verlieren“ bedeutet regeltechnisch:

- Der aktive Spieler verliert 2 halbe Medaillen.
- Dadurch kann er 1 Siegpunkt verlieren.
- Ganze Spezialmedaillen aus Eisplaneten oder Piratenstützpunkten sind davon nicht betroffen.

### Abschluss

Wenn alle betroffenen Mitspieler je 1 Rohstoff gewählt und abgegeben haben:

- Begegnung kann abgeschlossen werden.

---

## Auswahl: 1 Rohstoff

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 1 vorhandenen Rohstoff auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe

Nach Bestätigung der Rohstoffabgabe sieht der aktive Spieler:

> Der Händler bedauert deine Armut und schenkt dir eine Nahrung. Du verlierst aber eine halbe Medaille.

### Effekt

- Aktiver Spieler gibt 1 selbst gewählten Rohstoff ab.
- Aktiver Spieler erhält 1 Nahrung.
- Aktiver Spieler verliert 1 halbe Medaille.

### Passive Spieler

Passive Spieler sind nicht betroffen.

### Anzeige passive Spieler

> {activePlayerName} ist gerade in einer Begegnung.

### Abschluss

Danach kann die Begegnung abgeschlossen werden.

---

## Auswahl: 2 Rohstoffe

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 2 vorhandene Rohstoffe auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe

Nach Bestätigung der Rohstoffabgabe sieht der aktive Spieler:

> Der Händler ist zufrieden. Du erhältst einen beliebigen Rohstoff und eine halbe Medaille.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 1 beliebigen Rohstoff als Belohnung auswählen.

Zur Auswahl stehen:

- Erz
- Treibstoff
- Carbon
- Nahrung
- Handelsware

### Effekt

- Aktiver Spieler gibt 2 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 1 selbst gewählten beliebigen Rohstoff.
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive Spieler

Passive Spieler sind nicht betroffen.

### Anzeige passive Spieler

> {activePlayerName} ist gerade in einer Begegnung.

### Abschluss

Nach Auswahl des Belohnungsrohstoffs kann die Begegnung abgeschlossen werden.

---

## Auswahl: 3 Rohstoffe

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 3 vorhandene Rohstoffe auswählen und abgeben.

### Anzeige aktiver Spieler nach Abgabe

Nach Bestätigung der Rohstoffabgabe sieht der aktive Spieler:

> Der Händler ist höchst zufrieden. Du erhältst zwei beliebige Rohstoffe und eine halbe Medaille.

### Nächster Schritt aktiver Spieler

Der aktive Spieler muss genau 2 beliebige Rohstoffe als Belohnung auswählen.

Die Auswahl darf mehrfach denselben Rohstoff enthalten, sofern das allgemeine Rohstoffsystem dies erlaubt. Falls im bestehenden UI nur einzelne Auswahlbuttons vorhanden sind, muss eine Mehrfachauswahl oder Mengenwahl möglich sein.

Zur Auswahl stehen:

- Erz
- Treibstoff
- Carbon
- Nahrung
- Handelsware

### Effekt

- Aktiver Spieler gibt 3 selbst gewählte Rohstoffe ab.
- Aktiver Spieler erhält 2 selbst gewählte beliebige Rohstoffe.
- Aktiver Spieler erhält 1 halbe Medaille.

### Passive Spieler

Passive Spieler sind nicht betroffen.

### Anzeige passive Spieler

> {activePlayerName} ist gerade in einer Begegnung.

### Abschluss

Nach Auswahl der 2 Belohnungsrohstoffe kann die Begegnung abgeschlossen werden.

---

# Wichtige technische Anforderungen

## Keine Volltextanzeige

Die Karte darf nicht als kompletter Textblock angezeigt werden.  
Immer nur der aktuelle Schritt und die aktuell gültigen Auswahlmöglichkeiten sind sichtbar.

## Ergebnistext erst nach konkreter Rohstoffabgabe

Bei Auswahl `1`, `2` oder `3 Rohstoffe` darf der jeweilige Ergebnistext erst angezeigt werden, nachdem der aktive Spieler die konkrete Anzahl Rohstoffe ausgewählt und die Abgabe bestätigt hat.

Falsch:

- Spieler klickt `2 Rohstoffe`
- Ergebnistext erscheint sofort

Richtig:

- Spieler klickt `2 Rohstoffe`
- Spieler wählt konkret 2 Rohstoffe aus
- Spieler bestätigt Abgabe
- Ergebnistext erscheint

## Passive Spieler nur bei echter Beteiligung

Passive Spieler sehen nur dann eine eigene Auswahl, wenn sie tatsächlich einen Rohstoff schenken müssen.  
Das ist nur beim Zweig `0 Rohstoffe` der Fall.

In allen anderen Zweigen sehen passive Spieler nur:

> {activePlayerName} ist gerade in einer Begegnung.

## Öffentlicher Log

Der öffentliche Log darf keine privaten konkreten Rohstoffarten aus freiwilligen Abgaben oder Geschenken verraten.

Empfohlene Logtexte:

- `{activePlayerName} gibt für die Begegnung 1 Rohstoff ab.`
- `{activePlayerName} gibt für die Begegnung 2 Rohstoffe ab.`
- `{activePlayerName} gibt für die Begegnung 3 Rohstoffe ab.`
- `{passivePlayerName} schenkt {activePlayerName} 1 Rohstoff.`
- `{activePlayerName} erhält 1 halbe Medaille.`
- `{activePlayerName} verliert 1 halbe Medaille.`
- `{activePlayerName} verliert 1 ganze Medaille.`

Keine internen Keys wie `resource_3` anzeigen.
