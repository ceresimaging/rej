# Interactive Image Registration for JupyterLab

Rej can be used to achieve [registration](https://en.wikipedia.org/wiki/Image_registration)
between two images, probably GeoTIFFs, but any format [rasterio](https://rasterio.readthedocs.io/)
can read should work fine.

![Rej in action for georeferencing](https://user-images.githubusercontent.com/223277/78885250-f6a34680-79f7-11ea-881c-0750549ff3c5.png)

Registration is achieved by selecting reference ("ground control") points on both
images. A `.PTS` file is output containing pixel coordinates of corresponding points.
Eventually, a new GeoTIFF can be output, we're working on it 🤙🏽.

## Installing Rej

You'll need both the JupyterLab widget, as well as the python library:

```
jupyter labextension install @ceresimaging/rej
pip install rej
```

## Using Rej

```
import rej
rej.register('./file1.tiff', './file2.tiff')
```

This should bring up the interactive UI shown above inside your jupyter notebook. Clicking "Save" will output a PTS file, which may be applied to the images to transform them. Enjoy!

## Effective Rej Development

Most of Rej is written in Javascript/VueJS, which is then accessed through a thin python library.
Development will mostly take place inside the context of JupyterLab, so its nice to set things
up so every time you save a file, the JupyterLab extension is updated:

1. `pip install -r requirements.txt && pip install -e . && jupyter nbextension enable --py widgetsnbextension && jupyter labextension install --no-build @jupyter-widgets/jupyterlab-manager && npm install`
2. In one terminal: `npm run watch`
3. In another terminal: `npm run jupyterlab`

### Run outside JupyterLab for faster dev iteration

If you're working on a feature/bug that doesn't require jupyterlab, you
may prefer to develop inside Vue CLI's hot-reloading app mode. To do this:

1. `npm run serve`