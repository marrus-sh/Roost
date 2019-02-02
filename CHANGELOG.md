#  CHANGELOG  #

##  Version 0  ##

###  0.3 Release:

Filenames may now contain quotes and special characters without issue.
`preamble` and `postamble` configuration options may now be arrays.

####  Patch 1.

Added identity information, and tests to ensure that it is current.

####  Patch 2.

Removed the extra preamble added during the minify step.
See UglifyJS docs to see how to ensure comments are not removed during
  minification.

An error (incorrect ID) in the identity tests was corrected.

####  Patch 3.

UglifyJS now always uses `--comments some` even when `.babelrc` would
  imply otherwise.

###  0.2 Release:

Added `setup` and `polish` hooks, and the `postamble` property.

###  0.1 Release:

Initial release.

####  Patch 1.

`prefix` and `suffix` may now be set to the empty string.
