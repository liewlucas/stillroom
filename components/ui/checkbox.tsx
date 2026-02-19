"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends React.ComponentProps<"button"> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

function Checkbox({
    className,
    checked = false,
    onCheckedChange,
    ...props
}: CheckboxProps) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                className
            )}
            onClick={() => onCheckedChange?.(!checked)}
            {...props}
        >
            {checked && (
                <span className="flex items-center justify-center text-current">
                    <Check className="h-3 w-3" />
                </span>
            )}
        </button>
    )
}

export { Checkbox }
