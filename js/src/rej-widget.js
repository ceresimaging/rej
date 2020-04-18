import { VueWidget } from './utils/vue-widget'
import { DOMWidgetModel } from '@jupyter-widgets/base'
import { PageConfig } from '@jupyterlab/coreutils'
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/'

import createApp from './createapp'

const toDataURL = (pngBytes) =>
  URL.createObjectURL(
    new Blob(
      [pngBytes], {
        type: 'image/png'
      }
    )
  )

const toLabURL = (localPath) => localPath ? `${PageConfig.getBaseUrl()}files/${localPath}` : localPath

export class RejWidget extends VueWidget {
  constructor(...rest) {
    super(...rest)
    this.listenTo(this.model, 'change:referencePath', this._count_changed, this);
  }
  _count_changed() {
    console.log("HI! Count changed u know?")
    window.vm = this.vue
  }
  createVue() {
    const { imageryPath, referencePath, imagery, reference } = this.model.attributes
    
    return createApp({
      referenceURL: reference ? toDataURL(reference) : toLabURL(referencePath),
      imageryURL: imagery ? toDataURL(imagery) : toLabURL(imageryPath),
    })
  }
  
}

export class RejModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _view_name: 'RejDOMWidget',
      _model_name: 'RejModel',
      _model_module: 'ceresimaging-rej',
      _view_module: 'ceresimaging-rej',
      imageryPath: null,
      referencePath: null,
      imagery: null, //new DataView(new ArrayBuffer(0)),
      reference: null, // new DataView(new ArrayBuffer(0)),
    }
  }
}
