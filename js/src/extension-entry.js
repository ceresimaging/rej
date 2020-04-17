// This file is not touched by OUR webpack
// Its designed to be loaded as the entry-point by the jupyterlab
// build's webpack in $PYTHON_ENV/share/jupyter/lab/staging/build

import * as WebpackedExtension from './ceresimaging-rej.umd.js'
import * as WarpWorker from 'file-loader?name=warp-worker.js!./warp-worker.js'

console.log("USING THE NEW NON-WEBPACKED ENTRY", WarpWorker)
window.ww = WarpWorker

export default WebpackedExtension