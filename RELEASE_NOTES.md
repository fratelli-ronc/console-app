# What's Changed

### New Features

- **Deploy page** — A new "Deploy" section under the configuration menu sends variable configurations to the stations. Every station shows its servers, its groups and its deploy status: "Distribuito" (with date and author), "Modifiche in sospeso" or "Non distribuito". Groups with pending changes are flagged individually. Filter the list by server, status or text, then deploy one station or several selected stations at once. Disabled stations, and stations with no enabled group, cannot be deployed.
- **Live deploy progress** — A dialog follows the deploy server by server, from the reachability check to sending the files. No file is written until every server responds. If the deploy is refused, for example because a group has no server or another deploy is already running, the dialog lists the groups involved with a readable explanation. A partial deploy still records the stations that went through.
- **Download the generated config files** — After a deploy you can save a copy of all generated config files to a folder of your choice, or download the file for a single server.
- **Server assignment for groups** — The group form has a new searchable "Server" field to assign the group to one of the known servers. The groups table shows the assigned server's name and IP, and the search box also matches server IPs.
- **Clone stations** — Clone a station together with all its groups and variables. The dialog proposes the next free station ID and the original name, and warns you if the ID is already in use.
- **Transfer and clone groups** — Move one or more groups to another station, or clone them with all their variables. You can rename each group as part of the same step.
- **Bulk actions on groups** — The groups table now has row selection. Delete, transfer or clone all selected groups at once from the "Azioni" menu.
- **Bulk actions on variables** — Select rows in the variables grid to move them to another group, clone them into a group or delete them in one step. Any group can be the target, not only those of the current station. If the grid has unsaved edits, you are asked to confirm before they are discarded.
- **History, memory map and image fields in the variables grid** — The variables grid now includes columns for history settings (enabled, trigger, aggregation, interval, max logs), Modbus memory map (read/write function, address, quantity, bit, page, tariff, variable type, MX3 channel, chunk grouping) and image capture (snapshot and preset paths, delay, authentication).
- **Reorderable columns** — Drag the column headers of the variables grid to reorder them. The order is saved per user, and "Ripristina colonne" restores the default order.
- **Next free ID proposed on creation** — When you create a station or a group, the ID field is pre-filled with the next free ID from the server. IDs of deleted items are taken into account.

### Changes

- **Row actions in a menu** — On the Stations and Groups pages, the per-row Edit / Clone / Transfer / Delete buttons are now grouped in a "⋮" menu.
- **"Deploy" renamed to "Servizi"** — The old page with running images and their versions is now called "Servizi" (at `/services`). The "Deploy" name now belongs to the new configuration deploy page.
- **Tag filter follows the class filter** — On the variables grid, the tag filter only lists tags used by variables of the selected class. Changing the class resets the tag filter.

### Fixes

- **Real error messages** — Error notifications now show the actual message returned by the server instead of a generic "Errore del server".
- **Clearer delete confirmations** — Deleting a station now states that its groups and their variables are deleted too. Deleting a group states that its variables are deleted too.
