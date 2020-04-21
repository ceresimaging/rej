try:
    from importlib import metadata
except ImportError:
    # Running on pre-3.8 Python; use importlib-metadata package
    import importlib_metadata as metadata

version = metadata.version('rej')

# e.g. version 1.0.5 => ~1.0
extension_version = "~" + '.'.join(version.split('.')[:-1])