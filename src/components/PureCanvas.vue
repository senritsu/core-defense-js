<template lang="html">
  <div class="pure-canvas">
    <canvas ref="canvas" width="640" height="640" tabindex="1" @keydown="onKeyDown" @keyup="onKeyUp" @focus="onFocus" @blur="onBlur" />
    <div class="help">
      <p>[LeftArrow] + [RightArrow] to move</p>
      <p>Protect the core</p>
    </div>
    <div v-if="debug" class="debug">
      <!-- <input type="range" v-model.number="player.phi" min="0" max="360" step="1"> -->
      <span>frame: {{ frameInfo.frame }}</span>
      <span>t: {{ frameInfo.t }}</span>
      <span>dt: {{ frameInfo.dt }}</span>
      <span>player: {{ {r: player.r, phi: Math.round(player.phi), input: player.move} }}</span>
      <span v-for="(projectile, i) in projectiles" :key="i">
        Projectile {{i}}: {{ projectile.r }}
      </span>
    </div>
  </div>
</template>

<script>
import * as random from '@/random'
import * as spawning from '@/spawning'
import { toCartesian, distance, pulse, clamp, mod } from '@/math'
import { ellipse, text, arcSegment } from '@/canvas/drawing'

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
        score: 0,
        nextSpawn: 0
      },
      projectiles: [],
      stars: [],
      debug: false
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

      this.draw(this.context, this.frameInfo)

      requestAnimationFrame(this.update)
    },
    spawnProjectiles () {
      const { dt } = this.frameInfo

      this.game.nextSpawn -= dt

      if (this.game.nextSpawn <= 0) {
        const type = random.choice(Object.keys(spawning))

        const newProjectiles = spawning[type]()

        const velocityDifficultyAdjustment = this.game.score / 100
        newProjectiles.forEach(projectile => {
          projectile.v += velocityDifficultyAdjustment * projectile.v
        })

        this.projectiles.push(...newProjectiles)

        const spawnDifficultyAdjustment = 1 / (0.05 * this.game.score + 1)
        this.game.nextSpawn = random.int(3, 5) * spawnDifficultyAdjustment
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

      this.projectiles = this.projectiles.reduce((remaining, projectile) => {
        const dr = Math.abs(r - projectile.r)
        const dPhi = Math.abs(mod(phi - projectile.phi + 180, 360) - 180)

        if (dr <= (projectile.radius + 5) && dPhi <= (projectile.radius + 22.5)) { // player collision
          this.game.score++
        } else if (projectile.r < (40 + projectile.radius)) { // core collision
          this.game.health--
        } else {
          remaining.push(projectile)
        }
        return remaining
      }, [])
    },
    draw (ctx, frameInfo) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '10px sans-serif'

      this.drawBackground(ctx, frameInfo)

      ctx.ellipse(320, 320, 300, 300, 0, 0, 2 * Math.PI)
      ctx.save()
      ctx.clip()

      this.drawCore(ctx, frameInfo)
      this.drawProjectiles(ctx, frameInfo)
      this.drawPlayer(ctx, frameInfo)

      ctx.restore()

      this.drawForeground(ctx, frameInfo)
      this.drawUi(ctx, frameInfo)
    },
    drawBackground (ctx, { t }) {
      ctx.fillStyle = 'black'
      ellipse(ctx, [320, 320], 300)

      ctx.fillStyle = '#fff8'
      this.stars.forEach(star => {
        const { r, phi, radius, blinkDuration } = star
        const [x, y] = toCartesian([r, phi], [320, 320])
        const animatedRadius = 0.5 * radius + 0.49 * pulse(blinkDuration, t)
        ellipse(ctx, [x, y], animatedRadius)
      })
    },
    drawForeground (ctx) {
      ctx.beginPath()
      ctx.strokeStyle = 'rgb(16, 20, 33)'
      ctx.lineWidth = 10
      ctx.ellipse(320, 320, 305, 305, 0, 0, 2 * Math.PI)
      ctx.stroke()
    },
    drawCore (ctx, { t }) {
      const steps = {
        2: { color: '#f99', pulse: { magnitude: 2.2, duration: 0.8 } },
        5: { color: '#fdd', pulse: { magnitude: 1.5, duration: 1.5 } },
        10: { color: 'white', pulse: { magnitude: 1, duration: 3 } }
      }

      for (const step in steps) {
        if (this.game.health <= step) {
          const { color, pulse: { magnitude, duration } } = steps[step]

          ctx.fillStyle = color
          const r = 40 + magnitude * pulse(duration, t)
          ellipse(ctx, [320, 320], r)

          break
        }
      }
    },
    drawPlayer (ctx) {
      const { r, phi } = this.player

      ctx.strokeStyle = 'rgb(72, 161, 204)'
      arcSegment(ctx, [320, 320], [r, r + 10], [phi - 22.5, phi + 22.5])
    },
    drawProjectiles (ctx, { t }) {
      this.projectiles.forEach(projectile => {
        const { r, phi, radius } = projectile

        const pos = toCartesian([r, phi], [320, 320])

        if (r > 300 + radius) {
          const markerPos = toCartesian([50, phi], [320, 320])

          const opacity = 0.15 + 0.15 * pulse(60 / projectile.v, t)
          ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`
          ellipse(ctx, markerPos, 5)
        } else {
          ctx.fillStyle = 'darkred'

          ellipse(ctx, pos, radius)

          const distanceToCore = distance(pos, [320, 320]) - projectile.radius - 40
          // const timeToCore = distanceToCore / projectile.v

          ctx.fillStyle = 'white'
          text(ctx, `${Math.round(distanceToCore)}`, pos, 14)
        }
      })
    },
    drawUi (ctx) {
      if (this.game.over) {
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'white'

        text(ctx, 'GAME OVER', [320, 320], 60, true)

        ctx.strokeStyle = 'black'

        text(ctx, `Your score: ${this.game.score}!`, [200, 240], 25, true)
        text(ctx, 'Press [Space] to play again', [200, 270], 25, true)
      } else {
        ctx.fillStyle = 'white'
        text(ctx, `Score: ${this.game.score}`, [200, 15], 25)

        ctx.fillStyle = 'black'
        text(ctx, this.game.health, [320, 320], 35)
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
        },
        68: () => {
          this.debug = !this.debug
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
        r: random.int(0, 295),
        phi: random.int(0, 360),
        radius: random.int(1, 3),
        blinkDuration: random.int(3, 8)
      }))
    }
  },
  updated () {
    this.context = this.$refs.canvas.getContext('2d')
    this.$refs.canvas.focus()
  },
  created () {
    this.reset()

    this.frameInfo.t = performance.now()
    requestAnimationFrame(this.update)
  },
  mounted () {
    this.context = this.$refs.canvas.getContext('2d')
    this.$refs.canvas.focus()
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
