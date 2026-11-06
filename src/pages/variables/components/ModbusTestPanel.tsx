import { useState } from 'react'
import { AlertCircle, Play } from 'lucide-react'
import { FilledButton } from '@/components'
import type { Group } from '@/client'
import { modbusRead, type ModbusReadResult } from '@/lib/modbus'
import { Section } from './FormFields'
import { decodeModbusValue, planModbusTest } from './modbusTest'
import type { VariableForm } from './variableForm'

interface ModbusTestPanelProps {
  form: VariableForm
  group: Group | undefined
  // Off for the MX3 drivers, whose values aren't plain formats.
  decode: boolean
}

type Outcome =
  | {
      kind: 'ok'
      result: ModbusReadResult
      // What was read, to label the rows and spot a form changed since.
      address: number
      requestKey: string
      at: Date
    }
  | { kind: 'error'; message: string }

// Reads the variable's memory-map entry straight from the device, with the
// form's current values, and shows the raw reply and the decoded value.
export const ModbusTestPanel: React.FC<ModbusTestPanelProps> = ({
  form,
  group,
  decode,
}) => {
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const plan = planModbusTest(form, group)
  const requestKey = plan.ok ? JSON.stringify(plan.request) : ''

  const run = async () => {
    if (!plan.ok || running) return
    setRunning(true)
    try {
      const result = await modbusRead(plan.request)
      setOutcome({
        kind: 'ok',
        result,
        address: plan.request.address,
        requestKey,
        at: new Date(),
      })
    } catch (e) {
      setOutcome({ kind: 'error', message: String(e) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Section
      title="Test Modbus"
      description="Lettura diretta dal dispositivo con i valori del modulo, anche non salvati. Il PC deve raggiungere l'IP del gruppo."
      action={
        <FilledButton
          type="button"
          className="h-8 px-3 flex items-center gap-1.5 whitespace-nowrap"
          disabled={!plan.ok || running}
          onClick={() => void run()}
        >
          <Play size={14} />
          {running ? 'Lettura…' : 'Leggi'}
        </FilledButton>
      }
    >
      <p className="text-xs font-mono text-muted-foreground break-all">
        {plan.ok ? plan.summary : plan.reason}
      </p>

      {outcome?.kind === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="break-words">{outcome.message}</p>
        </div>
      )}

      {outcome?.kind === 'ok' && (
        <ReadOutcome
          result={outcome.result}
          baseAddress={outcome.address}
          at={outcome.at}
          stale={outcome.requestKey !== requestKey}
          decoded={decode ? decodeModbusValue(form, outcome.result) : null}
        />
      )}
    </Section>
  )
}

interface ReadOutcomeProps {
  result: ModbusReadResult
  baseAddress: number
  at: Date
  stale: boolean
  decoded: ReturnType<typeof decodeModbusValue> | null
}

const ReadOutcome: React.FC<ReadOutcomeProps> = ({
  result,
  baseAddress,
  at,
  stale,
  decoded,
}) => (
  <div className="flex flex-col gap-3">
    {decoded && (
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-muted-foreground">Valore</span>
        {'value' in decoded ? (
          <span className="text-lg font-semibold text-foreground font-mono break-all">
            {decoded.value}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{decoded.note}</span>
        )}
      </div>
    )}

    <div className="max-h-60 overflow-auto rounded-lg border border-border">
      <table className="w-full text-xs font-mono">
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Indirizzo</th>
            <th className="px-3 py-1.5 text-right font-medium">Dec</th>
            {result.registers && (
              <>
                <th className="px-3 py-1.5 text-right font-medium">Hex</th>
                <th className="px-3 py-1.5 text-right font-medium">Bin</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {result.registers?.map((word, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-1">{baseAddress + i}</td>
              <td className="px-3 py-1 text-right">{word}</td>
              <td className="px-3 py-1 text-right">
                0x{word.toString(16).toUpperCase().padStart(4, '0')}
              </td>
              <td className="px-3 py-1 text-right whitespace-nowrap">
                {word
                  .toString(2)
                  .padStart(16, '0')
                  .replace(/(.{4})(?!$)/g, '$1 ')}
              </td>
            </tr>
          ))}
          {result.bits?.map((bit, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-1">{baseAddress + i}</td>
              <td className="px-3 py-1 text-right">{bit ? 1 : 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p className="text-xs text-muted-foreground">
      {at.toLocaleTimeString('it-IT')} · connessione {result.connectMs} ms ·
      lettura {result.readMs} ms
      {stale && ' · parametri cambiati dopo la lettura: rileggi'}
    </p>
  </div>
)
