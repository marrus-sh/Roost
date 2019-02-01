{ expect } = require "chai"
{ ℹ, Nº } = require "../Build/Roost.js"

describe "Identity", ->

  it "has the correct API ID", ->
    expect ℹ
      .equals "https://go.KIBI.family/Roost/"

  it "has the correct version", ->
    packageVersion = process.env.npm_package_version
    [ major, minor, patch ] = packageVersion.split "."
    expect Nº, "major"
      .has.ownProperty "major"
      .which.equals +major
    expect Nº, "minor"
      .has.ownProperty "minor"
      .which.equals +minor
    expect Nº, "patch"
      .has.ownProperty "patch"
      .which.equals +patch
    expect "#{Nº}", "string"
      .equals packageVersion
    expect +Nº, "value"
      .equals +major * 100 + +minor + +patch / 100
