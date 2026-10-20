# What's Changed

### New Features

- **Review changes before deploying** — On the Deploy page, stations with pending changes show how many changes are waiting and who made them. A new "Rivedi" button opens the changes that deploying would send. The "Differenze" view shows the net difference from the last deploy, field by field ("Distribuito" vs "Attuale"), for the station, its groups and its variables by group. The "Cronologia" view lists every change since then, newest first, with "Carica modifiche precedenti" to load older ones. You can deploy the station directly from this dialog.
- **Change history for every station** — Stations with no pending changes get a "Cronologia" button that opens their change history, with the date and author of the last deploy.
- **Save conflicts are detected** — If someone else saved a station, group or variable after you opened it, you are told before your save overwrites their changes:
  - **Station and group forms** only send the fields you changed. On a conflict, the form says who made the other change and when, and which fields you both changed. You can then save your values on top of theirs. Their changes to other fields are kept. If the item was deleted in the meantime, you are told and can go back to the list.
  - **Variables grid** — If some rows were changed by someone else, nothing is saved and the dialog lists the affected variables and who changed them. "Aggiorna e riapplica" reloads the grid and reapplies your unsaved edits on the current values. Cells changed on both sides are highlighted in red, so you can check them before saving again. Edits to variables that were deleted in the meantime are discarded.
- **Right-click menu on variable rows** — Right-click a row in the variables grid to clone that single variable into a group, or to delete the row.

### Changes

- **Row delete moved to the right-click menu** — The trash button at the end of each row in the variables grid has been removed. Use "Elimina riga" from the row's right-click menu instead. As before, the deletion is applied only when you save.
