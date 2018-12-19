import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    variant: null
  },
  mutations: {
    setVariant (state, variant) { state.variant = variant }
  },
  actions: {

  }
})
