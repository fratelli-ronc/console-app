import { Search as SearchIcon } from 'lucide-react'

interface SearchProps {
  value: string
  onChange: (value: string) => void
}

export const Search: React.FC<SearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative flex-1 max-w-72">
      <SearchIcon
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />

      <input
        type="text"
        placeholder="Cerca…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground transition"
      />
    </div>
  )
}
