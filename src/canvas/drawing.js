import { deg2rad } from '@/math'

export const ellipse = (ctx, [x, y], radius, rotation = 0) => {
  radius = Array.isArray(radius)
    ? radius
    : [radius, radius]

  ctx.beginPath()
  ctx.ellipse(x, y, ...radius, rotation * deg2rad, 0, 2 * Math.PI)
  ctx.fill()
}

export const text = (ctx, text, pos, fontSize = 10, stroke = false) => {
  ctx.font = `${fontSize}px sans-serif`
  if (stroke) {
    ctx.lineWidth = fontSize / 8
    ctx.strokeText(text, ...pos)
  }
  ctx.fillText(text, ...pos)
}

export const arcSegment = (ctx, [x, y], [fromRadius, toRadius], [fromAngle, toAngle]) => {
  ctx.beginPath()

  ctx.lineWidth = toRadius - fromRadius
  const radius = (fromRadius + toRadius) / 2

  ctx.ellipse(x, y, radius, radius, 0, fromAngle * deg2rad, toAngle * deg2rad)

  ctx.stroke()
}
