# Fire TV LAN-Test

## Mini-PC starten

Auf dem Mini-PC im Projektordner:

```powershell
npm run tv:serve
```

Der Server lauscht auf allen Netzwerkinterfaces unter Port `5173`.

## Mini-PC-IP finden

PowerShell:

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object IPAddress, InterfaceAlias
```

Alternativ:

```powershell
ipconfig
```

Die LAN-URL hat dann dieses Format:

```text
http://<Mini-PC-IP>:5173/
```

Diese URL muss auf Handy und Fire TV im selben Heimnetz erreichbar sein.

## Windows-Firewall

Falls Fire TV oder Handy den Mini-PC nicht erreichen, eine eingehende TCP-Regel für Port `5173` erlauben:

```powershell
New-NetFirewallRule `
  -DisplayName "Star Odyssey TV Dev Server 5173" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 5173
```

## Fire-TV-Wrapper

Die Wrapper-App liegt in `fire-tv-wrapper/`.

Startmodi:

- LAN: lädt `http://<Mini-PC-IP>:5173/`
- GitHub Pages: lädt `https://derdruckpilot.github.io/Star-Odyssey/`

Die URL kann in der App über das Overlay geändert werden. Die zuletzt verwendete URL wird lokal gespeichert.

## Wrapper-Build

Wenn lokale Android-Buildtools installiert sind:

```powershell
cd fire-tv-wrapper
gradle :app:assembleDebug
```

Falls lokal kein Android SDK/Gradle vorhanden ist, baut die GitHub Action `Build Fire TV APK` die Debug-APK als Artifact.
