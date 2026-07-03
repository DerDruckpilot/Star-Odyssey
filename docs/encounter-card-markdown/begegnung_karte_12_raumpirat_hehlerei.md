# Begegnungskarte 12 – Raumpirat / Rohstofftausch / Hehlerei

## Kartentyp
Begegnungskarte

## Ausgangstext / Spielfeld
Du triffst einen Raumpiraten, der dir anbietet, einen deiner Rohstoffe gegen zwei beliebige andere umzutauschen. Willigst du ein?

## Anzeige aktiver Spieler
Du triffst einen Raumpiraten, der dir anbietet, einen deiner Rohstoffe gegen zwei beliebige andere umzutauschen. Willigst du ein?

## Auswahl aktiver Spieler
Der aktive Spieler wählt:

- Ja
- Nein

## Passive / nicht betroffene Spieler
Keine Aktion.

## Anzeige passive / nicht betroffene Spieler
{activePlayerName} ist gerade in einer Begegnung.

---

# Zweig: Nein

## Vorbedingung / Auswahl
Der aktive Spieler hat `Nein` gewählt.

## Anzeige aktiver Spieler
Du fliegst weiter und erhältst eine halbe Medaille.

## Effekt
- Aktiver Spieler erhält 1 halbe Medaille.
- Es findet kein Rohstofftausch statt.

## Danach
Begegnung abschließen.

---

# Zweig: Ja

## Vorbedingung / Auswahl
Der aktive Spieler hat `Ja` gewählt.

## Anzeige aktiver Spieler
Tausche einen beliebigen Rohstoff gegen zwei beliebige andere ein. Würfle anschließend mit deinem Mutterschiff.

## Nächster Schritt aktiver Spieler
Der aktive Spieler muss:

1. genau 1 vorhandenen Rohstoff auswählen und abgeben,
2. genau 2 beliebige andere Rohstoffe auswählen, die er erhalten möchte,
3. den Tausch mit einem Mutterschiffwurf bestätigen.

## Rohstofftausch
- Aktiver Spieler gibt 1 selbst gewählten vorhandenen Rohstoff ab.
- Aktiver Spieler erhält 2 selbst gewählte beliebige andere Rohstoffe.
- Die erhaltenen Rohstoffe werden für die spätere Auswertung dieser Begegnung als `eingetauschte Rohstoffe` markiert.

## Mutterschiffwurf
Nach dem Rohstofftausch löst der aktive Spieler per Button einen Mutterschiffwurf aus.

## Spielfeld-Animation
- Auf dem großen Spielfeld wird das Mutterschiff des aktiven Spielers angezeigt.
- Es wird der Mutterschiff-Shake wie bei der Ermittlung der Grundgeschwindigkeit in der Flugphase abgespielt.
- Die farbigen Kugeln werden sichtbar ausgewertet.

## Wertung des Mutterschiffwurfs
Für diese Begegnung zählt ausschließlich die Punktzahl der farbigen Kugeln.

Nicht mitzählen:

- montierte Antriebe,
- montierte Frachtmodule,
- montierte Bordkanonen,
- Freundschaftskarten-Boni,
- sonstige Ausbauten oder Boni.

## Technische Regel
Dieser Wurf ist ein Sonderwurf für die Begegnung.

- Er zählt nur für die Hehlerei-Auswertung.
- Er verändert nicht die aktuelle Fluggeschwindigkeit.
- Er ersetzt keinen normalen Mutterschiffwurf der Flugphase.

---

# Ergebnis: Kugelwert 1 oder 2

## Anzeige aktiver Spieler
Es gibt Gerüchte, dass du dich der Hehlerei schuldig gemacht hast. Du verlierst eine halbe Medaille.

## Effekt
- Aktiver Spieler verliert 1 halbe Medaille.
- Die eingetauschten Rohstoffe bleiben beim aktiven Spieler.

## Danach
Begegnung abschließen.

---

# Ergebnis: Kugelwert 3

## Anzeige aktiver Spieler
Die galaktische Polizei überführt dich der Hehlerei. Du verlierst die eingetauschten zwei Rohstoffe und eine halbe Medaille.

## Effekt
- Aktiver Spieler verliert die 2 zuvor eingetauschten Rohstoffe.
- Aktiver Spieler verliert 1 halbe Medaille.

## Danach
Begegnung abschließen.

---

# Ergebnis: Kugelwert 4 oder 5

## Anzeige aktiver Spieler
Der Pirat bedankt sich und wünscht dir einen guten Weiterflug.

## Effekt
- Aktiver Spieler behält die eingetauschten Rohstoffe.
- Keine Medaillenänderung.

## Danach
Begegnung abschließen.
