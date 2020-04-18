import { readRasterFromURL } from 'fast-geotiff'

export default async function loadGeotiff(url) {
  const imageData = await readRasterFromURL(url)
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  canvas.getContext("2d")
    .putImageData(imageData, 0, 0)

  return canvas
}
