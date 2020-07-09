import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import Rej from './components/Rej.vue'

Vue.config.productionTip = false

let imageryURL
let referenceURL
imageryURL = "demo/vnir-imagery-distorted.png"
referenceURL = "demo/vnir-imagery.png"

// imageryURL = "demo/2019-09-23 1380 Harlan Blocks A Jenoptik.tif"
// referenceURL = "demo/Harlan Blocks A VNIR.tif"

export default Vue.extend({
  vuetify,
  store,
  render: (h) =>
    h(Rej, {
      props: {
        imageryURL,
        referenceURL,
      }
    })
})
