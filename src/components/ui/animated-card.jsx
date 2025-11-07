import * as React from "react"
import { cn } from "../../lib/utils"
import { Card } from "./card"

const AnimatedCard = React.forwardRef(({ className, children, ...props }, ref) => {
  const cardRef = React.useRef(null)
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = React.useState(false)

  React.useImperativeHandle(ref, () => cardRef.current)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMousePosition({ x, y })
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setMousePosition({ x: 0, y: 0 })
  }

  const getTiltStyle = () => {
    if (!cardRef.current || !isHovering) {
      return {
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      }
    }

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((mousePosition.y - centerY) / centerY) * -10
    const rotateY = ((mousePosition.x - centerX) / centerX) * 10

    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
    }
  }

  const getShineStyle = () => {
    if (!cardRef.current || !isHovering) {
      return { opacity: 0 }
    }

    const rect = cardRef.current.getBoundingClientRect()
    const x = (mousePosition.x / rect.width) * 100
    const y = (mousePosition.y / rect.height) * 100

    return {
      opacity: 1,
      background: `radial-gradient(circle at ${x}% ${y}%, rgba(200, 225, 245, 0.8) 0%, rgba(200, 225, 245, 0.3) 40%, transparent 70%)`,
    }
  }

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <Card
        ref={cardRef}
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-out",
          "hover:shadow-2xl",
          className
        )}
        style={getTiltStyle()}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Shine overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={getShineStyle()}
        />

        {/* Glimmer effect */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            isHovering ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(200, 225, 245, 0.1) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: isHovering ? 'shimmer 2s infinite' : 'none',
          }}
        />

        {/* Content with relative positioning to stay above overlays */}
        <div className="relative z-10">
          {children}
        </div>
      </Card>
    </div>
  )
})

AnimatedCard.displayName = "AnimatedCard"

export { AnimatedCard }
