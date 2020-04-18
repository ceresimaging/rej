import { DOMWidgetView } from '@jupyter-widgets/base'

export class VueWidget extends DOMWidgetView {
  constructor({ vue, ...rest}) {
    super(rest)
    if (vue != undefined) this.vue = vue
  }
  createVue() {
    throw new Error("Not implemented, please override")
  }
  render() {
    if (!this.vue) {
      this.vue = this.createVue()
    }
    const el = document.createElement("div")
    this.el.appendChild(el)
    this.vue.$mount(el)
  }
  // TODO: implement
  // this.vue.$destroy()
}
