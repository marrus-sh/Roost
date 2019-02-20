"use strict";

(function () {
  var build, clear, collect, compile, configure, destination, exec, fs, literate, minify, minifyConfig, name, order, polish, postamble, preamble, prefix, quote, setup, stitch, suffix, watch, watching;
  fs = require('fs');

  var _require = require('child_process');

  exec = _require.exec;

  quote = function quote(string) {
    return "'".concat(String.prototype.replace.call(string, /'/g, "'\\''"), "'");
  };

  destination = "dist/";
  literate = false;
  minifyConfig = null;
  name = "index";
  order = [];
  polish = null;
  postamble = null;
  preamble = null;
  prefix = "src/";
  setup = null;
  suffix = ".coffee";
  watching = [];

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

    minifyConfig = options.minify != null ? options.minify !== false ? "".concat(options.minify) : false : null;

    if (options.name) {
      name = "".concat(options.name);
    }

    if (options.order) {
      order = [].concat(options.order);
    }

    if (options.polish === null || typeof options.polish === "function") {
      polish = options.polish;
    }

    if (options.postamble !== void 0) {
      postamble = options.postamble != null ? [].concat(options.postamble).map(quote).join(" ") : null;
    }

    if (options.preamble !== void 0) {
      preamble = options.preamble != null ? [].concat(options.preamble).map(quote).join(" ") : null;
    }

    if (options.prefix != null) {
      prefix = "".concat(options.prefix);
    }

    if (options.setup === null || typeof options.setup === "function") {
      setup = options.setup;
    }

    if (options.suffix != null) {
      suffix = "".concat(options.suffix);
    }

    if (options.watching) {
      return watching = [].concat(options.watching);
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
        exec(function () {
          switch (false) {
            case !(preamble != null && postamble != null):
              return "./node_modules/.bin/coffee -cpt ".concat(quote(stitched), " | cat ").concat(preamble, " - ").concat(postamble, " > ").concat(quote(compiled));

            case preamble == null:
              return "./node_modules/.bin/coffee -cpt ".concat(quote(stitched), " | cat ").concat(preamble, " - > ").concat(quote(compiled));

            case postamble == null:
              return "./node_modules/.bin/coffee -cpt ".concat(quote(stitched), " | cat - ").concat(postamble, " > ").concat(quote(compiled));

            default:
              return "./node_modules/.bin/coffee -cpt ".concat(quote(stitched), " > ").concat(quote(compiled));
          }
        }(), function (error, stdout, stderr) {
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

      if (minifyConfig === false) {
        console.log("…Done.");
        return;
      }

      console.log("Minifying…");
      minified = compiled.replace(/\.js$/, ".min.js");
      exec(minifyConfig != null ? "./node_modules/.bin/uglifyjs ".concat(quote(compiled), " --config-file ").concat(quote(minifyConfig), " > ").concat(quote(minified)) : "./node_modules/.bin/uglifyjs ".concat(quote(compiled), " -c --comments some > ").concat(quote(minified)), function (error, stdout, stderr) {
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
    if (setup != null) {
      setup();
    }

    minify(compile(stitch(collect())));

    if (polish != null) {
      return polish();
    }
  };

  exports.watch = watch = function watch() {
    var file, i, j, len, len1, results, watcher;
    build();

    watcher = function watcher(name) {
      return function (type) {
        if (type !== "change") {
          return;
        }

        console.log("File `".concat(name, "` changed, rebuilding..."));
        return build();
      };
    };

    for (i = 0, len = order.length; i < len; i++) {
      file = order[i];

      (function (file) {
        return fs.watch("".concat(prefix).concat(file).concat(suffix), "utf8", watcher(file));
      })(file);
    }

    results = [];

    for (j = 0, len1 = watching.length; j < len1; j++) {
      file = watching[j];
      results.push(function (file) {
        return fs.watch(file, "utf8", watcher(file));
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

  exports.ℹ = "https://go.KIBI.family/Roost/";
  exports.Nº = Object.freeze({
    major: 0,
    minor: 5,
    patch: 0,
    toString: function toString() {
      return "".concat(this.major, ".").concat(this.minor, ".").concat(this.patch);
    },
    valueOf: function valueOf() {
      return this.major * 100 + this.minor + this.patch / 100;
    }
  });
}).call(void 0);
