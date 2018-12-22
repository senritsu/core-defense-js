import * as random from './random'

export const burst = () => {
  const phi = random.int(0, 360)

  return [...new Array(3)].map(() => ({
    r: random.int(600, 800),
    phi: (phi + random.int(-20, 20)) % 360,
    v: random.int(80, 120),
    vAngular: random.int(-3, 3),
    radius: random.int(8, 12)
  }))
}

export const regular = () => [
  {
    r: random.int(250, 350),
    phi: random.int(0, 360),
    v: random.int(40, 70),
    vAngular: random.int(-6, 6),
    radius: random.int(15, 25)
  }
]

export const orbiter = () => [
  {
    r: random.int(350, 450),
    phi: random.int(0, 360),
    v: random.int(30, 50),
    vAngular: random.choice([-1, 1]) * random.int(15, 30),
    radius: random.int(10, 20)
  }
]
