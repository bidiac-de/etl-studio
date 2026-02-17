# ETL Studio

ETL Studio is the web UI for designing, saving, and executing ETL jobs against ETL Core.

## Scope

- Repository: `/Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio`
- Core repository: `/Users/conradhofstede/Projects/UNI/SEP/ETL/etl-core`

These are separate repositories with a strict runtime contract.

## Current Core Integration Model

Studio requires Core contract bootstrap before feature usage.

### Required bootstrap endpoints

- `GET /setup/capabilities`
- `POST /setup/validate`

### Required schema endpoints

- `GET /configs/component_types`
- `GET /configs/{comp_type}/form`
- `GET /configs/{comp_type}/full`

### Strict behavior

- Studio validates `contract_version` from capabilities.
- On missing/invalid/mismatched capabilities, Studio blocks the UI.
- No legacy fallback paths are used.
- Environments, operators, logical operators, and data types are read from capabilities (not hardcoded).
- Component forms are generated from Core schema metadata (`x-ui`, `x-class`).

Compatibility matrix: `doc/studio-core-compatibility.md`.

## Setup (macOS)

```bash
cd /Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio
mkdir -p data
php -S 127.0.0.1:8080
```

Helper:

```bash
cd /Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio
./scripts/demo/start_studio.sh
```

Open: [http://127.0.0.1:8080](http://127.0.0.1:8080)

## Setup Wizard: SQLite Path

The setup field `Sqlite filepath` is Studio's internal metadata DB (users/server definitions/UI job metadata).

Recommended path:

```text
/Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio/data/studio.sqlite3
```

Helper:

```bash
cd /Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio
./scripts/demo/prepare_setup_db.sh /Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio/data/studio.sqlite3
```

## Connect Studio to Core

In Studio `Server` page:

- Protocol: `http`
- Host: `127.0.0.1`
- Port: `8000`
- Access key: leave empty unless Core uses `ETL_SETUP_ACCESS_KEY`

## Manual Demo Jobs in Studio

Use the full runbook in Core repo:

- `/Users/conradhofstede/Projects/UNI/SEP/ETL/etl-core/docs/mac_demo_runbook.md`

It contains step-by-step manual Studio setup for:

1. `read_postgresql -> filter -> write_mariadb`
2. `read_mongodb -> aggregation -> write_postgresql`
3. `read_excel -> filter -> write_json`
4. Complex split/merge + multi-write story job

## Development Notes

- `index.js` contains contract bootstrap, API layer, and dynamic rendering utilities.
- `pages/uiJob/job.js` contains whiteboard editor behavior, port wiring, and import/export mapping.
- Array/object fields are edited as JSON in generated forms.

## Testing

```bash
cd /Users/conradhofstede/Projects/UNI/SEP/ETL/etl-studio
npm test -- --runInBand
```

## License

MIT. See `LICENSE`.
