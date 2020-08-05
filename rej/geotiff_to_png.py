import json
from pathlib import PosixPath
import numpy as np
import warnings
import logging

import rasterio
import cv2

import skimage
import skimage.exposure

logger = logging.getLogger(__name__)

def write_geotiff_metadata_to(path, src):
    # Not valid on all rasterio versions?
    assert src.crs.to_epsg() == 4326, "Only EPSG4326 GeoTiffs are supported at this time"
    
    to_latlng = lambda lnglat: list(reversed(lnglat))

    with open(path, 'w') as f:
        json.dump({
            'bounds': [ 
                to_latlng(src.xy(0, 0)), 
                to_latlng(src.xy(*src.shape)) 
            ],
            'crs': 'EPSG4326'
        }, f)

def colorize_grayscale(im, nodata=0, min_val=None, max_val=None,
                       min_range=None, max_range=None, min_percentile=0.5,
                       max_percentile=99.5, colormap_name="gray", mask=None):
    """
    Takes a single band (grayscale) image, and generates an RGB output
    viewable in a standard image viewer. Default is to have grayscale colors,
    but can also specify matplotlib colors.

    Parameters
    ----------
    im : 2darray

    nodata : int (opt)
        Image value that represents no data.
    min_val : int (opt)
        Value that will represent black in the colorized image. Default to
        None, in which case it is determined by min_percentile.
    max_val : int (opt)
        Value that will represent white in the colorized image. Default to
        None, in which case it is determined by max_percentile.
    min_percentile : float (opt)
        Percentile value from which min_val is set. If min_val is set, it
        overrides min_percentile.
    max_percentile : float (opt)
        Percentile value from which max_val is set. If min_val is set, it
        overrides max_percentile.
    colormap_name : str or Colormap (opt)
        Colormap, or Name of matplotlib colormap to use. If not set, will use
        grayscale. See
        https://matplotlib.org/users/colormaps.html for a list of
        available pre-defined colormaps.

    Returns
    -------
    out_im : 3darray
        RGB array that renders a grayscale version of the input when saved.
    """

    # this import is here to avoid issues in visual backend in a console
    import matplotlib as mpl
    import matplotlib.pyplot as plt

    percentile_range = (min_percentile, 50, max_percentile)
    if mask is not None:
        exclude = np.logical_and(im == nodata, mask)
    else:
        exclude = im == nodata
    values = im[~exclude]
    min_valp, p50, max_valp = np.percentile(values, percentile_range)

    # take min/max vals if set, otherwise use values from percentiles
    value_range = (min_val or min_valp, max_val or max_valp)
    # if min_range is set, for range of values less than min_range,
    # expand the range; if max_range is set, contract the range, if necessary
    range_diff = value_range[1] - value_range[0]
    min_range = min_range or range_diff
    max_range = max_range or range_diff
    # don't do both min/max changes; giving precedence to max_range setting
    if range_diff > max_range:
        value_range = (p50 - max_range / 2, p50 + max_range / 2)
    elif range_diff < min_range:
        value_range = (p50 - min_range / 2, p50 + min_range / 2)

    # explicitly convert all to 32 bit float to avoid floating point
    # issues in the process of rescaling to range 0 to 1 for later colormap
    # conversation
    rescaled = skimage.exposure.rescale_intensity(
            im.astype("float32"), in_range=value_range, out_range=(0, 1))

    if isinstance(colormap_name, mpl.colors.Colormap):
        colormap = colormap_name
    else:
        colormap = plt.get_cmap(colormap_name)
    # colormap returns floating point RGBA image
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        color_image = skimage.img_as_ubyte(colormap(rescaled))
    # drop third channel of second axis (i.e., alpha channel)
    color_image = np.delete(color_image, 3, 2)

    # to avoid transparency, set all 0 values to 1
    color_image[color_image == 0] = 1
    # then, want nodata = [0, 0, 0] (our color nodata) for all colormaps
    color_image[im == nodata] = [0, 0, 0]

    return np.moveaxis(color_image, 2, 0)

def fix_photoscan_nodata(src):
    # Ox outputs GeoTiffs where nodata=0, but Photoscan defaults to nodata=MAX
    # see https://github.com/ceresimaging/ra/issues/518
    src[src == np.iinfo(src.dtype).max] = 0
    return src

def write_png(src, png_filename, remap_photoscan_nodata=True):
    # TODO: this whole thing should be reworked with a more generic and
    # non-ceres-specific procedure
    if src.count >= 3:
        im = src.read([1,2,3])
        if remap_photoscan_nodata:
            im = fix_photoscan_nodata(im)
    else:
        im = colorize_grayscale(
            fix_photoscan_nodata(
                src.read(1)
            )
        )

    # We are using CV2 to write because it is MUCH faster
    # For a 100MB GeoTIFF on Seth's MBP rasterio/gdal/libpng was taking 3s
    # to write with zlevel=1 (lowest compress gdal driver allowed), 
    # and 6s with the default (zlevel=6)
    # whereas CV2 snippet below wass taking 1.25s
    cv2.imwrite(
        png_filename,
        # CV2 only likes BGRA, Rasterio has (probably) loaded this as RGBA
        cv2.cvtColor(
            # Rasterio defaults to axis 0 being channels
            # but most python programs assume X,Y,CHAN order
            np.moveaxis(im, 0, -1), 
            cv2.COLOR_RGBA2BGRA
        )
    )
        
    with rasterio.open(
        png_filename, 'w', 
        driver='PNG', 
        width=im.shape[2], 
        height=im.shape[1],
        dtype=im.dtype,
        count=3,
        nodata=0,
        zlevel=1, # fastest compression possible
    ) as dst:
        dst.write(im)

    json_filename = png_filename + ".json"
    write_geotiff_metadata_to(json_filename, src)

    return [png_filename, json_filename]

def geotiff_to_png(geotiff_path):
    p = PosixPath(geotiff_path)
    png_dir = PosixPath("sys/tmp/png") / p.parent
    png_dir.mkdir(parents=True, exist_ok=True)
    png_filename = str(png_dir / p.name) + ".png"

    logger.debug(f"Converting GeoTIFF '{geotiff_path}' to PNG '{png_filename}")

    # TODO: this probaly surpresses too much, we really just want to surpress rasterio's warning:
    # rasterio/__init__.py:229: NotGeoreferencedWarning: Dataset has no geotransform set. The identity matrix may be returned.
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with rasterio.open(geotiff_path, 'r') as geotiff:
            write_png(geotiff, png_filename)
    logger.debug(f"Conversion complete")
    
    return [png_filename, png_filename + ".json"]