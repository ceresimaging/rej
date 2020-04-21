import json

try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources

from . import _version

_package_path = pkg_resources.files(_version).joinpath('../../package.json')
package = json.loads(_package_path.read_text())
version = package['version']
extension_version = "~" + version