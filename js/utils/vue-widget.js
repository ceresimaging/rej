import { DOMWidgetView } from '@jupyter-widgets/base'

export class VueWidget extends DOMWidgetView {
  constructor(...args) {
    super(...args)

    const props = this.computedProps(this.model.attributes)

    let Vue = this.getVue()
    const options = Vue.options
    
    Vue = Vue.extend({
      data () {
        return {
          ...options.data,
          props
        }
      },
      render(h) {
        const [ App, data, ...rest ] = options.render((..._) => _)
        return h(App, {
          ...data,
          props: this.props,
        }, ...rest)
      }
    })
    this.vm = new Vue()
    this.listenTo(this.model, 'change', this.syncToVue, this);
  }
  syncToVue({ changed: props }) {
    props = this.computedProps(props)
    for (let [key, value] of Object.entries(props)) {
      if (value) this.vm.props[key] = value
    }
  }
  render() {
    const el = document.createElement("div")
    this.el.appendChild(el)
    this.vm.$mount(el)
  }
  // TODO: implement
  // this.vue.$destroy()
}
