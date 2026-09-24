import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import type { DeployConfigFile } from '@/client'

/**
 * Saving the configs a deploy rendered.
 *
 * The picker comes from the dialog plugin, but the writing goes through the
 * `write_config_file(s)` commands in `src-tauri/src/lib.rs` rather than the
 * fs plugin: the fs plugin's scope is declared ahead of time in the
 * capability file, so a folder the user picks at runtime would only work by
 * allowing the whole home directory.
 *
 * Both helpers resolve to false when the picker is dismissed, and reject
 * with the message from the Rust side if a write fails.
 */

// Prompts for a destination folder and writes every config into it, flat.
// The file names already carry the server IP, so they can't collide.
export const saveConfigFiles = async (
  files: DeployConfigFile[],
): Promise<boolean> => {
  const dir = await open({
    directory: true,
    multiple: false,
    title: 'Scegli la cartella di destinazione',
  })
  if (typeof dir !== 'string') return false

  await invoke('write_config_files', {
    dir,
    files: files.map(({ fileName, content }) => ({ fileName, content })),
  })
  return true
}

// Prompts for a path (pre-filled with the config's own name) and writes
// that one config to it.
export const saveConfigFile = async (
  file: DeployConfigFile,
): Promise<boolean> => {
  const path = await save({
    defaultPath: file.fileName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!path) return false

  await invoke('write_config_file', { path, content: file.content })
  return true
}
