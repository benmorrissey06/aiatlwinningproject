import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

export const Dialog = ({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger = ({ children, asChild }: {
  children: React.ReactNode
  asChild?: boolean
}) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within Dialog")

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => context.setOpen(true),
    })
  }

  return (
    <div onClick={() => context.setOpen(true)}>
      {children}
    </div>
  )
}

export const DialogContent = ({ children, className }: {
  children: React.ReactNode
  className?: string
}) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within Dialog")

  if (!context.open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => context.setOpen(false)}
      />
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={() => context.setOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className={cn(className)}>
          {children}
        </div>
      </div>
    </>
  )
}

export const DialogHeader = ({ children, className }: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
    {children}
  </div>
)

export const DialogTitle = ({ children, className }: {
  children: React.ReactNode
  className?: string
}) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h2>
)

export const DialogDescription = ({ children, className }: {
  children: React.ReactNode
  className?: string
}) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
)

