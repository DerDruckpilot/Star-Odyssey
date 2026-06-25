# Star Odyssey Fire TV Wrapper

Minimaler Fire-TV-Wrapper für LAN-Hardwaretests.

## Modi

- LAN: `http://<Mini-PC-IP>:5173/`
- GitHub Pages: `https://derdruckpilot.github.io/Star-Odyssey/`

Die URL wird in der App über `URL / Modus` geändert und lokal gespeichert.

## Fernbedienungs-Overlay

Mit der Menü-Taste oder dem kleinen `TV`-Button oben rechts lässt sich das Overlay öffnen.

Aktionen:

- `Reload`
- `Hard Reload` löscht WebView-Cache und hängt einen Cache-Busting-Parameter an
- `URL / Modus`
- `Schließen`

## Lokaler Build

```powershell
gradle -p fire-tv-wrapper :app:assembleDebug
```

Falls lokal kein Android SDK/Gradle vorhanden ist, die GitHub Action `Build Fire TV APK` manuell starten.
