cs = require 'coffeescript'
fs = require 'fs'

prepAndDo = (task) ->
  fs.readFile "README.md", "utf8", (error, data) ->
    throw error if error
    exports = {}  #  Overrides `exports`
    eval cs.compile data, literate: yes
    exports.configure
      destination: "Build/"
      literate: yes
      name: "Roost"
      order: [ "README" ]
      prefix: "./"
      suffix: ".md"
    do exports[task]

task "build", "build Roost", -> prepAndDo "build"
task "watch", "build Roost and watch for changes", -> prepAndDo "watch"
task "clear", "remove built files", -> prepAndDo "clear"
