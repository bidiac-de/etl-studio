# ETL Studio Tests

Dieses Verzeichnis enthält alle Tests für das ETL Studio Projekt.

## Test-Struktur

- `setup.js` - Jest Setup und Mocks
- `console.test.js` - Tests für ETL.console Funktionen
- `api.test.js` - Tests für ETL.api Funktionen  
- `util.test.js` - Tests für ETL.util Funktionen
- `render.test.js` - Tests für ETL.render Funktionen

## Tests ausführen

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus (automatisch bei Änderungen)
npm run test:watch

# Tests mit Coverage-Report
npm run test:coverage
```

## Was wird getestet?

### ETL.console
- ✅ Logging mit/ohne Timestamp
- ✅ Log-Buffer Management
- ✅ Console löschen
- ✅ Change Handler

### ETL.api
- ✅ GET, POST, PUT, DELETE Requests
- ✅ Error Handling
- ✅ Server-Validierung
- ✅ AJAX Timeout

### ETL.util
- ✅ JSON Schema Dereferencing
- ✅ Datum-Formatierung
- ✅ Form-Daten Extraktion
- ✅ Alert-Dialog

### ETL.render
- ✅ HTML-Formular Generierung
- ✅ Verschiedene Input-Typen (string, integer, boolean, select)
- ✅ Job-Edit Formulare
- ✅ Component-Edit Formulare

## Coverage

Die Tests decken alle wichtigen Funktionen Ihres ETL Studio ab und stellen sicher, dass:
- Alle API-Calls korrekt funktionieren
- Formulare richtig gerendert werden
- Console-Logging zuverlässig arbeitet
- Utility-Funktionen robust sind
