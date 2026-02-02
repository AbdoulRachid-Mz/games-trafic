import Link from "next/link"
import { Gamepad2 } from "lucide-react"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-md p-1.5">
        <Gamepad2 className="h-6 w-6 text-white" />
      </div>
      <span className="hidden font-bold sm:inline-block text-xl bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
        Games-Trafics
      </span>
    </Link>
  )
}
