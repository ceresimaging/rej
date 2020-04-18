from ipywidgets import DOMWidget, trait_types, Output
from traitlets import Unicode, Int

from concurrent.futures import ThreadPoolExecutor
import threading, time

from .geotiff_to_png import geotiff_to_png

import sys
import logging
logger = logging.getLogger(__name__)

EXTENSION_VERSION="0.1.0"

class Rej(DOMWidget):
    _view_name = Unicode('RejWidget').tag(sync=True)
    _model_name = Unicode('RejModel').tag(sync=True)
    _view_module = Unicode('ceresimaging-rej').tag(sync=True)
    _model_module = Unicode('ceresimaging-rej').tag(sync=True)

    _view_module_version = Unicode(EXTENSION_VERSION).tag(sync=True)
    _model_module_version = Unicode(EXTENSION_VERSION).tag(sync=True)

    imageryPath = Unicode().tag(sync=True)
    referencePath = Unicode().tag(sync=True)
    referencePath = Unicode().tag(sync=True)

    ptsFile = Unicode().tag(sync=True)

    # Disabled for now, enable this if we want to pass direct memory access rather than via URL
    #imagery = trait_types.CByteMemoryView(help="The media data as a memory view of bytes.").tag(sync=True)
    #reference = trait_types.CByteMemoryView(help="The media data as a memory view of bytes.").tag(sync=True)

    def __init__(self, img, reference_img, *args, **kwargs):
        super(Rej, self).__init__(*args, **kwargs)

        self.on_msg(self.save_pts)
        print("I'm Handeling this!")
        #import /ipdb; ipdb.set_trace()
        def convert_and_save(save_to_attr, path):
            try:
                setattr(self, save_to_attr, geotiff_to_png(path)[0])
            except:
                logger.exception()

        # TODO: use self.imagery and self.reference to pass this entirely
        # in memory, saving the slowness of writing out to S3!
        t1 = threading.Thread(target=convert_and_save, args=('imageryPath', img))
        t2 = threading.Thread(target=convert_and_save, args=('referencePath', reference_img))
        t1.start()
        t2.start()
        def observer(change):
            logger.info("Change is: ", change)
            with open('/tmp/gcps_observer.pts', 'w') as f:
                f.write(change['new'])
            import ipdb; ipdb.set_trace()
        self.observe(observer, 'ptsFile')

    def save_pts(self, widget, content, buffers):
        print("save_pts()", file=sys.stderr)
        with open('/tmp/savepts.pro.log', 'w') as f:
            f.write("YOYO\n")
            f.write(str(widget))
            f.write(str(content))
        if 'ptsFile' in content:
            with open('/tmp/gcps_savepts.pro.pts', 'w') as f:
                f.write(content['ptsFile'])
                print("Saved PTS!", file=sys.stderr)
            from IPython.display import display, HTML
            out = Output()
            display(out)
            out.append_display_data(HTML("<em>All done!</em>"))
            out.append_display_data(HTML(f"<pre>{ptsFile}</pre>"))

def rej(img, reference_img):
    return Rej(img, reference_img)

register = rej