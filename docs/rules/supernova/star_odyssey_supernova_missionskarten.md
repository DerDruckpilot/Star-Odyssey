# Star Odyssey – Supernova-Erweiterung: Missionskarten und Siegpunktkarten

Diese Datei enthält die aus dem Foto ausgelesenen Texte der 25 Missionskarten und 5 Siegpunktkarten der Fan-Erweiterung **Supernova** für *Die Sternenfahrer von Catan*.

## Begriffsanpassung für Star Odyssey

Die Vorlage verwendet stellenweise den Begriff **RR / Ruhmesringe**. In Star Odyssey gibt es diese Bezeichnung nicht. Für die Implementierung gilt daher:

- **RR** = **halbe Medaillen**
- **Ruhmesringe** = **halbe Medaillen**
- **Ruhmeskampf** = **Kampf um halbe Medaillen**

Die Kartentexte sind ansonsten möglichst wortgetreu übernommen. Die Missionsfarben sind anhand der sichtbaren Titelfarbe im Foto notiert und sollten bei Bedarf noch einmal gegen die Originalkarten geprüft werden.

---

# 1. Missionskarten

## M01 – FRACHTER

- **Titelfarbe:** Blau
- **Kartentext:** Es müssen alle 5 Frachtringe am Mutterschiff ausgebaut werden.
- **Implementationshinweis:** Prüfen, ob alle 5 Frachtring-Upgrades am Mutterschiff vorhanden sind.

## M02 – NAHRUNGS FABRIKANT

- **Titelfarbe:** Violett / Rosa
- **Kartentext:** Es muss die Siegpunktkarte "Landwirt" in Besitz sein.
- **Implementationshinweis:** Prüfen, ob der Spieler aktuell die Siegpunktkarte `Landwirt` besitzt.

## M03 – HANDELS WAREN FABRIKANT

- **Titelfarbe:** Violett / Rosa
- **Kartentext:** Es muss die Siegpunktkarte "Handelsmeister" in Besitz sein.
- **Implementationshinweis:** Prüfen, ob der Spieler aktuell die Siegpunktkarte `Handelsmeister` besitzt.

## M04 – HÄNDLER

- **Titelfarbe:** Gelb
- **Kartentext:** Es müssen mindestens 3 eigene Kolonien an Handelsware-Planeten gegründet werden (ohne Alpha bis Delta).
- **Implementationshinweis:** Kolonien an Handelswaren-Planeten zählen, Startgalaxien Alpha bis Delta ausschließen.

## M05 – CARBON SCHÜRFER

- **Titelfarbe:** Gelb
- **Kartentext:** Es müssen mindestens 3 eigene Kolonien an Carbon-Planeten gegründet werden (ohne Alpha bis Delta).
- **Implementationshinweis:** Kolonien an Carbon-Planeten zählen, Startgalaxien Alpha bis Delta ausschließen.

## M06 – ENTDECKER

- **Titelfarbe:** Grün
- **Kartentext:** Es muss mindestens je eine Kolonie an den entferntesten Systemen gegründet werden.
- **Implementationshinweis:** Prüfen, ob an jedem als „entferntestes System“ definierten System mindestens eine eigene Kolonie steht.

## M07 – TREIBSTOFF DEPOT

- **Titelfarbe:** Gelb
- **Kartentext:** Es müssen mindestens 3 eigene Kolonien an Treibstoff-Planeten gegründet werden (ohne Alpha bis Delta).
- **Implementationshinweis:** Kolonien an Treibstoff-Planeten zählen, Startgalaxien Alpha bis Delta ausschließen.

## M08 – STERNEN REICH

- **Titelfarbe:** Grün
- **Kartentext:** Es muss mindestens ein Drei-Planeten-System (ohne Alpha bis Delta) mit eigenen Kolonien komplett besiedelt werden.
- **Implementationshinweis:** Prüfen, ob ein Nicht-Startsystem mit 3 Planeten vollständig mit eigenen Kolonien besiedelt ist.

## M09 – NAHRUNGS LIEFERANT

- **Titelfarbe:** Gelb
- **Kartentext:** Es müssen mindestens 3 eigene Kolonien an Nahrungs-Planeten gegründet werden (ohne Alpha bis Delta).
- **Implementationshinweis:** Kolonien an Nahrungs-Planeten zählen, Startgalaxien Alpha bis Delta ausschließen.

## M10 – EINSIEDLER

- **Titelfarbe:** Grün
- **Kartentext:** Außer in den Alpha bis Delta Systemen darf in keinem Drei-Planeten-System mehr als eine eigene Kolonie gegründet werden.
- **Implementationshinweis:** Für alle Drei-Planeten-Systeme außerhalb Alpha bis Delta prüfen, dass pro System maximal eine eigene Kolonie vorhanden ist.

## M11 – GROSS FABRIKANT

- **Titelfarbe:** Rot
- **Kartentext:** Es müssen mindestens 3 Fabriken gebaut werden.
- **Implementationshinweis:** Eigene gebaute Fabriken zählen, Fabriktyp egal.

## M12 – GROSSE FLOTTE

- **Titelfarbe:** Blau / Weiß
- **Kartentext:** Bei Erreichen der 15 Siegpunkte müssen sich noch 2 Schiffe (Kolonie- oder Handelsschiff) im Flug befinden.
- **Implementationshinweis:** Beim Siegcheck prüfen, ob mindestens 2 eigene Kolonie- oder Handelsschiffe aktuell im Flug sind.

## M13 – BERGBAU

- **Titelfarbe:** Gelb
- **Kartentext:** Es müssen mindestens 3 eigene Kolonien an Erz-Planeten gegründet werden (ohne Alpha bis Delta).
- **Implementationshinweis:** Kolonien an Erz-Planeten zählen, Startgalaxien Alpha bis Delta ausschließen.

## M14 – PRESTIGE FLOTTE

- **Titelfarbe:** Rot
- **Kartentext:** Es müssen alle drei Schlachtschiffe gebaut und auch erhalten werden (Vorsicht bei Raumschlachten).
- **Implementationshinweis:** Prüfen, ob alle 3 eigenen Schlachtschiffe gebaut wurden und aktuell noch im Spiel sind.

## M15 – EROBERER

- **Titelfarbe:** Rot / Weiß
- **Kartentext:** Es müssen mindestens 2 Siegpunkte durch Planeteneroberung gewonnen werden (Piraten-, Eis-Diplomatie).
- **Implementationshinweis:** Punkte aus Planeteneroberungen zählen, insbesondere Piraten-, Eis- und Diplomatie-Mechaniken.

## M16 – HANDEL MIT (FAST) JEDEM

- **Titelfarbe:** Grün
- **Kartentext:** Es müssen bei mindestens 3 verschiedenen Völkern Handelsstationen gegründet werden.
- **Implementationshinweis:** Verschiedene Völker zählen, bei denen der Spieler mindestens eine eigene Handelsstation besitzt.

## M17 – HANDEL UND PRODUKTION

- **Titelfarbe:** Grün
- **Kartentext:** Es muss mindestens je eine Handelsstation bei zwei verschiedenen Völkern gebaut und an dem jeweils angrenzenden Planetensystem je eine Kolonie gegründet werden.
- **Implementationshinweis:** Für mindestens 2 verschiedene Völker prüfen: eigene Handelsstation vorhanden und im jeweils angrenzenden Planetensystem mindestens eine eigene Kolonie vorhanden.

## M18 – KANONIER

- **Titelfarbe:** Blau / Weiß
- **Kartentext:** Es müssen alle 6 Bordkanonen am Mutterschiff ausgebaut werden.
- **Implementationshinweis:** Prüfen, ob alle 6 Bordkanonen-Upgrades am Mutterschiff vorhanden sind.

## M19 – TREIBSTOFF FABRIKANT

- **Titelfarbe:** Violett / Rosa
- **Kartentext:** Es muss die Siegpunktkarte "Raffination" in Besitz sein.
- **Implementationshinweis:** Prüfen, ob der Spieler aktuell die Siegpunktkarte `Raffination` besitzt.

## M20 – ERZ FABRIKANT

- **Titelfarbe:** Violett / Rosa
- **Kartentext:** Es muss die Siegpunktkarte "Minenbesitzer" in Besitz sein.
- **Implementationshinweis:** Prüfen, ob der Spieler aktuell die Siegpunktkarte `Minenbesitzer` besitzt.

## M21 – TRIEBWERK

- **Titelfarbe:** Blau
- **Kartentext:** Es müssen alle 6 Antriebe am Mutterschiff ausgebaut werden.
- **Implementationshinweis:** Prüfen, ob alle 6 Antrieb-Upgrades am Mutterschiff vorhanden sind.

## M22 – RUHM UND EHRE

- **Titelfarbe:** Blau / Weiß
- **Kartentext:** Es müssen mindestens 7 halbe Medaillen erreicht werden (Kampf um halbe Medaillen ist erlaubt).
- **Implementationshinweis:** Prüfen, ob der Spieler mindestens 7 halbe Medaillen erreicht hat. Die ursprüngliche Karte spricht von „Ruhmesringe“ und „Ruhmeskampf“; dies wurde für Star Odyssey angepasst.

## M23 – STÜTZ PUNKTE

- **Titelfarbe:** Rot
- **Kartentext:** Es müssen alle 3 Raumhäfen gebaut werden.
- **Implementationshinweis:** Prüfen, ob der Spieler alle 3 eigenen Raumhäfen gebaut hat.

## M24 – CARBON FABRIKANT

- **Titelfarbe:** Violett / Rosa
- **Kartentext:** Es muss die Siegpunktkarte "Carbonschürfer" in Besitz sein.
- **Implementationshinweis:** Prüfen, ob der Spieler aktuell die Siegpunktkarte `Carbonschürfer` besitzt.

## M25 – HANDELS FLOTTE

- **Titelfarbe:** Grün
- **Kartentext:** Es müssen bei einem Volk mindestens 3 Handelspunkte mit eigenen Handelsschiffen besiedelt werden.
- **Implementationshinweis:** Für jedes Volk prüfen, ob mindestens 3 Handelspunkte durch eigene Handelsschiffe besetzt/besiedelt sind.

---

# 2. Siegpunktkarten

Diese Karten gehören zur Fabrik-Mehrheit der Supernova-Erweiterung. Jede Karte zählt **1 Siegpunkt**. Bei Gleichstand um die jeweilige Mehrheit soll die Karte nicht vergeben bzw. wieder beiseitegelegt werden.

## S01 – LANDWIRT

- **Kartentext:** 1 Siegpunkt
- **Zugehöriger Fabriktyp:** Nahrungsfabrik / Landwirtschaft
- **Vergabe-Idee:** Spieler mit den meisten Fabriken, die Nahrung produzieren.
- **Verknüpfte Mission:** `NAHRUNGS FABRIKANT`

## S02 – CARBON SCHÜRFER

- **Kartentext:** 1 Siegpunkt
- **Zugehöriger Fabriktyp:** Carbonfabrik / Carbonschürfer
- **Vergabe-Idee:** Spieler mit den meisten Fabriken, die Carbon produzieren.
- **Verknüpfte Mission:** `CARBON FABRIKANT`

## S03 – MINEN BESITZER

- **Kartentext:** 1 Siegpunkt
- **Zugehöriger Fabriktyp:** Erzmine / Minenbesitzer
- **Vergabe-Idee:** Spieler mit den meisten Fabriken, die Erz produzieren.
- **Verknüpfte Mission:** `ERZ FABRIKANT`

## S04 – HANDELS MEISTER

- **Kartentext:** 1 Siegpunkt
- **Zugehöriger Fabriktyp:** Handelsstation / Handelswarenfabrik
- **Vergabe-Idee:** Spieler mit den meisten Fabriken, die Handelswaren produzieren.
- **Verknüpfte Mission:** `HANDELS WAREN FABRIKANT`

## S05 – RAFFINATION

- **Kartentext:** 1 Siegpunkt
- **Zugehöriger Fabriktyp:** Raffinerie / Treibstoffproduktion
- **Vergabe-Idee:** Spieler mit den meisten Fabriken, die Treibstoff produzieren.
- **Verknüpfte Mission:** `TREIBSTOFF FABRIKANT`

---

# 3. Abgeleitete Implementationsstruktur

Für Codex bietet sich eine strukturierte Ablage der Karten an, z. B. mit diesen Feldern:

```ts
type SupernovaMissionCard = {
  id: string;
  title: string;
  color: 'blau' | 'gruen' | 'gelb' | 'rot' | 'violett' | 'unklar';
  text: string;
  checkType: string;
};

type SupernovaVictoryPointCard = {
  id: string;
  title: string;
  points: 1;
  factoryType: 'food' | 'carbon' | 'ore' | 'tradeGoods' | 'fuel';
  linkedMissionId: string;
};
```

Wichtige Logik aus den Karten:

1. Missionskarten müssen verdeckt pro Spieler gespeichert werden.
2. Bei Supernova braucht ein Spieler zum Spielgewinn 15 Siegpunkte und mindestens 1 erfüllte Mission.
3. Die Fabrik-Siegpunktkarten zählen je 1 Siegpunkt, aber nur wenn ein Spieler allein die meisten Fabriken der jeweiligen Sorte besitzt.
4. Bei Gleichstand wird die betreffende Siegpunktkarte nicht vergeben.
5. Die Missionskarten `NAHRUNGS FABRIKANT`, `HANDELS WAREN FABRIKANT`, `TREIBSTOFF FABRIKANT`, `ERZ FABRIKANT` und `CARBON FABRIKANT` hängen direkt vom Besitz der jeweiligen Fabrik-Siegpunktkarte ab.
6. Für alle Missionen mit „ohne Alpha bis Delta“ müssen die Startgalaxien ausdrücklich ausgeschlossen werden.
7. `RUHM UND EHRE` nutzt in Star Odyssey **halbe Medaillen** statt RR/Ruhmesringe.
