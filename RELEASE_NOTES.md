# What's Changed

### New Features

- **Activity page** — A new "Attività" page in the sidebar lists every change to stations, groups and variables across all stations, newest first, grouped by day ("Oggi", "Ieri", then the date). Each change shows who made it, at what time, and the fields that changed, from the old value to the new one.
  - **Filters** — Filter by user, by station, by type ("Tutto", "Stazioni", "Gruppi", "Variabili") and by date range ("Dal" … "al"). "Azzera filtri" clears them all. Filters are kept when you reload the page.
  - **Deploy status per change** — Each change shows the stations it affects and whether it has reached them: "Distribuita", "In sospeso", "Mai distribuita" or "Stazione eliminata".
  - Changes that touch many items show the first 8, with "Mostra altre N modifiche" to expand the rest. "Carica modifiche precedenti" loads older changes.
- **Edit a single variable** — Right-click a row in the variables grid and choose "Modifica" to open a dialog with all of the variable's settings, including the ones that are not in the grid (notes, graph group, presentations…).
  - The dialog shows only the sections that apply to the variable's kind: Modbus, Modbus MX3, internal variable, mirroring, Python script, HTTP camera or TCP camera. The sections are "Generale", "Mappa memoria", "Trattamento dato grezzo", "Storico", "Telecamera", "Descrizione e visualizzazione" and "Presentazioni".
  - You can move the variable to another group of the same station. To move it to another station, use "Sposta in gruppo" in the grid as before.
  - **Camera variables** are recognised by their group's protocol. For HTTP cameras you can set the snapshot path, an optional preset path called before the snapshot, the delay between the two, and the authentication.
  - **Python variables** — The script itself is still managed by the Python scripts console; here you edit only how the variable is shown.
  - Saves are checked for conflicts like station and group forms: if someone else changed the variable after you opened it, you are told before overwriting their changes. If the grid has unsaved edits, you are asked to discard them before the dialog opens. Closing the dialog with unsaved changes asks for confirmation.
- **Presentations editor** — In the variable dialog you can add, reorder ("Sposta su" / "Sposta giù") and delete the variable's presentations. Supported types are "Stato testuale", "Preset (slider)", "Comando singolo", "Comando doppio", "Interruttore" and "Abilitazione", each with its own fields. "Stato testuale" shows a preview of the text and colors. "Modifica JSON" lets you edit an entry as raw JSON. Settings the editor has no field for are kept unchanged.

### Changes

- **Camera groups must have exactly one variable to be deployed** — Deploying a station is refused if one of its camera groups has no variable ("Telecamera senza variabile") or more than one ("Telecamera con più di una variabile"). The deploy dialog says which groups cannot be deployed.
