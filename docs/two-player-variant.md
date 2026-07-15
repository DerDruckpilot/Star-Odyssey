# Star Odyssey: Zwei-Spieler-Variante

**Status:** MASSGEBLICHE PROJEKTREGEL
**Stand:** 2026-07-15

Diese Variante ist eine bewusste Star-Odyssey-Erweiterung. Das offizielle Brettspiel sieht regulaer drei oder vier Spieler vor.

## Auswahl und Aufbau

- Im Neuspiel-Setup sind 2, 3 und 4 Spieler waehbar.
- Zwei Spieler koennen sowohl `Klassisches Spiel` als auch `Supernova` waehlen.
- Es wird das vollstaendige, fuer drei Spieler bereits bewaehrte Brettlayout verwendet. Es gibt keine eigene kleinere Boardgeometrie.
- Beide Spieler erhalten normale Startmaterialien und fuehren Startwuerfe sowie Startplatzierungen nach dem bestehenden Ablauf aus.
- Es gibt keine Bots, keine neutrale KI und keine zusaetzlichen kostenlosen Startgebaeude.
- Die QR-Lobby erzeugt genau zwei menschliche Controller-Slots.

## Klassisches Spiel

Ausserhalb der Startgalaxien gelten in Drei-Planeten-Systemen zwei Begrenzungen:

1. Insgesamt duerfen hoechstens zwei Kolonien bzw. Raumhaefen errichtet werden.
2. Jeder Spieler darf dort hoechstens eine eigene Kolonie bzw. einen eigenen Raumhafen besitzen.

Die Begrenzung wird bereits bei der Zielauswahl eines Kolonieschiffs und erneut beim Gruenden geprueft. Baukosten, Produktion, Startausstattung, Siegpunktziel und die sonstigen Classic-Regeln bleiben unveraendert.

## Supernova

- Die Classic-Zusatzbegrenzung pro Spieler gilt nicht.
- Fabriken, Schlachtschiffe, Missionskarten und Fabrikmehrheiten funktionieren unveraendert.
- Die Siegbedingung bleibt mindestens 15 Siegpunkte und mindestens eine erfuellte Mission waehrend des eigenen Zuges.

## Missionskompatibilitaet

Alle 25 Missionskarten wurden nach Kategorie und technischer Bedingung geprueft. Keine Mission setzt zwingend mehr als einen Gegenspieler voraus. Deshalb bleibt der vollstaendige Missionsstapel auch im Zwei-Spieler-Modus aktiv; es gibt keine Sonderausschluesse und keine umformulierten Kartentexte.

## Bewusst unveraendert

- Baukosten und Produktionswerte
- Startmaterialien
- Zug- und Rundenfolge
- Mehrheitsregeln; Gleichstand bedeutet weiterhin keine alleinige Mehrheit
- Classic- und Supernova-Siegbedingungen
- Save-/Load- und portable Backup-Struktur

## Technische Abgrenzung

Die Spielerzahl wird als `playerCount: 2` gespeichert. Bestehende Spielstaende mit drei oder vier Spielern bleiben unveraendert. Classic-spezifische Besiedlungsgrenzen sind an Spielerzahl und Variante gebunden und beeinflussen Supernova sowie Drei-/Vier-Spieler-Partien nicht.
