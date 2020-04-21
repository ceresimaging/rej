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
  async getDownloadUrlFor(fsPath) {
    // Resolve widgets using rendermime, as per the following workaround:
    // https://github.com/jupyter-widgets/ipywidgets/issues/2800#issuecomment-616844788
    // TODO: follow this issue, submit a PR to implement this properly if we have time
    if (!fsPath) return
    const resolver = this.model.widget_manager.rendermime.resolver
    const resolvedPath = await resolver.resolveUrl(fsPath)
    return await resolver.getDownloadUrl(resolvedPath)
  }
  // TODO: implement
  // this.vue.$destroy()
}
