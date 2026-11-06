import { invoke } from '@tauri-apps/api/core'

/**
 * A one-shot, read-only Modbus read sent from this machine straight to a
 * device, through the `modbus_read` command in `src-tauri/src/modbus.rs`.
 * The PC must be able to reach the device's IP (LAN or VPN).
 */

export type ModbusReadFunction =
  | 'coils'
  | 'discreteInputs'
  | 'holdingRegisters'
  | 'inputRegisters'

export interface ModbusReadRequest {
  host: string
  port: number
  rtuOverTcp: boolean
  unitId: number
  function: ModbusReadFunction
  // 0-based, as gobus-opc sends it.
  address: number
  quantity: number
  connectTimeoutMs: number
  transactionTimeoutMs: number
}

export interface ModbusReadResult {
  // Exactly one is set, depending on the function.
  registers: number[] | null
  bits: boolean[] | null
  connectMs: number
  readMs: number
}

// Rejects with the message from the Rust side (connection, timeout or
// Modbus exception), already worded for the user.
export const modbusRead = (req: ModbusReadRequest) =>
  invoke<ModbusReadResult>('modbus_read', { req })
