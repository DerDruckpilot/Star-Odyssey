# Assets Plan

Star Odyssey soll frueh mit eigenen PNG-Assets arbeiten. Canvas bleibt die technische Zeichenflaeche, aber sichtbare Spielobjekte sollen nicht dauerhaft aus einfachen Doodle-Platzhaltern bestehen.

## Grundsaetze

- Eigene Assets erstellen, keine Originalgrafiken aus Referenzmaterial kopieren.
- An der Referenz nur Lesbarkeit, Funktion und grobe Brettspiel-Sprache ableiten.
- PNG mit transparentem Hintergrund fuer Spielobjekte.
- Iterativ arbeiten: erst brauchbare eigene Assets, spaeter polieren.
- Aseprite bevorzugt per CLI, Lua oder Exportpipeline einbinden.
- Assets klein, konsistent und gut skalierbar halten.

## Geplante Asset-Gruppen

- Logo/Schriftzug Star Odyssey.
- Weltraum-Hintergrund.
- Hex-/Raumpunkt-Linien oder Board-Overlay.
- Planetentyp Erz: roter Planet.
- Planetentyp Treibstoff: orangener Planet.
- Planetentyp Carbon: blauer Planet.
- Planetentyp Nahrung: gruener Planet.
- Planetentyp Handelsware: lila gestreifter Planet.
- Zahlenmarker.
- Schiffe.
- Kolonien, Stationen und Raumhaefen.
- Aussenposten oder fraktionsartige Orte.
- Ressourcenicons.
- UI-Buttons.
- QR-Code-Panel.

## Planetenstil

Die Planeten sollen klar unterscheidbar sein und nicht nur aus flachen Farbkreisen bestehen. Jeder Typ bekommt ein eigenes Motiv:

- Erz: felsig, rot, mineralisch.
- Treibstoff: warm, orange, energiegeladen.
- Carbon: blau, kristallin oder technisch.
- Nahrung: gruen, lebendig oder organisch.
- Handelsware: lila gestreift, exotisch und wertvoll.

## Animationen

- Subtile Sterne im Hintergrund.
- Leichte Atmosphaeren- oder Wolkenbewegung bei Planeten.
- Dezenter Schimmer fuer Marker oder auswaehlbare Knoten.
- UI-Highlights nur dort, wo sie eine Aktion erklaeren.
- Keine ablenkenden Effekte, keine Action-Spiel-Anmutung.

## Asset-Pipeline

Spaetere PRs sollen eine einfache Struktur etablieren:

- Quelldateien oder Aseprite-Projekte getrennt von exportierten PNGs.
- Exportierte PNGs unter `assets/`.
- Klare Dateinamen fuer Typ, Zustand und Groesse.
- Keine fremden Marken, Figuren, Sounds oder geschuetzten Originalassets.
