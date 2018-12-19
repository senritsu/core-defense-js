<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" width="50px">
    <h1>Core Defense JS</h1>
    <strong>Please choose a variant</strong>
    <div class="variant-selection">
      <button @click="setVariant('pure')" :class="{active: variant === 'pure'}">Pure JS + canvas</button>
      <button @click="setVariant('vue')" :class="{active: variant === 'vue'}">Vue + SVG + physics engine</button>
    </div>
    <component :is="component" />
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

import PureCanvas from './components/PureCanvas'
import VueSVG from './components/VueSVG'

export default {
  name: 'app',
  components: {
    PureCanvas,
    VueSVG
  },
  computed: {
    ...mapState([
      'variant'
    ]),
    component () {
      switch (this.variant) {
        case 'pure': return 'PureCanvas'
        case 'vue': return 'VueSVG'
        default: return null
      }
    }
  },
  methods: {
    ...mapMutations([
      'setVariant'
    ])
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;

  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  margin-bottom: 0.2em;
}

.variant-selection {
  display: flex;
}

button {
  flex: 1;
  margin: 5px;
  border: 1px solid darkslategrey;
  padding: 2px 8px;
  background-color: lightgray;
  color: black;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: gray;
  }

  &.active {
    font-weight: bold;
    background-color: slategrey;
    color: white;
  }
}
</style>
