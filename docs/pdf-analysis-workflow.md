# PDF Analysis Workflow

Dieses Projekt nutzt eine lokale Python-Umgebung, um PDF-Dateien fuer Analysezwecke zu lesen.

## Werkzeuge

- Bevorzugt: lokale `.venv` mit PyMuPDF (`fitz`) fuer Textauszug und PNG-Rendering.
- Zusaetzlich installiert: Pillow fuer Bildverarbeitung.
- Optional installiert: pdfplumber fuer spaetere Text-/Tabellenpruefung.
- Optional extern: Poppler CLI (`pdftotext`, `pdftoppm`, `pdfimages`), falls lokal verfuegbar.

Poppler ist nicht erforderlich, solange PyMuPDF die PDF korrekt lesen und rendern kann.

## Einrichtung

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install pymupdf pillow pdfplumber
```

## PDF pruefen

```powershell
.\.venv\Scripts\python.exe tools\pdf\inspect-pdf.py "C:\Pfad\zur\Datei.pdf"
```

Alternativ ueber npm:

```powershell
npm run pdf:inspect -- "C:\Pfad\zur\Datei.pdf"
```

Das Skript schreibt Analyseartefakte nach:

```text
.tmp/pdf-inspection/<pdf-name>/
```

Dort liegen pro Seite eine Textdatei, ein PNG-Rendering und eine `summary.md`.

## Regeln

- Temporare Renderings und Textauszuege werden nicht committet.
- Original-PDFs werden nicht ins Repository aufgenommen, ausser sie sind ausdruecklich freigegeben.
- Geschuetzte Originalgrafiken werden nicht als Spielassets uebernommen.
- PDF-Grafiken duerfen als Layout-, Regel- und Mechanikreferenz ausgewertet werden.
- Falls Poppler genutzt wird, bleiben die erzeugten Dateien ebenfalls unter `.tmp/`.
