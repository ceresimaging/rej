import { expose, Transfer } from "threads/worker"

import jsfeat from 'jsfeat'
import fx from 'glfx'

function applyTransform(image, transform) {
  // Monkeypatch self.document to make glfx happy inside a web worker
  // which has no document.createElement('canvas')
  self.document = {
    createElement: () => {
      const canvas = new OffscreenCanvas(1, 1)
      canvas._getContext = canvas.getContext
      canvas.getContext = function () {
        const gl = canvas._getContext("webgl", { 
          alpha: true,
          premultipliedAlpha: false,
          antialias: true
        })

        // We get bad bleedover transparent areas without this
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        return gl
      }
      return canvas
    }
  }
  const fxCanvas = fx.canvas()
  return fxCanvas
    .draw(fxCanvas.texture(image))
    .matrixWarp(transform)
    .update()
    .transferToImageBitmap()
}

function calculateTransform ({ from, to }) {
  const homoKernel = new jsfeat.motion_model.homography2d()
  const transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t)
  const count = Math.min(from.length, to.length)
  homoKernel.run(from, to, transform, count)


  if (transform.cols != 3 || transform.rows != 3 || transform.data.length < 9) {
    alert("Error, transform, isn't shaped as expected")
    throw new Error("Transform isn't shaped as expected: ", transform)
  }

  const error = new jsfeat.matrix_t(count, 1, jsfeat.F32_t | jsfeat.C1_t)
  homoKernel.error(from, to, transform, error.data, count)

  return {
    rmse: Array.from(error.data),
    transform: transform.data,
  }
}

function warpImage ({ transform, image }) {
  const transpose = (a) => Object.keys(a[0]).map(c => a.map((r) => r[c]))
  const transposedTransform = transpose([
    Array.from(transform.slice(0,3)),
    Array.from(transform.slice(3,6)),
    Array.from(transform.slice(6,9))
  ])

  const warpedImage = applyTransform(image, transposedTransform)
  return Transfer({
      warpedImage,
    }, 
    [warpedImage]
  )
}

expose({ calculateTransform, warpImage })
