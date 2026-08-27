use keyring::Entry;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            set_token,
            get_token,
            clear_token,
            set_refresh_token,
            get_refresh_token,
            clear_refresh_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
