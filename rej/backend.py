from ipywidgets import DOMWidget, trait_types, Output, VBox, Textarea
from traitlets import Unicode, Int

from concurrent.futures import ThreadPoolExecutor
import threading, time

from .geotiff_to_png import geotiff_to_png

import sys
import logging
logger = logging.getLogger(__name__)

from .version import extension_version

class Rej(DOMWidget):
    _view_name = Unicode('RejWidget').tag(sync=True)
    _model_name = Unicode('RejModel').tag(sync=True)
    _view_module = Unicode('@ceresimaging/rej').tag(sync=True)
    _model_module = Unicode('@ceresimaging/rej').tag(sync=True)

    _view_module_version = Unicode(extension_version).tag(sync=True)
    _model_module_version = Unicode(extension_version).tag(sync=True)

    imageryPath = Unicode().tag(sync=True)
    referencePath = Unicode().tag(sync=True)
    imageryTiffPath = Unicode().tag(sync=True)
    referenceTiffPath = Unicode().tag(sync=True)  

    ptsFile = Unicode().tag(sync=True)

    # Disabled for now, enable this if we want to pass direct memory access rather than via URL
    #imagery = trait_types.CByteMemoryView(help="The media data as a memory view of bytes.").tag(sync=True)
    #reference = trait_types.CByteMemoryView(help="The media data as a memory view of bytes.").tag(sync=True)

    def __init__(self, img_path, reference_img_path, save_pts_callback=None, *args, **kwargs):
        super(Rej, self).__init__(*args, **kwargs)

        self.save_pts_callback = save_pts_callback
        self.on_msg(self.save_pts)

        #import /ipdb; ipdb.set_trace()
        def convert_and_save(save_to_attr, path):
            try:
                png_path = geotiff_to_png(path)[0]
                setattr(self, save_to_attr, png_path)
            except:
                logger.exception("Uhoh, we encountered a problem converting {path} into a png for Rej")

        self.imageryTiffPath = img_path
        self.referenceTiffPath = reference_img_path

        # TODO: use self.imagery and self.reference to pass this entirely
        # in memory, saving the slowness of writing out to S3!
        t1 = threading.Thread(target=convert_and_save, args=('imageryPath', img_path))
        t2 = threading.Thread(target=convert_and_save, args=('referencePath', reference_img_path))
        t1.start()
        t2.start()

    def save_pts(self, widget, content, buffers):
        if 'ptsFile' in content:
            ptsFile = content['ptsFile']
            
            if self.save_pts_callback:
                self.save_pts_callback(ptsFile)

            with open('/tmp/gcps_savepts.pro.pts', 'w') as f:
                f.write(ptsFile)
                print("Saved PTS!", file=sys.stderr)



def rej(img_path, reference_img_path, pts_callback=None):
    def _cb(pts):
        if pts_callback:
            pts_callback(pts, rej, box)
        else:
            out = Output()
            box.children = tuple(list(box.children) + [out])
            out.append_stdout(pts)

    rej = Rej(img_path, reference_img_path, _cb)
    box = VBox([ rej ])
    return box

register = rej