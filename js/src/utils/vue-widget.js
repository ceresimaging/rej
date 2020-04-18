import { DOMWidgetView } from '@jupyter-widgets/base'

export class VueWidget extends DOMWidgetView {
  constructor(...args) {
    super(...args)

    const props = this.computedProps(this.model.attributes)
    const self = this

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
        const result = h(App, {
          ...data,
          props: this.props,
        }, ...rest)

        const changed = data ? data.props : {}
        self.syncToVue({ changed })
        return result
      }
    })
    this.vm = new Vue()
    this.listenTo(this.model, 'change', this.syncToVue, this);
  }
  syncToVue({ changed: props }) {
    props = this.computedProps(props)
    for (let [key, value] of Object.entries(props)) {
      this.vm.props[key] = value
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
