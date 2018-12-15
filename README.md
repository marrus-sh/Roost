<header>
  <div align="right">
    <b><cite>Roost</cite></b><br />
    Source and Documentation<br />
    <code>README.md</code>
  </div>
  <hr />
  <div align="justify">
    <small>
      Copyright © 2018 Kyebego.
      Code released under GNU GPLv3 (or any later version);
        documentation released under CC BY-SA 4.0.
      For more information, see the license notice at the bottom of
        this document.
    </small>
  </div>
</header>

#  Roost  #

Roost is a library for easily building files using the CoffeeScript
  build system, Cake.
The following is a sample `Cakefile` which makes use of this system:

>   ```coffee
>   { build , clear , configure , watch } = require 'Roost'
>   configure
>     destination: "Build/"  #  Default: "dist/"
>     literate: yes  #  Default: no
>     name: "MyApp"  #  Default: "index"
>     order: [  #  The build order; all files must be listed here
>       "file1"
>       "file2"
>     ]
>     polish: null  #  Called after builds
>     postamble: "data.js"  #  Default: null; may be string or array
>     preamble: "NOTICE.js"  #  Default: null; may be string or array
>     prefix: "Sources/"  #  Default: "src/"
>     setup: null  #  Called before builds
>     suffix: ".litcoffee"  #  Default: ".coffee"
>
>   task "build", "build MyApp", build
>   task "watch", "build MyApp and watch for changes", watch
>   task "clear", "delete built files", clear
>   ```

The above configuration will create the following files on
  `cake build`:

+ `Build/MyApp.litcoffee`
+ `Build/MyApp.js`
+ `Build/MyApp.min.js`

Roost uses Babel for transpiling and UglifyJS for minification.
It is recommended that you set up your `.babelrc` to match
  [the one in this repository](./.babelrc) or things may not work
  properly.

You can add Roost as a `devDependency` for your project using its
  Git URL: `git+https://github.com/marrus-sh/Roost.git`

##  Prerequisites  ##

In order to build a project, Roost needs access to the filesystem, as
  well as the ability to create child processes.
So, Roost requires `fs` and `child_process`:

    fs = require 'fs'
    { exec } = require 'child_process'

##  String Handling  ##

The internal `quote` function quotes and escapes a string for use in
  commands.

    quote = (string) -> "'#{
      String::replace.call string, /'/g, "'\\''"
    }'"

##  Configuration  ##

The following are our default configuration values:

    destination = "dist/"
    literate = no
    name = "index"
    order = []
    polish = null
    postamble = null
    preamble = null
    prefix = "src/"
    setup = null
    suffix = ".coffee"

The exported `configure` function configures the above values based on
  the properties of its argument.

    exports.configure = configure = (options = {}) ->
      return unless options?
      destination = "#{options.destination}" if options.destination?
      literate = !!options.literate if options.literate?
      name = "#{options.name}" if options.name
      order = [].concat options.order if options.order
      polish = options.polish if options.polish is null or (
        typeof options.polish is "function"
      )
      postamble = (  #  Internally, quoted and space-separated
        if options.postamble? then (
          ([].concat options.postamble).map quote
        ).join " " else null
      ) unless options.postamble is undefined
      preamble = (  #  Internally, quoted and space-separated
        if options.preamble? then (
          ([].concat options.preamble).map quote
        ).join " " else null
      ) unless options.preamble is undefined
      prefix = "#{options.prefix}" if options.prefix?
      setup = options.setup if options.setup is null or (
        typeof options.setup is "function"
      )
      suffix = "#{options.suffix}" if options.suffix?

##  File loading  ##

The first task is to load the source files.
The `collect()` function reads the files into an array, which will then
  be passed on to later build steps.

    collect = -> (callback) ->
      console.log "Collecting source files…"

The `contents` array will hold the contents of the source files, in
  order, while `remaining` will store the number of files left to
  process.
These can both be set at the same time, since the length of the
  `contents` array will initially equal the number of `remaining`
  files.

      contents = new Array remaining = order.length

Each file is read, in order, and added to the `contents` array.

      for file, index in order
        do (file, index) ->
          fs.readFile "#{prefix}#{file}#{suffix}", "utf8", (
            error, result
          ) ->
            throw error if error
            contents[index] = result

If there are no more `remaining` files, it is time to call the
  `callback` with the `contents` and move on.

            callback contents unless --remaining
      return

##  File stitching  ##

The `stitch()` function joins an array of files together.
The complicated string of function calls and returns at the beginning
  of `stitch()` is just to make it easier to compose with other
  functions later on—this pattern will appear a lot in this file, but
  one needn't pay it much mind.

    stitch = (collector) -> (callback) -> collector (contents) ->
      console.log "Stitching…"

A horizontal rule is placed in-between our files to make them easier to
  debug.

      #  Note that contents should already end in "\n".
      stitched = contents.join (
        if literate
          "\n#{(Array 72).join "_"}\n\n"
        else
          "\n#  #{(Array 66).join "_"}  #\n\n"
      )

Finally, the stitched file is written to disk, for later compilation.
The `destination` folder is created if it doesn't exist.

      fs.mkdir destination, (error) ->
        throw error if error and error.code isnt 'EEXIST'
        output = "
          #{destination}#{name}.#{literate and "lit" or ""}coffee
        "
        fs.writeFile output, stitched, "utf-8", (error) ->
            throw error if error
            callback output
      return

##  Compiling  ##

The `compile()` function compiles the stitched file.
It's pretty simple—it just executes `coffee`, adding the `preamble`
  to the beginning of the file and `postamble` to the ending with
  `cat`.
Note the `-t` flag; Babel is used for transpiling into an
  ECMAScript 5.1–compatible form.

    compile = (stitcher) -> (callback) -> stitcher (stitched) ->
      console.log "Compiling…"
      compiled = stitched.replace /\.(?:lit)?coffee$/i, ".js"
      exec (
        switch
          when preamble? and postamble? then "
            ./node_modules/.bin/coffee -cpt #{quote stitched} |
            cat #{preamble} - #{postamble} > #{quote compiled}
          "
          when preamble? then "
            ./node_modules/.bin/coffee -cpt #{quote stitched} |
            cat #{preamble} - > #{quote compiled}
          "
          when postamble? then "
            ./node_modules/.bin/coffee -cpt #{quote stitched} |
            cat - #{postamble} > #{quote compiled}
          "
          else "
            ./node_modules/.bin/coffee -cpt #{quote stitched} >
            #{quote compiled}
          "
      ), (error, stdout, stderr) ->
        throw error if error
        if stdout or stderr
          console.log (stdout or "") + (stderr or "")
          return
        callback compiled
      return

##  Minifying  ##

Finally, UglifyJS minifies the final output.
The `preamble` is again added to the beginning of the file.
The `minify()` function accomplishes this:

    minify = (compiler) -> compiler (compiled) ->
      console.log "Minifying…"
      minified = compiled.replace /\.js$/, ".min.js"
      exec (
        if preamble? then "
          ./node_modules/.bin/uglifyjs #{quote compiled} -c |
          cat #{preamble} - > #{quote minified}
        " else "
          ./node_modules/.bin/uglifyjs #{quote compiled} -c >
          #{quote minified}
        "
      ), (error, stdout, stderr) ->
        throw error if error
        if stdout or stderr
          console.log (stdout or "") + (stderr or "")
          return
        console.log "…Done."
      return

##  Building  ##

The `build()` function just links all of the above functions together,
  adding our `setup()` and `polish()` hooks:

    exports.build = build = ->
      do setup if setup?
      minify compile stitch do collect
      do polish if polish?

##  Watching  ##

The `watch()` function builds, then watches for changes and
  automatically rebuilds.

    exports.watch = watch = ->
      do build
      for file in order
        do (file) ->
          fs.watch "#{prefix}#{file}#{suffix}", "utf8", (type) ->
            return unless type is "change"
            console.log "File `#{file}` changed, rebuilding..."
            do build

##  Clearing  ##

The `clear()` function clears out the files that we created above:

    exports.clear = clear = ->
      base = "#{destination}#{name}"
      fs.unlink "#{base}.#{literate and "lit" or ""}coffee", ->
      fs.unlink "#{base}.js", ->
      fs.unlink "#{base}.min.js", ->

##  Identity  ##

The exported `ℹ` and `Nº` properties give the API and version number,
  respectively.

    exports.ℹ = "https://go.KIBI.family/Roost/"
    exports.Nº = Object.freeze
      major: 0
      minor: 3
      patch: 1
      toString: -> "#{@major}.#{@minor}.#{@patch}"
      valueOf: -> @major * 100 + @minor + @patch / 100

<footer>
  <details>
  <summary>License notice</summary>
  <p>This program is free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version. Similarly, you can
    redistribute and/or modify the documentation sections of this
    document under the terms of the Creative Commons
    Attribution-ShareAlike 4.0 International License.</p>
  <p>This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
    General Public License for more details.</p>
  <p>You should have received copies of the GNU General Public License
    and the Creative Commons Attribution-ShareAlike 4.0 International
    License along with this source. If not, see
    https://www.gnu.org/licenses/ and
    https://creativecommons.org/licenses/by-sa/4.0/.</p>
  </details>
</footer>
