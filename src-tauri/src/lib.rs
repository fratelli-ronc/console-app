use keyring::Entry;

const SERVICE: &str = "it.fratellironc.consoleapp";

fn token_entry() -> keyring::Result<Entry> {
    Entry::new(SERVICE, "auth_token")
}

fn refresh_entry() -> keyring::Result<Entry> {
    Entry::new(SERVICE, "refresh_token")
}

#[tauri::command]
fn set_token(token: String) -> Result<(), String> {
    token_entry()
        .and_then(|e| e.set_password(&token))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_token() -> Result<Option<String>, String> {
    match token_entry().and_then(|e| e.get_password()) {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn clear_token() -> Result<(), String> {
    match token_entry().and_then(|e| e.delete_credential()) {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn set_refresh_token(token: String) -> Result<(), String> {
    refresh_entry()
        .and_then(|e| e.set_password(&token))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_refresh_token() -> Result<Option<String>, String> {
    match refresh_entry().and_then(|e| e.get_password()) {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn clear_refresh_token() -> Result<(), String> {
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
