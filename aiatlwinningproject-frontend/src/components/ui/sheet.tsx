import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined)

const Sheet = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)

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
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetTrigger must be used within Sheet")

  const handleClick = () => {
    context.setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: (e: React.MouseEvent) => {
        handleClick()
        if (children.props.onClick) {
          children.props.onClick(e)
        }
      },
    })
  }

  return (
    <button
      ref={ref}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" | "top" | "bottom" }
>(({ className, side = "right", children, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetContent must be used within Sheet")

  if (!context.open) return null

  const sideClasses = {
    left: "left-0 top-0 h-full border-r",
    right: "right-0 top-0 h-full border-l",
    top: "top-0 left-0 w-full border-b",
    bottom: "bottom-0 left-0 w-full border-t",
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => context.setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 w-[300px] bg-background p-6 shadow-lg transition-transform",
          sideClasses[side],
          className
        )}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={() => context.setOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }

