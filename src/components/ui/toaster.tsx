import { useToast } from "@/context/toast-context"
import { Toast, ToastViewport } from "./toast"
import { X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant}>
          <div className="grid gap-1">
            {toast.title && (
              <div className="text-sm font-semibold">{toast.title}</div>
            )}
            <div className="text-sm opacity-90">{toast.description}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-2 h-6 w-6 rounded-md p-0",
              toast.variant === "destructive" &&
                "text-destructive-foreground hover:bg-destructive/20",
              toast.variant === "success" &&
                "text-green-900 hover:bg-green-100 dark:text-green-50 dark:hover:bg-green-800"
            )}
            onClick={() => dismiss(toast.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Toast>
      ))}
    </ToastViewport>
  )
}

