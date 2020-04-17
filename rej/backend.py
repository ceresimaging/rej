from ipywidgets import DOMWidget, trait_types, Output
from traitlets import Unicode, Int
from concurrent.futures import ThreadPoolExecutor
import threading, time

from .geotiff_to_png import geotiff_to_png

import logging
logger = logging.getLogger(__name__)

EXTENSION_VERSION="0.1.0"

class Rej(DOMWidget):
    _view_name = Unicode('RejDOMWidget').tag(sync=True)
    _model_name = Unicode('RejModel').tag(sync=True)
    _view_module = Unicode('ceresimaging-rej').tag(sync=True)
    _model_module = Unicode('ceresimaging-rej').tag(sync=True)

    _view_module_version = Unicode(EXTENSION_VERSION).tag(sync=True)
    _model_module_version = Unicode(EXTENSION_VERSION).tag(sync=True)

    imageryPath = Unicode().tag(sync=True)
    referencePath = Unicode().tag(sync=True)

    # Disabled for now, enable this if we want to pass direct memory access rather than via URL
    #imagery = trait_types.CByteMemoryView(help="The media data as a memory view of bytes.").tag(sync=True)
    #reference = trait_types.CByteMemoryView(help="The media data as a memory view of bytes.").tag(sync=True)

    def __init__(self, img, reference_img, *args, **kwargs):
        super(Rej, self).__init__(*args, **kwargs)

        def convert_and_save(save_to_attr, path):
            try:
                setattr(self, save_to_attr, geotiff_to_png(path)[0])
            except:
                logger.exception()
                print("YOOOO ADDDDD BBADDDD")

        # TODO: use self.imagery and self.reference to pass this entirely
        # in memory, saving the slowness of writing out to S3!
        t1 = threading.Thread(target=convert_and_save, args=('imageryPath', img))
        t2 = threading.Thread(target=convert_and_save, args=('referencePath', reference_img))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

def rej(img, reference_img):
    return Rej(img, reference_img)

register = rej