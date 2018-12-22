export const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x))

export const pulse = (d, t) => Math.sin(2 * Math.PI * t / (d * 1000))

export const deg2rad = Math.PI / 180

export const toCartesian = ([r, phi], center = [0, 0]) => {
  const [x, y] = center
  const phiRad = phi * deg2rad
  return [
    x + Math.cos(phiRad) * r,
    y + Math.sin(phiRad) * r
  ]
}

export const distance = ([x1, y1], [x2, y2]) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
