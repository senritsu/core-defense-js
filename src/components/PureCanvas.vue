<template lang="html">
  <div class="pure-canvas">
    <canvas ref="canvas" width="400" height="400" tabindex="1" @keydown="onKeyDown" @keyup="onKeyUp" @focus="onFocus" @blur="onBlur" />
    <div class="help">
      <p>[LeftArrow] + [RightArrow] to move</p>
      <p>Protect the core</p>
    </div>
    <div class="debug">
      <input type="range" v-model.number="player.phi" min="0" max="360" step="1">
      <span>frame: {{ frameInfo.frame }}</span>
      <span>t: {{ frameInfo.t }}</span>
      <span>dt: {{ frameInfo.dt }}</span>
      <span>player: {{ {r: player.r, phi: Math.round(player.phi), input: player.move} }}</span>
      <!-- <span v-for="(projectile, i) in projectiles" :key="i">
        Projectile {{i}}: {{ projectile.r }}
      </span> -->
    </div>
  </div>
</template>

<script>
const random = {
  int: (min, max) => Math.round(min + (max - min) * Math.random())
}

const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x))

const pulse = (d, t) => Math.sin(2 * Math.PI * t / (d * 1000))
const deg2rad = Math.PI / 180
const toCartesian = ([r, phi], center = [0, 0]) => {
  const [x, y] = center
  const phiRad = phi * deg2rad
  return [
    x + Math.cos(phiRad) * r,
    y + Math.sin(phiRad) * r
  ]
}
const distance = ([x1, y1], [x2, y2]) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

const ellipse = (context, [x, y], radius, rotation = 0) => {
  radius = Array.isArray(radius)
    ? radius
    : [radius, radius]

  context.beginPath()
  context.ellipse(x, y, ...radius, rotation * deg2rad, 0, 2 * Math.PI)
  context.fill()
}

const text = (context, text, pos, fontSize = 10, stroke = false) => {
  context.font = `${fontSize}px sans-serif`
  if (stroke) {
    context.lineWidth = fontSize / 8
    context.strokeText(text, ...pos)
  }
  context.fillText(text, ...pos)
}

const handleKeys = (event, handlers) => {
  if (event.repeat) return

  if (event.keyCode in handlers) {
    handlers[event.keyCode]()
    event.preventDefault()
    event.stopPropagation()
  }
}

export default {
  data () {
    return {
      paused: false,
      frameInfo: {
        frame: 0,
        t: 0,
        dt: 0
      },
      player: {
        r: 75,
        phi: 0,
        move: 0,
        v: 120
      },
      game: {
        over: false,
        health: 10,
        score: 0
      },
      projectiles: [],
      stars: []
    }
  },
  methods: {
    update (t) {
      if (this.paused) {
        this.frameInfo.t = t
        requestAnimationFrame(this.update)
        return
      }

      const { t: tLast, frame } = this.frameInfo
      const dt = (t - tLast) / 1000

      this.frameInfo = {
        t,
        dt,
        frame: frame + 1
      }

      if (!this.game.over) {
        this.spawnProjectiles()
        this.movePlayer()
        this.moveProjectiles()
        this.handleCollisions()
      }

      if (this.game.health <= 0) {
        this.game.over = true
        this.paused = true
      }

      this.draw()

      requestAnimationFrame(this.update)
    },
    spawnProjectiles () {
      const maxProjectiles = 3 + Math.floor(this.game.score * 0.2)

      if (this.projectiles.length < maxProjectiles) {
        this.projectiles.push({
          r: random.int(250, 350),
          phi: random.int(0, 360),
          v: random.int(30, 80) + this.game.score,
          vAngular: random.int(-30, 30),
          radius: random.int(10, 20)
        })
      }
    },
    moveProjectiles () {
      const { dt } = this.frameInfo

      this.projectiles.forEach(projectile => {
        projectile.r -= dt * projectile.v
        projectile.phi += dt * projectile.vAngular
      })
    },
    movePlayer () {
      const { dt } = this.frameInfo

      this.player.phi += this.player.move * this.player.v * dt
    },
    handleCollisions () {
      const { r, phi } = this.player
      const player = toCartesian([r, phi], [200, 200])

      this.projectiles = this.projectiles.reduce((remaining, projectile) => {
        const coords = toCartesian([projectile.r, projectile.phi], [200, 200])

        if (distance(player, coords) < (15 + projectile.radius)) { // player collision
          this.game.score++
        } else if (distance(coords, [200, 200]) < (40 + projectile.radius)) { // core collision
          this.game.health--
        } else {
          remaining.push(projectile)
        }
        return remaining
      }, [])
    },
    draw () {
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'
      this.context.font = '10px sans-serif'

      this.drawBackground()
      this.drawCore()
      this.drawProjectiles()
      this.drawPlayer()

      this.drawUi()
    },
    drawBackground () {
      const { t } = this.frameInfo
      this.context.fillStyle = 'black'
      this.context.fillRect(0, 0, 400, 400)

      this.context.fillStyle = '#fff8'
      this.stars.forEach(star => {
        const { x, y, radius, blinkDuration } = star
        const r = 0.5 * radius + 0.49 * pulse(blinkDuration, t)
        ellipse(this.context, [x, y], r)
      })
    },
    drawCore () {
      const { t } = this.frameInfo

      const steps = {
        2: { color: '#f99', pulse: { magnitude: 2.2, duration: 0.8 } },
        5: { color: '#fdd', pulse: { magnitude: 1.5, duration: 1.5 } },
        10: { color: 'white', pulse: { magnitude: 1, duration: 3 } }
      }

      for (const step in steps) {
        if (this.game.health <= step) {
          const { color, pulse: { magnitude, duration } } = steps[step]

          this.context.fillStyle = color
          const r = 40 + magnitude * pulse(duration, t)
          ellipse(this.context, [200, 200], r)

          break
        }
      }
    },
    drawPlayer () {
      const { r, phi } = this.player

      const pos = toCartesian([r, phi], [200, 200])

      this.context.fillStyle = 'darkgreen'
      ellipse(this.context, pos, [10, 30], phi)
    },
    drawProjectiles () {
      const { t } = this.frameInfo

      this.projectiles.forEach(projectile => {
        const { r, phi, radius } = projectile

        const pos = toCartesian([r, phi], [200, 200])

        if (pos.some(c => c < -radius || c > 400 + radius)) {
          const markerPos = toCartesian([50, phi], [200, 200])

          const opacity = 0.15 + 0.15 * pulse(1, t)
          this.context.fillStyle = `rgba(255, 0, 0, ${opacity})`
          ellipse(this.context, markerPos, 5)
        } else {
          this.context.fillStyle = 'darkred'

          ellipse(this.context, pos, radius)

          const distanceToCore = distance(pos, [200, 200]) - projectile.radius - 40
          // const timeToCore = distanceToCore / projectile.v

          this.context.fillStyle = 'white'
          text(this.context, `${Math.round(distanceToCore)}`, pos, 14)
        }
      })
    },
    drawUi () {
      if (this.game.over) {
        this.context.strokeStyle = 'black'
        this.context.fillStyle = 'white'

        text(this.context, 'GAME OVER', [200, 200], 60, true)

        this.context.strokeStyle = 'black'

        text(this.context, `Your score: ${this.game.score}!`, [200, 240], 25, true)
        text(this.context, 'Press [Space] to play again', [200, 270], 25, true)
      } else {
        this.context.fillStyle = 'white'
        text(this.context, `Score: ${this.game.score}`, [200, 15], 25)

        this.context.fillStyle = 'black'
        text(this.context, this.game.health, [200, 200], 35)
      }
    },
    onKeyDown (event) {
      handleKeys(event, {
        32: () => {
          if (this.game.over) {
            this.reset()
          }
          this.paused = !this.paused
        },
        37: () => {
          this.player.move = clamp(this.player.move - 1, -1, 1)
        },
        39: () => {
          this.player.move = clamp(this.player.move + 1, -1, 1)
        }
      })
    },
    onKeyUp (event) {
      handleKeys(event, {
        37: () => {
          this.player.move = clamp(this.player.move + 1, -1, 1)
        },
        39: () => {
          this.player.move = clamp(this.player.move - 1, -1, 1)
        }
      })
    },
    onFocus () {
      if (!this.game.over) {
        this.paused = false
      }
    },
    onBlur () {
      this.paused = true
    },
    reset () {
      this.projectiles = []
      this.game.over = false
      this.game.score = 0
      this.game.health = 10
      this.stars = new Array(random.int(80, 120)).fill(null).map(() => ({
        x: random.int(0, 400),
        y: random.int(0, 400),
        radius: random.int(1, 3),
        blinkDuration: random.int(3, 8)
      }))
    }
  },
  updated () {
    this.context = this.$refs.canvas.getContext('2d')
    this.$refs.canvas.focus()
  },
  mounted () {
    this.context = this.$refs.canvas.getContext('2d')
    this.$refs.canvas.focus()

    this.reset()

    this.t = performance.now()
    requestAnimationFrame(this.update)
  }
}
</script>

<style lang="scss" scoped>
.pure-canvas {
  display: flex;
  flex-direction: column;
}

.debug {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  input {
    align-self: stretch;
  }
}
</style>
