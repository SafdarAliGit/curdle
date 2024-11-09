from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in curdle/__init__.py
from curdle import __version__ as version

setup(
	name="curdle",
	version=version,
	description="Curdle",
	author="safdar211@gmail.com",
	author_email="safdar211@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
