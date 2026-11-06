# What's Changed

### New Features

- **Station versions** — Each successful deploy now saves the configuration it sent to the station as a version. Open a station from the Deploy page and go to the new "Versioni" tab to see them, newest first. The one on the servers now is marked "Attuale".
  - "Scarica" saves a version's config file to your computer.
  - "Ripristina…" shows what restoring that version would change, field by field ("Attuale" → "Versione"), before you confirm with "Ripristina e distribuisci". The station is rewritten as it was in that version and deployed right away. The photo and the server tree are not restored.
  - Before you confirm, you are warned if the station has changes that were never deployed (they will be lost) or if a group's server path is different from the one in the version (the current path is used).
  - Restoring is refused, with the reason, if the version uses station or group IDs that now belong to something else, or if some of its groups can no longer be deployed.
  - If the deploy after a restore fails, the restore is kept and the station stays "In sospeso" so you can deploy it again later.
  - Only deploys made from this version onwards are saved, so older deploys have no version.
- **Discard pending changes** — "Scarta" on a station row (and "Scarta modifiche" in the station's changes dialog) undoes every change made since the station's last deploy, after a confirmation. Nothing is deployed.
  - If some differences cannot be undone for this station alone (for example a tag renamed for all stations), you are told how many remain.
  - Discarding is refused if a deploy is running, if the station was never deployed since the change log was introduced, or if the changes moved groups or variables to or from another station.
  - On the "Attività" page, discarded changes show as "Scartata". Restores and discards also appear there as "Ripristino versione" and "Modifiche scartate".
- **Modbus test** — The edit dialog of Modbus and Modbus MX3 variables has a new "Test Modbus" section. "Leggi" reads the variable's memory-map entry straight from the device, using the values in the dialog even before you save them. Your PC must be able to reach the group's IP address (LAN or VPN). The test only reads and never writes to the device.
  - The result shows each register in decimal, hex and binary (or each bit for coils and input status), plus the connection and read times.
  - For Modbus variables it also shows the decoded value, using the format, exponent and unit as the stations would. The K factor is not applied.
  - If you change a setting after reading, the result is marked as out of date ("parametri cambiati dopo la lettura: rileggi").
- **Pin columns in the variables grid** — Click the pin icon in a column header ("Fissa colonna") to keep that column on the left while you scroll sideways. Pinned columns can be reordered among themselves. When you unpin a column ("Sblocca colonna"), it goes back to where it was. "Ripristina colonne" also removes all pins. Pins are saved per user.
- **Sticky table headers** — Column headers in the editable grids now stay visible while you scroll down.
- **Clean up deleted stations** — The Deploy page has a new "Stazioni eliminate" section for deleted stations whose configuration is still on the servers. "Rimuovi dai server" (or "Rimuovi tutte") removes it to complete the deletion.
- **Formatted release notes** — The update dialog and the update section in Settings now show release notes with headings and lists instead of plain text.

### Changes

- **Disabled stations and groups are deployed** — They are no longer skipped. They are sent to the servers marked as disabled. The "Disabilitata" badge no longer replaces the station's deploy status. Disabled groups can now also show "Modifiche in sospeso".
- **Stations with no groups can be deployed** — If the station's last deploy left files on a server, deploying it removes them.
- **History and versions are always available** — The station dialog on the Deploy page always shows the "Cronologia" and "Versioni" tabs, even when the station has no pending changes.

### Fixes

- Table rows and buttons now have the same height across all tables.
- Form fields in the variable dialog now have consistent sizes.
- Long server names in the deploy dialog are cut off instead of widening the dialog.
- The "Attività" page now shows its name in the header breadcrumb.
