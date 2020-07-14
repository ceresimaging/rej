import { VueWidget } from './utils/vue-widget'
import { DOMWidgetModel } from '@jupyter-widgets/base'
import { PageConfig } from '@jupyterlab/coreutils'
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/'

import App from './App'

export class RejWidget extends VueWidget {
  computedProps(props) {
    window.rej = this
    return {
      ...props,
      imageryURL: this.getDownloadUrlFor(props.imageryPath),
      referenceURL: this.getDownloadUrlFor(props.referencePath),
      ptsCallback: ptsFile => {
        this.model.set('ptsFile', ptsFile)
        this.model.save_changes() 
        this.send("tell_server_to_download_pts")
      }
    }
  }
  getVue() { 
    return App 
  }
}

export class RejModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _view_name: 'RejWidget',
      _model_name: 'RejModel',
      _model_module: '@ceresimaging/rej',
      _view_module: '@ceresimaging/rej',
      imageryURL: null,
      imageryPath: null,
      referenceURL: null,
      referencePath: null,
      imageryTiffPath: null,
      referenceTiffPath: null,
      imageryPNGSize: null,
      referencePNGSize: null,
      imagery: null, //new DataView(new ArrayBuffer(0)),
      reference: null, // new DataView(new ArrayBuffer(0)),
    }
  }
}
