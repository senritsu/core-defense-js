import { deg2rad } from '@/math'

export const ellipse = (context, [x, y], radius, rotation = 0) => {
  radius = Array.isArray(radius)
    ? radius
    : [radius, radius]

  context.beginPath()
  context.ellipse(x, y, ...radius, rotation * deg2rad, 0, 2 * Math.PI)
  context.fill()
}

export const text = (context, text, pos, fontSize = 10, stroke = false) => {
  context.font = `${fontSize}px sans-serif`
  if (stroke) {
    context.lineWidth = fontSize / 8
    context.strokeText(text, ...pos)
  }
  context.fillText(text, ...pos)
}
