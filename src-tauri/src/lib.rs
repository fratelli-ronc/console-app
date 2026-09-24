use keyring::Entry;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

const SERVICE: &str = "it.fratellironc.consoleapp";

static TOKEN_CACHE: Mutex<Option<String>> = Mutex::new(None);
static REFRESH_TOKEN_CACHE: Mutex<Option<String>> = Mutex::new(None);

fn token_entry() -> keyring::Result<Entry> {
    Entry::new(SERVICE, "auth_token")
}

fn refresh_entry() -> keyring::Result<Entry> {
    Entry::new(SERVICE, "refresh_token")
}

#[tauri::command]
fn set_token(token: String) -> Result<(), String> {
    *TOKEN_CACHE.lock().unwrap() = Some(token.clone());
    token_entry()
        .and_then(|e| e.set_password(&token))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_token() -> Result<Option<String>, String> {
    if let Some(token) = TOKEN_CACHE.lock().unwrap().clone() {
        return Ok(Some(token));
    }
    match token_entry().and_then(|e| e.get_password()) {
        Ok(token) => {
            *TOKEN_CACHE.lock().unwrap() = Some(token.clone());
            Ok(Some(token))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn clear_token() -> Result<(), String> {
    *TOKEN_CACHE.lock().unwrap() = None;
    match token_entry().and_then(|e| e.delete_credential()) {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn set_refresh_token(token: String) -> Result<(), String> {
    *REFRESH_TOKEN_CACHE.lock().unwrap() = Some(token.clone());
    refresh_entry()
        .and_then(|e| e.set_password(&token))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_refresh_token() -> Result<Option<String>, String> {
    if let Some(token) = REFRESH_TOKEN_CACHE.lock().unwrap().clone() {
        return Ok(Some(token));
    }
    match refresh_entry().and_then(|e| e.get_password()) {
        Ok(token) => {
            *REFRESH_TOKEN_CACHE.lock().unwrap() = Some(token.clone());
            Ok(Some(token))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn clear_refresh_token() -> Result<(), String> {
    *REFRESH_TOKEN_CACHE.lock().unwrap() = None;
    match refresh_entry().and_then(|e| e.delete_credential()) {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// One rendered deploy config, as console-api hands it back: `content` is
// the exact file body to write under `file_name`.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConfigFile {
    file_name: String,
    content: String,
}

// Rejects a name that isn't a plain file name, so a crafted response can't
// walk out of the folder the user picked.
fn plain_file_name(name: &str) -> Result<&str, String> {
    let mut parts = Path::new(name).components();
    match (parts.next(), parts.next()) {
        (Some(std::path::Component::Normal(_)), None) => Ok(name),
        _ => Err(format!("invalid file name: {name}")),
    }
}

// Writes the deploy's config files into a folder chosen through the dialog
// plugin. The fs plugin isn't used for this: its scope is declared ahead of
// time in the capability file, which an arbitrary destination picked at
// runtime can't satisfy without opening up the whole home directory.
#[tauri::command]
fn write_config_files(dir: String, files: Vec<ConfigFile>) -> Result<(), String> {
    let dir = PathBuf::from(dir);
    for file in &files {
        plain_file_name(&file.file_name)?;
    }
    for file in &files {
        std::fs::write(dir.join(&file.file_name), &file.content)
            .map_err(|e| format!("{}: {e}", file.file_name))?;
    }
    Ok(())
}

// Writes a single config to the exact path returned by the save dialog.
#[tauri::command]
fn write_config_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| format!("{path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            set_token,
            get_token,
            clear_token,
            set_refresh_token,
            get_refresh_token,
            clear_refresh_token,
            write_config_files,
            write_config_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
