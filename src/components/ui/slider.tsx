import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value?: number[]
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value[0] || 0)

    React.useEffect(() => {
      if (value[0] !== undefined) {
        setInternalValue(value[0])
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      setInternalValue(newValue)
      onValueChange?.([newValue])
    }

    const max = props.max || 100
    const min = props.min || 0
    const percentage = ((internalValue - min) / (max - min)) * 100

    return (
      <div className="relative flex w-full items-center">
        <input
          type="range"
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          min={min}
          max={max}
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary",
            className
          )}
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--secondary)) ${percentage}%, hsl(var(--secondary)) 100%)`,
          }}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }

