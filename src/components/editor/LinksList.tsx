import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useResumeStore } from '../../store/resumeStore'
import { selectActive } from './helpers'
import { XIcon } from './icons'
import { AddButton, IconButton, TextField } from './ui'

function LinkRow({ linkId, autoFocus }: { linkId: string; autoFocus: boolean }) {
  const link = useResumeStore((s) => selectActive(s)?.personal.links.find((l) => l.id === linkId))
  const updateLink = useResumeStore((s) => s.updateLink)
  const removeLink = useResumeStore((s) => s.removeLink)
  const labelRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) labelRef.current?.focus()
  }, [autoFocus])
  if (!link) return null
  return (
    <li className="@container flex items-end gap-2">
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 @sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <TextField
          inputRef={labelRef}
          label="Nazwa"
          placeholder="np. Portfolio"
          value={link.label}
          onChange={(label) => updateLink(linkId, { label })}
        />
        <TextField
          label="Adres"
          inputMode="url"
          placeholder="https://"
          value={link.url}
          onChange={(url) => updateLink(linkId, { url })}
        />
      </div>
      <IconButton label={`Usuń link ${link.label || ''}`.trim()} tone="danger" className="mb-1" onClick={() => removeLink(linkId)}>
        <XIcon />
      </IconButton>
    </li>
  )
}

export default function LinksList() {
  const ids = useResumeStore(useShallow((s) => selectActive(s)?.personal.links.map((l) => l.id) ?? []))
  const addLink = useResumeStore((s) => s.addLink)
  const [newId, setNewId] = useState<string | null>(null)
  return (
    <div>
      {ids.length > 0 && (
        <ul className="mb-2 space-y-3">
          {ids.map((id) => (
            <LinkRow key={id} linkId={id} autoFocus={id === newId} />
          ))}
        </ul>
      )}
      <AddButton className="-ml-2.5" onClick={() => setNewId(addLink())}>
        Dodaj link
      </AddButton>
    </div>
  )
}
