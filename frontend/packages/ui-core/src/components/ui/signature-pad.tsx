import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Eraser } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

interface SignaturePadProps {
  label?: string
  value?: string | null
  onChange?: (base64: string | null) => void
  className?: string
  height?: number
}

export function SignaturePad({
  label,
  value,
  onChange,
  className,
  height = 150,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    ctx.strokeStyle = "hsl(184.4, 100%, 18.8%)"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  useEffect(() => {
    if (!value) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const img = new Image()
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr)
      setHasContent(true)
    }
    img.src = value
  }, [value])

  const getPos = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      }
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }, [])

  const startDraw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return
      const pos = getPos(event)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      setIsDrawing(true)
    },
    [getPos]
  )

  const draw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return
      const pos = getPos(event)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setHasContent(true)
    },
    [isDrawing, getPos]
  )

  const endDraw = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return
    onChange?.(canvas.toDataURL("image/png"))
  }, [isDrawing, onChange])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasContent(false)
    onChange?.(null)
  }, [onChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault()
      startDraw(event as unknown as React.TouchEvent)
    }

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      draw(event as unknown as React.TouchEvent)
    }

    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault()
      endDraw()
    }

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
    }
  }, [startDraw, draw, endDraw])

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={!hasContent}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            <Eraser className="mr-1 h-3.5 w-3.5" />
            Effacer
          </Button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair touch-none rounded-lg border border-input bg-background/50"
        style={{ height: `${height}px` }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
      />
    </div>
  )
}
