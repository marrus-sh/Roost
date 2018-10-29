"use strict";

(function () {
  var build, clear, collect, compile, configure, destination, exec, fs, literate, minify, name, order, preamble, prefix, stitch, suffix, watch;
  fs = require('fs');

  var _require = require('child_process');

  exec = _require.exec;
  destination = "dist/";
  literate = false;
  name = "index";
  order = [];
  preamble = null;
  prefix = "src/";
  suffix = ".coffee";

  exports.configure = configure = function configure() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (options == null) {
      return;
    }

    if (options.destination != null) {
      destination = "".concat(options.destination);
    }

    if (options.literate != null) {
      literate = !!options.literate;
    }

    if (options.name) {
      name = "".concat(options.name);
    }

    if (options.order) {
      order = [].concat(options.order);
    }

    if (options.preamble !== void 0) {
      preamble = options.preamble != null ? "".concat(options.preamble) : null;
    }

    if (options.prefix) {
      prefix = "".concat(options.prefix);
    }

    if (options.suffix) {
      return suffix = "".concat(options.suffix);
    }
  };

  collect = function collect() {
    return function (callback) {
      var contents, file, i, index, len, remaining;
      console.log("Collecting source files…");
      contents = new Array(remaining = order.length);

      for (index = i = 0, len = order.length; i < len; index = ++i) {
        file = order[index];

        (function (file, index) {
          return fs.readFile("".concat(prefix).concat(file).concat(suffix), "utf8", function (error, result) {
            if (error) {
              throw error;
            }

            contents[index] = result;

            if (! --remaining) {
              return callback(contents);
            }
          });
        })(file, index);
      }
    };
  };

  stitch = function stitch(collector) {
    return function (callback) {
      return collector(function (contents) {
        var stitched;
        console.log("Stitching…");
        stitched = contents.join(literate ? "\n".concat(Array(72).join("_"), "\n\n") : "\n#  ".concat(Array(66).join("_"), "  #\n\n"));
        fs.mkdir(destination, function (error) {
          var output;

          if (error && error.code !== 'EEXIST') {
            throw error;
          }

          output = "".concat(destination).concat(name, ".").concat(literate && "lit" || "", "coffee");
          return fs.writeFile(output, stitched, "utf-8", function (error) {
            if (error) {
              throw error;
            }

            return callback(output);
          });
        });
      });
    };
  };

  compile = function compile(stitcher) {
    return function (callback) {
      return stitcher(function (stitched) {
        var compiled;
        console.log("Compiling…");
        compiled = stitched.replace(/\.(?:lit)?coffee$/i, ".js");
        exec(preamble != null ? "./node_modules/.bin/coffee -cpt ".concat(stitched, " | cat ").concat(preamble, " - > ").concat(compiled) : "coffee -cpt ".concat(stitched, " > ").concat(compiled), function (error, stdout, stderr) {
          if (error) {
            throw error;
          }

          if (stdout || stderr) {
            console.log((stdout || "") + (stderr || ""));
            return;
          }

          return callback(compiled);
        });
      });
    };
  };

  minify = function minify(compiler) {
    return compiler(function (compiled) {
      var minified;
      console.log("Minifying…");
      minified = compiled.replace(/\.js$/, ".min.js");
      exec(preamble != null ? "./node_modules/.bin/uglifyjs ".concat(compiled, " -c | cat ").concat(preamble, " - > ").concat(minified) : "./node_modules/.bin/uglifyjs ".concat(compiled, " -c > ").concat(minified), function (error, stdout, stderr) {
        if (error) {
          throw error;
        }

        if (stdout || stderr) {
          console.log((stdout || "") + (stderr || ""));
          return;
        }

        return console.log("…Done.");
      });
    });
  };

  exports.build = build = function build() {
    return minify(compile(stitch(collect())));
  };

  exports.watch = watch = function watch() {
    var file, i, len, results;
    build();
    results = [];

    for (i = 0, len = order.length; i < len; i++) {
      file = order[i];
      results.push(function (file) {
        return fs.watch("".concat(prefix).concat(file).concat(suffix), "utf8", function (type) {
          if (type !== "change") {
            return;
          }

          console.log("File `".concat(file, "` changed, rebuilding..."));
          return build();
        });
      }(file));
    }

    return results;
  };

  exports.clear = clear = function clear() {
    var base;
    base = "".concat(destination).concat(name);
    fs.unlink("".concat(base, ".").concat(literate && "lit" || "", "coffee"), function () {});
    fs.unlink("".concat(base, ".js"), function () {});
    return fs.unlink("".concat(base, ".min.js"), function () {});
  };
}).call(void 0);
