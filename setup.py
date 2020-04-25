import pathlib, json
from setuptools import setup, find_packages

DOT = pathlib.Path(__file__).parent
package_json = json.loads((DOT / "package.json").read_text())

setup(
    name="rej",
    version=package_json['version'],
    description="Interactive image registration tool for JupyterLab",
    long_description="long description is long",
    long_description_content_type="text/markdown",
    url="https://github.com/ceresimaging/rej",
    author="Seth Nickell",
    author_email="snickell@gmail.com",
    license="MIT",
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
    ],
    packages=find_packages(),

    include_package_data=True,
    install_requires=[
      "ipywidgets",
      "traitlets",
      "rasterio",
      'importlib-metadata ~= 1.0 ; python_version < "3.8"',
    ],
)
