// A one-shot Modbus read straight from this machine to a device, used by the
// variable edit dialog to test a memory-map entry before deploying it. Read
// only: nothing here can write to the device.
//
// It mirrors how gobus-opc talks to a group: plain Modbus TCP, or RTU frames
// over a TCP socket, with the address passed through as-is (0-based).

use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::net::TcpStream;
use tokio::time::timeout;
use tokio_modbus::client::Context;
use tokio_modbus::prelude::*;

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub enum ReadFunction {
    Coils,
    DiscreteInputs,
    HoldingRegisters,
    InputRegisters,
}

impl ReadFunction {
    fn is_bits(self) -> bool {
        matches!(self, Self::Coils | Self::DiscreteInputs)
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModbusReadRequest {
    host: String,
    port: u16,
    rtu_over_tcp: bool,
    unit_id: u8,
    function: ReadFunction,
    address: u16,
    quantity: u16,
    connect_timeout_ms: u64,
    transaction_timeout_ms: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModbusReadResponse {
    // Exactly one is set, depending on the function.
    registers: Option<Vec<u16>>,
    bits: Option<Vec<bool>>,
    connect_ms: u64,
    read_ms: u64,
}

enum Data {
    Registers(Vec<u16>),
    Bits(Vec<bool>),
}

async fn read(
    ctx: &mut Context,
    function: ReadFunction,
    address: u16,
    quantity: u16,
) -> tokio_modbus::Result<Data> {
    Ok(match function {
        ReadFunction::Coils => ctx.read_coils(address, quantity).await?.map(Data::Bits),
        ReadFunction::DiscreteInputs => ctx
            .read_discrete_inputs(address, quantity)
            .await?
            .map(Data::Bits),
        ReadFunction::HoldingRegisters => ctx
            .read_holding_registers(address, quantity)
            .await?
            .map(Data::Registers),
        ReadFunction::InputRegisters => ctx
            .read_input_registers(address, quantity)
            .await?
            .map(Data::Registers),
    })
}

fn elapsed_ms(since: Instant) -> u64 {
    since.elapsed().as_millis() as u64
}

#[tauri::command]
pub async fn modbus_read(req: ModbusReadRequest) -> Result<ModbusReadResponse, String> {
    // Protocol limits for a single request.
    let max = if req.function.is_bits() { 2000 } else { 125 };
    if req.quantity == 0 || req.quantity > max {
        return Err(format!(
            "Quantità non valida: {} (ammessa da 1 a {max}).",
            req.quantity
        ));
    }
    if u32::from(req.address) + u32::from(req.quantity) > 0x1_0000 {
        return Err("Indirizzo e quantità escono dalla mappa (max 65535).".into());
    }

    let target = format!("{}:{}", req.host, req.port);

    let started = Instant::now();
    let stream = timeout(
        Duration::from_millis(req.connect_timeout_ms),
        TcpStream::connect((req.host.as_str(), req.port)),
    )
    .await
    .map_err(|_| format!("Timeout di connessione a {target} ({} ms).", req.connect_timeout_ms))?
    .map_err(|e| format!("Connessione a {target} fallita: {e}"))?;
    let connect_ms = elapsed_ms(started);

    let slave = Slave(req.unit_id);
    let mut ctx = if req.rtu_over_tcp {
        rtu::attach_slave(stream, slave)
    } else {
        tcp::attach_slave(stream, slave)
    };

    let started = Instant::now();
    let result = timeout(
        Duration::from_millis(req.transaction_timeout_ms),
        read(&mut ctx, req.function, req.address, req.quantity),
    )
    .await;
    let read_ms = elapsed_ms(started);
    let _ = ctx.disconnect().await;

    let data = result
        .map_err(|_| {
            format!(
                "Nessuna risposta da {target} entro {} ms.",
                req.transaction_timeout_ms
            )
        })?
        .map_err(|e| format!("Errore di comunicazione: {e}"))?
        .map_err(|e| format!("Eccezione Modbus: {e}"))?;

    let quantity = usize::from(req.quantity);
    let (registers, bits) = match data {
        Data::Registers(r) => (Some(r), None),
        // Bits come back padded to a whole byte.
        Data::Bits(mut b) => {
            b.truncate(quantity);
            (None, Some(b))
        }
    };

    Ok(ModbusReadResponse {
        registers,
        bits,
        connect_ms,
        read_ms,
    })
}
