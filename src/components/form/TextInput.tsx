import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TextInputProps {
  label: string
  value: string
  required?: boolean
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
  onChange: (value: string) => void
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  required = false,
  type = 'text',
  placeholder,
  onChange,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={label.toLowerCase()}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>

        {/* <a href="#" className="text-xs text-primary hover:underline">
            Password dimenticata?
        </a> */}
      </div>

      <div className="relative">
        <input
          id={label.toLowerCase()}
          type={resolvedType}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition pr-10"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}
