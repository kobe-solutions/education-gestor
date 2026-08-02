import { Keyboard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { SHORTCUTS } from '../hooks/useKeyboardShortcuts'

interface ShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Atalhos de teclado
          </DialogTitle>
          <DialogDescription>
            Pressione <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-mono">?</kbd> para abrir esta janela a qualquer momento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
            >
              <span className="text-sm">{s.label}</span>
              <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
