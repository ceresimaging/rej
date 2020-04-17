import VueKonva from 'vue-konva'

import 'vue-resize/dist/vue-resize.css'
import VueResize from 'vue-resize'

import VueLocalStorage from 'vue-localstorage'

import Vue from 'vue'

Vue.config.productionTip = false

Vue.use(VueLocalStorage)
Vue.use(VueResize)
Vue.use(VueKonva)

