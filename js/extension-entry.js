// This file is not touched by OUR webpack
// Its designed to be loaded as the entry-point by the jupyterlab
// build's webpack in $PYTHON_ENV/share/jupyter/lab/staging/build

import * as WebpackedExtension from './rej.umd.js'
import 'file-loader?name=warp-worker.js!./warp-worker.js'
export default WebpackedExtension