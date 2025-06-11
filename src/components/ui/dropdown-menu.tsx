import * as React from "react"
import { ChevronDown } from "lucide-react"

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
}

export function DropdownMenu({ trigger, children, align = "end" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`absolute top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 ${
            align === "start" ? "left-0" : "right-0"
          }`}
        >
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function DropdownMenuItem({ children, onClick, className = "", disabled = false }: DropdownMenuItemProps) {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface DropdownMenuSeparatorProps {}

export function DropdownMenuSeparator({}: DropdownMenuSeparatorProps) {
  return <div className="h-px bg-gray-200 my-1" />
} 