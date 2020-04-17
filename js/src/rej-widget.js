import { VueWidget, VueDOMWidget } from './utils/vue-widget'
import { DOMWidgetModel } from '@jupyter-widgets/base'
import { PageConfig } from '@jupyterlab/coreutils'
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/'

import createApp from './createapp'

export class RejWidget extends VueWidget {
  constructor() {
    const vue = createApp()
    super(vue, 'georeference-widget')
    this.title.label = 'Georeference'
  }
}

const toDataURL = (pngBytes) =>
  URL.createObjectURL(
    new Blob(
      [pngBytes], {
        type: 'image/png'
      }
    )
  )

const toLabURL = (localPath) => `${PageConfig.getBaseUrl()}files/${localPath}`

export class RejDOMWidget extends VueDOMWidget {
  constructor(...rest) {
    super(...rest)
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
      imageryPath: "",
      referencePath: "",
      imagery: null, //new DataView(new ArrayBuffer(0)),
      reference: null, // new DataView(new ArrayBuffer(0)),
    }
  }
}
