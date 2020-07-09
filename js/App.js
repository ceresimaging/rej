import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import Rej from './components/Rej.vue'

Vue.config.productionTip = false

export default Vue.extend({
  vuetify,
  store,
  render: (h) =>
    h(Rej, {
      props: {
        imageryURL: "demo/vnir-imagery-distorted.png",
        referenceURL: "demo/vnir-imagery.png",
      }
    })
})
