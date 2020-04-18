import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import App from './components/RegistrationTask.vue'

Vue.config.productionTip = false

export default function createApp(props={}) {
  return new Vue({
    vuetify,
    store,
    data () {
      return {
        props
      }
    },
    render(h) {
      return h(App, { 
        props: this.props 
      })
    }
  })
}

