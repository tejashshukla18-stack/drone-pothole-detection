import { useEffect, useRef, useState } from 'react'

// Maps a mouse/pointer event to canvas-internal pixel coordinates, accounting
// for any CSS zoom scaling applied to the <canvas> element.
function toCanvasCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

export default function ReviewCanvas({
  imageUrl,
  boxes,
  showBoxes,
  showLabels,
  selectedBoxId,
  isDrawingBox,
  zoom,
  onBoxSelect,
  onBoxCreate,
  onImageLoaded,
}) {
  const canvasRef = useRef(null)
  const isMouseDownRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })

  const [image, setImage] = useState(null)
  const [dragRect, setDragRect] = useState(null)

  // Load the active frame whenever the image URL changes.
  useEffect(() => {
    if (!imageUrl) {
      setImage(null)
      return undefined
    }
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      setImage(img)
      onImageLoaded?.({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = imageUrl
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  // Redraw the raster + overlay whenever anything relevant changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (!image) {
      canvas.width = 800
      canvas.height = 500
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#475569'
      ctx.font = '14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No Aerial Drone Imagery Loaded in Buffer', canvas.width / 2, canvas.height / 2 - 10)
      ctx.font = '12px Inter, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(
        'Upload aerial drone photos from the Ingestion tab to run neural defect triage.',
        canvas.width / 2,
        canvas.height / 2 + 16,
      )
      return
    }

    canvas.width = image.naturalWidth || 800
    canvas.height = image.naturalHeight || 600
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const activeBoxes = boxes || []

    if (showBoxes && activeBoxes.length > 0) {
      const count = activeBoxes.length
      const baseThickness = Math.max(1, Math.min(2, Math.round(canvas.width / 400)))
      const fontSize =
        count > 3 ? Math.max(10, Math.round(canvas.height / 35)) : Math.max(12, Math.round(canvas.height / 28))

      activeBoxes.forEach((box) => {
        const isSelected = box.id === selectedBoxId
        const outlineColor = isSelected ? '#38bdf8' : box.status === 'Rejected' ? '#94a3b8' : '#00FF00'

        ctx.save()
        ctx.strokeStyle = outlineColor
        ctx.lineWidth = isSelected ? baseThickness + 1.5 : baseThickness
        ctx.strokeRect(box.x, box.y, box.width, box.height)

        if (showLabels) {
          const confStr = box.confidence ? `${box.confidence}`.replace(/[^0-9%]/g, '') : '85%'
          const formattedConf = confStr.endsWith('%') ? confStr : `${confStr}%`
          const labelText = count > 2 ? formattedConf : box.label || `Pothole (${formattedConf})`

          ctx.font = `bold ${fontSize}px Arial, sans-serif`
          const textX = box.x + 2
          const textY = box.y > fontSize + 4 ? box.y - 4 : box.y + fontSize + 2

          ctx.save()
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
          ctx.shadowBlur = 3
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          ctx.fillStyle = isSelected ? '#38bdf8' : box.status === 'Rejected' ? '#94a3b8' : '#00FF00'
          ctx.fillText(labelText, textX, textY)
          ctx.restore()
        }

        ctx.restore()
      })
    }

    // Live preview while dragging a manual box.
    if (dragRect) {
      const { x, y, w, h } = dragRect
      ctx.save()
      ctx.strokeStyle = '#38bdf8'
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      ctx.restore()
    }
  }, [image, boxes, showBoxes, showLabels, selectedBoxId, dragRect])

  function handleMouseDown(e) {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const { x, y } = toCanvasCoords(e, canvas)
    isMouseDownRef.current = true
    startPosRef.current = { x, y }
    if (isDrawingBox) setDragRect({ x, y, w: 0, h: 0 })
  }

  function handleMouseMove(e) {
    if (!isMouseDownRef.current || !isDrawingBox) return
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = toCanvasCoords(e, canvas)
    const { x: sx, y: sy } = startPosRef.current
    setDragRect({
      x: Math.min(sx, x),
      y: Math.min(sy, y),
      w: Math.abs(x - sx),
      h: Math.abs(y - sy),
    })
  }

  function handleMouseUp(e) {
    if (!isMouseDownRef.current) return
    isMouseDownRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const { x: endX, y: endY } = toCanvasCoords(e, canvas)
    const { x: startX, y: startY } = startPosRef.current

    if (isDrawingBox) {
      const w = Math.abs(endX - startX)
      const h = Math.abs(endY - startY)
      if (w > 15 && h > 15) {
        onBoxCreate({
          x: Math.round(Math.min(startX, endX)),
          y: Math.round(Math.min(startY, endY)),
          width: Math.round(w),
          height: Math.round(h),
        })
      }
      setDragRect(null)
      return
    }

    // Not drawing: treat a near-stationary click as a box selection attempt.
    const moved = Math.hypot(endX - startX, endY - startY)
    if (moved < 5) {
      const hit = [...(boxes || [])].reverse().find(
        (b) => endX >= b.x && endX <= b.x + b.width && endY >= b.y && endY <= b.y + b.height,
      )
      onBoxSelect(hit ? hit.id ?? null : null)
    }
  }

  return (
    <div className="relative flex-1 overflow-auto rounded-sm bg-slate-100">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ width: `${zoom * 100}%`, height: 'auto', cursor: isDrawingBox ? 'crosshair' : 'pointer' }}
        className="block"
      />
    </div>
  )
}
