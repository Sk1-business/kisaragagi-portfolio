import type { ReactNode } from "react"
import { AlertTriangle, CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

interface UserConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  cancelLabel?: string
  showCancelButton?: boolean
  isConfirming?: boolean
  confirmDisabled?: boolean
  cancelDisabled?: boolean
  errorMessage?: string
  variant?: "default" | "destructive"
  content?: ReactNode
}

export function UserConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel,
  cancelLabel = "戻る",
  showCancelButton = true,
  isConfirming = false,
  confirmDisabled = false,
  cancelDisabled = false,
  errorMessage = "",
  variant = "destructive",
  content = null,
}: UserConfirmDialogProps) {
  if (!open) return null
  const isDestructive = variant === "destructive"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (cancelDisabled) return
          onCancel()
        }}
        onKeyDown={() => {}}
        role="presentation"
      />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-full ${
              isDestructive ? "bg-red-100" : "bg-slate-100"
            }`}
          >
            {isDestructive ? (
              <AlertTriangle className="size-5 text-red-600" />
            ) : (
              <CircleAlert className="size-5 text-slate-600" />
            )}
          </div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </div>
        {content}
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        {errorMessage ? <p className="mt-3 text-xs text-destructive">{errorMessage}</p> : null}
        <div className="mt-5 flex gap-3">
          {showCancelButton ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={cancelDisabled}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={variant}
            className={`${showCancelButton ? "flex-1" : "w-full"} rounded-xl`}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {isConfirming ? "処理中..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
