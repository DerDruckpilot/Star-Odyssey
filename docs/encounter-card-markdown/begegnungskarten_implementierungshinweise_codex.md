# Star Odyssey – Implementierungshinweise Begegnungskarten

Diese Hinweise ergänzen die 32 einzelnen Markdown-Dateien der Begegnungskarten. Die Kartendateien sind die inhaltliche Quelle für Texte, Schritte und Effekte. Diese Datei beschreibt die gemeinsamen technischen Regeln, damit die Begegnungen konsistent und wartbar umgesetzt werden.

## Ziel

Implementiere die 32 Begegnungskarten als datengetriebenen Begegnungs-Flow für Star Odyssey.

- Die einzelnen Karten sollen nicht als große, unübersichtliche UI-Sonderfälle hart verdrahtet werden.
- Baue gemeinsame Flow-Primitives für Auswahl, Rohstoffabgabe, Rohstoffbelohnung, Mutterschiffvergleich, Schiffsauswahl, Raumsprung, Ausbau hinzufügen/entfernen, Geschenk-Handelsschiff und neue Begegnung.
- Die Markdown-Dateien beschreiben den gewünschten Ablauf; Code darf daraus in strukturierte Daten übertragen werden.
- Originaltexte aus den bereitgestellten Markdown-Dateien verwenden.
- Keine Original-Bilder oder urheberrechtlich geschützte Kartenscans ins Repo übernehmen.

## Grundstruktur des Encounter-Systems

Empfohlene Datenstruktur pro Begegnung:

```ts
type EncounterDefinition = {
  id: string;
  title?: string;
  initialText: string;
  steps: EncounterStep[];
};
```

Empfohlener Runtime-State:

```ts
type ActiveEncounterState = {
  encounterId: string;
  stepId: string;
  activePlayerId: string;
  affectedPlayerIds: string[];
  chosenResourceCount?: number;
  givenResources?: ResourceType[];
  rewardResources?: ResourceType[];
  selectedShipId?: string;
  selectedUpgradeType?: UpgradeType;
  comparison?: EncounterComparisonState;
  pendingEffects?: EncounterPendingEffect[];
};
```

Wichtig:

- Begegnungen müssen Save/Load-fähig sein.
- Der aktuelle Step, getroffene Auswahlen, Pending-Auswahlen und bereits gezahlte Rohstoffe müssen gespeichert werden.
- Nach Reload darf eine laufende Begegnung nicht zurückspringen oder Effekte doppelt ausführen.
- Jede Begegnung muss sauber abschließbar sein, bevor die normale Flugphase weitergeht.

## Sichtbarkeit und Controller-Logik

Begegnungen laufen primär für den aktiven Spieler im Begegnungs-/Zug-Flow.

Nicht betroffene Spieler:

- sehen keine vollständigen geheimen Begegnungstexte,
- sehen nur neutrale Hinweise wie `{activePlayerName} ist gerade in einer Begegnung.`,
- bekommen nur dann eigene Bedienelemente, wenn sie aktiv an der Begegnung beteiligt sind.

Betroffene passive Spieler:

- sind z. B. Nachbarn, die als Pirat würfeln müssen,
- müssen auf ihrem eigenen Controller eine klare Aufforderung und einen Button erhalten,
- dürfen nur ihre eigene erforderliche Aktion ausführen.

Öffentliches Spielfeld:

- darf Begegnungsanimationen zeigen, z. B. Mutterschiffe nebeneinander, Shake, Kugeln, Vergleichsergebnis,
- soll keine geheimen Handkarten/Rohstoffdetails unnötig offenlegen.

Log:

- Keine technischen Encounter-IDs anzeigen.
- Keine versteckten Rohstofftypen aus Zufallsziehungen oder fremden Händen offenlegen.
- Für Begegnungen reicht ein neutraler Logeintrag wie `{playerName} handelt eine Begegnung ab.` oder ein kurzer Ergebnis-Hinweis ohne geheime Details.

## Rohstoff-Auswahlen

Bei Karten, bei denen der aktive Spieler 0 bis 3 Rohstoffe schenken/abgeben kann:

- Buttons nur aktivieren, wenn der Spieler genug Rohstoffe besitzt.
- `0 Rohstoffe` ist immer möglich.
- Nach Auswahl von 1, 2 oder 3 Rohstoffen muss der Spieler konkret vorhandene Rohstoffe auswählen.
- Erst nach Bestätigung werden diese Rohstoffe entfernt.
- Wenn ein späterer Effekt sagt, dass Geschenke zurückgegeben werden, exakt diese zuvor abgegebenen Rohstoffe wieder gutschreiben.

Bei Belohnung „beliebiger Rohstoff“:

- Spieler wählt den Rohstofftyp selbst.
- Bei „zwei beliebige Rohstoffe“ zwei Auswahlen erlauben; gleiche Typen sind erlaubt, falls die allgemeinen Spielregeln das nicht verbieten.

Bei zufälligem Ziehen von Rohstoffen/Karten von Mitspielern:

- Die Auswahl erfolgt automatisch zufällig aus dem Bestand des jeweiligen passiven Spielers.
- Der aktive Spieler wählt nicht aus.
- Hat ein passiver Spieler keine Rohstoffkarte, wird bei diesem Spieler nichts gezogen.
- Nur tatsächlich gezogene Karten werden übertragen.
- Die konkreten gezogenen Rohstoffe nicht öffentlich im Log verraten.

## Halbe Medaillen

Alle in den Markdown-Dateien genannten „halben Medaillen“ werden technisch als halbe Siegpunktmedaillen geführt.

- `+1 halbe Medaille` erhöht den halben Medaillenwert um 1.
- `-1 halbe Medaille` reduziert ihn um 1, aber nicht unter 0, sofern das bestehende Punktesystem negative Medaillen nicht vorsieht.
- „eine ganze Medaille“ bedeutet 2 halbe Medaillen.
- Spezialmedaillen oder andere Siegpunkte dürfen dadurch nicht entfernt werden.

## Mutterschiffwürfe in Begegnungen

Es gibt mehrere Sonderwürfe mit dem Mutterschiff. Diese Würfe sind Begegnungswürfe.

Wichtig:

- Sie verändern niemals die aktuelle Fluggeschwindigkeit.
- Sie ersetzen keinen normalen Mutterschiffwurf der Flugphase.
- Sie dürfen nicht als neuer Bewegungswurf gespeichert werden.
- Die Animation darf die bekannte Mutterschiff-Shake-Animation wiederverwenden.
- Die farbigen Kugeln müssen sichtbar ausgewertet werden.
- Alle sichtbaren Anbauten am Mutterschiff müssen dargestellt werden.

### Kampfvergleich

Für Kampfvergleiche gilt:

```text
Kampfkraft = Punktzahl der farbigen Kugeln + physisch montierte Bordkanonen + Bordkanonen-Boni aus Freundschaftskarten
```

Dabei zählen:

- echte, physisch montierte Bordkanonen,
- zusätzliche wirksame Bordkanonen durch Freundschaftskarten.

Freundschaftskarten-Boni zählen hier zur effektiven Kampfkraft, aber weiterhin nicht als echte Mutterschiff-Anbauten.

### Geschwindigkeitsvergleich

Für Geschwindigkeitsvergleiche gilt:

```text
Geschwindigkeit = Punktzahl der farbigen Kugeln + physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

Dabei zählen:

- echte, physisch montierte Antriebe,
- zusätzliche wirksame Antriebe durch Freundschaftskarten.

Freundschaftskarten-Boni zählen hier zur effektiven Geschwindigkeit, aber weiterhin nicht als echte Mutterschiff-Anbauten.

### Kugelwert ohne Ausbauten

Bei Hehlerei-/Piratentauschkarten, bei denen nur das Kugelergebnis zählt:

```text
Wert = Punktzahl der farbigen Kugeln
```

Keine Ausbauten, keine Bordkanonen, keine Antriebe und keine Freundschaftsboni addieren.

### Ablauf bei Würfen mit passivem Gegenspieler

Wenn aktiver Spieler und passiver Gegenspieler würfeln müssen:

- Beide bekommen auf ihrem eigenen Controller einen Button „Mit Mutterschiff würfeln“ oder sinngemäß.
- Erst wenn beide Spieler ihren Wurf ausgelöst haben, läuft auf dem großen Spielfeld die Vergleichsdarstellung.
- Beide Mutterschiffe werden nebeneinander eingeblendet.
- Beide Mutterschiffe zeigen alle sichtbaren Anbauten.
- Nach der Animation wertet das System automatisch aus.
- Kein Spieler soll manuell „Ja, ich bin stärker“ oder „Nein, ich bin schwächer“ bestätigen müssen, wenn das Ergebnis berechenbar ist.

## Vergleich ohne Würfelwurf

Einige Karten vergleichen nur vorhandene Antriebe, ohne Mutterschiffwurf.

Dafür gilt:

- Beide Mutterschiffe kurz auf dem großen Spielfeld nebeneinander einblenden.
- Alle sichtbaren Anbauten darstellen.
- Gegebenenfalls wirksame Freundschaftskarten-Boni optisch oder textlich anzeigen.
- Kein Shake.
- Keine Kugelanimation.
- Nach ca. 2–3 Sekunden ausblenden und automatisch auswerten.

Vergleichswert:

```text
Effektive Antriebe = physisch montierte Antriebe + Antriebs-Boni aus Freundschaftskarten
```

## Nachbar-Ermittlung

Benötigte Rollen:

- rechter Nachbar,
- linker Nachbar,
- zweiter rechter Nachbar,
- zweiter linker Nachbar.

Empfehlung:

```ts
getNeighbor(playerOrder, activePlayerId, offset)
```

- rechter Nachbar: `+1`
- zweiter rechter Nachbar: `+2`
- linker Nachbar: `-1`
- zweiter linker Nachbar: `-2`

Modulo über die aktuelle Spielerreihenfolge verwenden.

Für 2-Spieler-Partien muss verhindert werden, dass ein „zweiter Nachbar“ auf den aktiven Spieler selbst zeigt. In diesem Fall den einzigen anderen Spieler als Gegenspieler verwenden, damit die Begegnung spielbar bleibt.

## Schiff für diese Runde sperren

Mehrere Karten verlangen:

„Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen.“

Umsetzung:

- Aktiver Spieler erhält Hinweis, in den Spielfeld-Tab zu wechseln.
- Dort werden eigene auswählbare Schiffe hervorgehoben.
- Nach Klick auf ein Schiff muss die Auswahl bestätigt werden.
- Das Schiff erhält einen temporären Sperrstatus, z. B. `blockedForRoundId` oder `blockedUntilTurnId`.
- Gesperrte Schiffe dürfen in der laufenden Runde/Flugphase nicht bewegt werden.
- Sperre muss Save/Load-fähig sein.
- Sperre wird automatisch entfernt, wenn die relevante Runde/Flugphase vorbei ist.
- Bereits gesperrte Schiffe sollten nicht erneut als sinnvolle Auswahl angeboten werden, sofern andere Schiffe verfügbar sind.

Wenn ein Spieler kein auswählbares Schiff besitzt, darf die Begegnung nicht hängen bleiben. Dann Effekt überspringen und Begegnung abschließen.

## Handelsschiff als Geschenk

Mehrere Begegnungen schenken ein Handelsschiff.

Regeln:

- Geschenk-Handelsschiffe zählen gegen das normale Handelsschiff-/Transporterlimit des Spielers.
- Der Spieler muss einen freien Raumhafenpunkt an einem eigenen Raumhafen wählen.
- Hinweis: in den Spielfeld-Tab wechseln.
- Freie gültige Raumhafenpunkte hervorheben.
- Nach Auswahl wird das Handelsschiff kostenlos platziert.
- Falls kein freier Raumhafenpunkt verfügbar ist oder das Limit gerade nicht erfüllt werden kann, wird das Geschenk als Pending-Effekt gespeichert.
- Das Geschenk verfällt nicht.
- Sobald später ein gültiger Raumhafenpunkt frei wird und das Limit es erlaubt, kann/muss das Pending-Handelsschiff kostenlos platziert werden.
- Pending-Geschenke müssen im Spielerzustand gespeichert werden.
- Wenn das Handelsschiff während der laufenden Flugphase platziert wird, darf es in derselben Flugphase noch fliegen und bekommt die aktuell verfügbare Bewegung, sofern die allgemeinen Spielregeln das erlauben.
- Nach Platzierung müssen VFX/Glow/Schiffsstatus sofort korrekt initialisiert werden.

## Raumsprung

Mehrere Begegnungen gewähren einen Raumsprung.

Ablauf:

1. Spieler erhält Hinweis, in den Spielfeld-Tab zu wechseln.
2. Eigene geeignete Schiffe werden hervorgehoben.
3. Spieler wählt ein Schiff.
4. Gültige Ziel-Raumpunkte werden markiert.
5. Spieler wählt Zielpunkt.
6. Raumsprung wird mit bestehender Spawn-/Raumsprung-Animation ausgeführt.
7. Begegnung kehrt zurück und kann abgeschlossen werden.

Regeln:

- Raumsprung verbraucht keine normale Flugbewegung.
- Raumsprung ist keine normale Fluganimation entlang eines Pfads.
- Es wird die bereits vorhandene Spawn-/Raumsprung-Animation übernommen.
- Besetzte oder ungültige Raumpunkte dürfen nicht als finale Ziele verwendet werden.
- Zentren von Planetensystemen sind keine gültigen Endpunkte.
- Verdeckte Raumquadranten dürfen nicht durch die Zielauswahl verraten werden.
- Wenn ein verdeckter Quadrant theoretisch ein Planetensystem enthalten könnte, darf die UI nicht durch fehlende Mittelpunkt-Ziele offenlegen, was darunter liegt.
- Sollte ein Spieler dadurch einen später als ungültig erkannten Punkt wählen, wird das Schiff auf den nächstgelegenen gültigen Raumpunkt aus Flugrichtung kommend gesetzt.
- Nach dem Raumsprung muss normale Exploration/Aufdeckung ausgelöst werden, falls das Schiff neben einem verdeckten System landet.

Gesperrte Schiffe sollten nicht für Raumsprung angeboten werden, sofern die bestehende Regel „darf nicht fliegen“ als Bewegungsverbot umgesetzt ist.

## Mutterschiff-Ausbau hinzufügen

Bei Effekten wie „Erweitere dein Mutterschiff um einen beliebigen Ausbau“:

- Nur Ausbauten anbieten, deren echtes Limit noch nicht erreicht ist.
- Antrieb: maximal 6 echte Anbauten.
- Frachtmodul/Frachtring: maximal 5 echte Anbauten.
- Bordkanone: maximal 6 echte Anbauten.
- Freundschaftskarten-Boni zählen nicht gegen diese Limits.
- Nach Auswahl muss das Mutterschiff visuell aktualisiert werden.
- Overlay-/Layout-System für Mutterschiff-Anbauten weiterverwenden.

## Mutterschiff-Ausbau entfernen

Bei Effekten wie „Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn“:

- Nur tatsächlich vorhandene echte Mutterschiff-Anbauten anbieten.
- Freundschaftskarten-Boni dürfen nicht entfernt werden.
- Wenn ein Spieler keinen echten Ausbau besitzt, Effekt überspringen und Begegnung abschließen.
- Nach Auswahl muss das Mutterschiff visuell aktualisiert werden.

## Zahn der Zeit

Für Zahn-der-Zeit-Karten zählen ausschließlich echte, physisch montierte Mutterschiff-Ausbauten.

Nicht zählen:

- Freundschaftskarten-Boni,
- temporäre Boni,
- sonstige effektive Vergleichswerte.

Karte 31:

- Betroffen sind Spieler mit mehr als 8 echten Ausbauten.
- Jeder betroffene Spieler wählt genau einen echten Ausbau und entfernt ihn.
- Wenn alle betroffenen Spieler fertig sind, folgt „Neue Begegnung“.
- Text: „Die Begegnungen wurden neu gemischt.“
- Danach direkt eine neue Begegnung starten.

Karte 32:

- Betroffen sind Spieler mit mehr als 6 echten Ausbauten.
- Jeder betroffene Spieler wählt genau einen echten Ausbau und entfernt ihn.
- Danach folgt Zwischenstep „Galaktischer Rat“.
- Spieler mit den meisten echten Frachtmodulen/Frachtringen erhalten je 1 halbe Medaille.
- Haben mehrere Spieler gleich viele höchste Frachtmodul-Anzahl, erhalten alle diese Spieler 1 halbe Medaille.
- Hat niemand ein Frachtmodul/einen Frachtring verbaut, erhält niemand eine halbe Medaille.
- Danach „Neue Begegnung“ mit Text: „Die Begegnungen wurden neu gemischt.“
- Danach direkt eine neue Begegnung starten.

Hinweis zur Benennung:

- „Frachtring“ in den Kartentexten entspricht im bisherigen Code wahrscheinlich „Frachtmodul“.
- Im UI darf der schöne Begriff aus der Karte verwendet werden, intern kann der bestehende Upgrade-Typ genutzt werden.

## Neue Begegnung / Stapel neu mischen

Einige Karten verlangen, sofort eine neue Begegnung zu starten.

Regeln:

- Kein künstliches Loop-Limit.
- Keine Fehlermeldung, falls mehrere „neue Begegnung“-Effekte hintereinander kommen.
- Bei „Zahn der Zeit“ den Begegnungsstapel neu mischen und dann direkt eine neue Begegnung starten.
- Der Spieler zieht nicht aktiv per Button eine Karte; das System startet die nächste Begegnung automatisch.
- Trotzdem sollte die Zwischenmeldung kurz sichtbar bleiben, damit der Ablauf nachvollziehbar ist.

## UI-Hinweise für Spielfeld-Tab-Aktionen

Bei Begegnungen, die eine Auswahl auf dem Spielfeld verlangen:

- Begegnungs-/Zug-Tab zeigt klar: „Wechsle in den Tab Spielfeld …“.
- Spielfeld-Tab zeigt die konkrete Aufgabe, z. B. „Wähle eines deiner Schiffe“ oder „Wähle einen freien Raumhafenpunkt“.
- Nur gültige Ziele hervorheben.
- Klick auf ungültige Ziele darf keine falsche Auswahl auslösen.
- Planetenklicks während Encounter-Auswahl dürfen keine normalen weißen Auswahlrahmen setzen.
- Nach erfolgreicher Auswahl automatisch oder per klarer Bestätigung zum Begegnungsflow zurückkehren.

## Ergebnis-Texte und Abschluss

- Ergebnistext erst anzeigen, wenn alle dafür nötigen Auswahlen abgeschlossen sind.
- Beispiel: Wenn zuerst Rohstoffe gewählt werden müssen, Ergebnistext nicht vor der konkreten Rohstoffauswahl anzeigen.
- Bei komplexen Folgen erst finalen Text anzeigen, dann nötige Folgeschritte durchführen oder umgekehrt gemäß Kartendatei. Wichtig ist, dass der Spieler immer weiß, was als Nächstes zu tun ist.
- Begegnung erst beenden, wenn alle Pflichtauswahlen abgeschlossen und Effekte angewendet sind.

## Fehlerfälle und robuste Fallbacks

Encounter darf nie in einem nicht abschließbaren Zustand hängen bleiben.

Beispiele:

- Spieler soll Rohstoffe abgeben, besitzt aber zu wenige: entsprechende Auswahl nicht anbieten.
- Spieler soll ein Schiff wählen, besitzt aber kein gültiges Schiff: Auswahl überspringen, Effekt als nicht ausführbar behandeln.
- Spieler soll Ausbau entfernen, besitzt aber keinen echten Ausbau: Effekt überspringen.
- Spieler soll Handelsschiff platzieren, hat keinen freien Raumhafenpunkt: Pending-Effekt speichern.
- Passive Spieler müssen würfeln, sind aber im Controller nicht verbunden: Host/PC-Test muss trotzdem eine Möglichkeit bieten, den Wurf auszulösen oder Controller neu zu verbinden.

## Empfohlene Implementierungsreihenfolge

1. Encounter-Datenmodell und Runtime-State vorbereiten.
2. Gemeinsame Step-Typen implementieren:
   - Text + Auswahl,
   - Rohstoffabgabe,
   - Rohstoffbelohnung,
   - zufällige Rohstoffübertragung,
   - halbe Medaille ändern,
   - Mutterschiffwurf solo,
   - Mutterschiffvergleich mit passivem Spieler,
   - Vergleich ohne Würfelwurf,
   - Schiff sperren,
   - Handelsschiff-Geschenk/Pending,
   - Raumsprung,
   - Ausbau hinzufügen,
   - Ausbau entfernen,
   - neue Begegnung/Stapel mischen.
3. Karten 1–6 Händlerkarten einbauen und testen.
4. Karten 7–18 Piraten-/Kampfvergleiche einbauen und testen.
5. Karten 19–24 Rettung/Piratenangriff/Raumsprung einbauen und testen.
6. Karten 25–30 Raumzerrung/wanderndes Volk einbauen und testen.
7. Karten 31–32 Zahn der Zeit einbauen und testen.
8. Save/Load während laufender Begegnung testen.
9. Controller/Host-Synchronisation testen.
10. GitHub Pages Deployment prüfen.

## Test-Checkliste

Mindestens diese Fälle prüfen:

- Begegnung startet nach schwarzer Kugel erst nach sichtbarer Flug-/Ankunftsanimation.
- Aktiver Spieler sieht vollständigen Begegnungsflow.
- Nicht betroffene Spieler sehen nur neutralen Hinweis.
- Betroffener passiver Spieler kann Mutterschiffwurf auslösen.
- Kampfvergleich addiert Kugeln + Bordkanonen + Freundschaftsboni.
- Geschwindigkeitsvergleich addiert Kugeln + Antriebe + Freundschaftsboni.
- Hehlerei-Wurf zählt nur Kugeln.
- Sonderwürfe verändern nicht die Fluggeschwindigkeit.
- Rohstoffgeschenke werden korrekt abgezogen und bei Sieg ggf. exakt zurückgegeben.
- Zufälliges Ziehen von Mitspielern funktioniert auch bei Spielern ohne Rohstoffe.
- Schiffssperren verhindern weitere Bewegung und werden später zurückgesetzt.
- Geschenk-Handelsschiff wird platziert oder als Pending gespeichert.
- Pending-Handelsschiff verfällt nicht nach Save/Load.
- Raumsprung verrät keine verdeckten Systeme und löst Exploration aus.
- Ausbau hinzufügen respektiert echte Limits.
- Ausbau entfernen entfernt keine Freundschaftskarten-Boni.
- Zahn der Zeit zählt nur echte Ausbauten.
- Galaktischer Rat auf Karte 32 vergibt halbe Medaillen korrekt bei Gleichstand und bei 0 Frachtmodulen an niemanden.
- Neue Begegnung startet automatisch und ohne Loop-Limit.

## Abschlussanforderung für Codex

Nach Umsetzung:

- `git status` prüfen.
- Sinnvolle Checks ausführen, mindestens Build/Syntaxcheck; bei vorhandenen Tests gezielt relevante Tests ausführen.
- Kurze manuelle Testnotizen im Abschluss nennen.
- Änderungen committen.
- Auf aktuellen Remote-Branch pushen.
