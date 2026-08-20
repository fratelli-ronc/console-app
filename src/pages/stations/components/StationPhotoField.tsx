import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import { getStationPhoto, updateStationPhoto } from '@/client'
import type { StationPhotoRef } from '@/client'

interface StationPhotoFieldProps {
  stationId: number
  photo: StationPhotoRef | null
  onUploaded: (photo: StationPhotoRef) => void
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export const StationPhotoField: React.FC<StationPhotoFieldProps> = ({
  stationId,
  photo,
  onUploaded,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!photo?.contentType) {
      setPreview(null)
      return
    }
    let cancelled = false
    getStationPhoto(stationId).then((res) => {
      if (!cancelled && res?.data) {
        setPreview(`data:${res.contentType ?? 'image/jpeg'};base64,${res.data}`)
      }
    })
    return () => {
      cancelled = true
    }
  }, [stationId, photo?.id, photo?.contentType])

  const handleFile = async (file: File) => {
    const dataUrl = await readAsDataUrl(file)
    const base64 = dataUrl.split(',')[1] ?? ''

    setUploading(true)
    const res = await updateStationPhoto(stationId, {
      contentType: file.type,
      data: base64,
    })
    setUploading(false)

    if (res) {
      setPreview(dataUrl)
      onUploaded({ id: res.id, contentType: res.contentType })
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">Foto</label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Foto stazione"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={20} className="text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={12} />
            {uploading ? 'Caricamento…' : 'Carica foto'}
          </button>
          <p className="text-xs text-muted-foreground">JPG o PNG.</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
