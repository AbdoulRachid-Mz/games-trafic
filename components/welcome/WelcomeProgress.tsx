import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface WelcomeProgressProps {
  current: number
  total: number
  onDotClick: (index: number) => void
  className?: string
}

export function WelcomeProgress({ current, total, onDotClick, className }: WelcomeProgressProps) {
  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length: total }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "h-2 rounded-full bg-muted cursor-pointer",
            "hover:opacity-80 transition-opacity"
          )}
          initial={{ width: '15px' }}
          animate={{
            width: index === current ? '30px' : '15px',
            backgroundColor: index === current ? 'var(--primary)' : 'var(--muted)'
          }}
          transition={{ duration: 0.3 }}
          onClick={() => onDotClick(index)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      ))}
    </div>
  )
}