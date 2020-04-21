import json

import importlib_resources as pkg_resources

from . import _version

_package_path = pkg_resources.files(_version).joinpath('../../package.json')
package = json.loads(_package_path.read_text())
version = package['version']
extension_version = "~" + version