import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('user') || 'null')
  },
  mutations: {
    setUser (state, data) {
      state.user = JSON.parse(data)
      localStorage.setItem('user', data)
    }
  },
  actions: {
  },
  modules: {
  }
})
