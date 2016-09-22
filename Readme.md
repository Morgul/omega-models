-----

**Depricated:** This project has been depricated in favor of: [TrivialModels](https://github.com/trivialsoftware/TrivialModels.)

-----

# Omega Models

An elegant ORM solution for node.js. Intended to be used with the omega web framework, but **not required**. Supports
mulitple backends for storage, including [mongoDB](http://www.mongodb.org/), [nedb](https://github.com/louischatriot/nedb),
[riak](http://basho.com/riak/), [redis](http://redis.io/), as well as [SQLite](http://www.sqlite.org/) and
[PostgreSQL](http://www.postgresql.org/). (It even includes a mock backend for unit tests.)

These backends are provided by separate projects (except for `nedb`, which is included.)

## Status

[![Build Status](https://travis-ci.org/Morgul/omega-models.png)](https://travis-ci.org/Morgul/omega-models])

I would consider this library 'beta' quality. I'm quickly reaching the first 'stable' version, and it's been getting some real-world testing through my various other projects. Anything you build off of it should work just fine.

### Missing Features

These are the big ticket items still missing:

* Backend Migration - The ability to migrate data from one backend to another.
* Initial Data - The ability to import data when the Backend is empty.
* `AutoInc` field - This is going to be backend dependant, but it requires some API work to make sure backends can handle it.

## Backends

Currently, the only backends that exist are those built into Omega Models itself:
* `nedb` - A lightweight, node.js in-memory or file backed database that implements a subset of MongoDB's api. Highly recommended.
* `simple` - A very lightweight, robust JSON store. It has options for being memory-only and gzip support.
* `mock` - A mocked backend, used for unit tests.

See [here](https://github.com/Morgul/omega-models/blob/master/omega-models.js#L80) for how they're exposed.

## Fields

_Note_: Field names starting with `$` are **not supported**. While they will work in the most part, internally we use
variables with those names on the instances. If you overwrite them, everything will explode horribly.

All fields have the following options available:

* `key` - Makes a field as the primary key for this model.
* `default` - Sets the default value for this field.
* `required` - This field is required to be not null/undefined in order to save the model.
* `validators` - A list of functions of the form `function(fieldValue)` that must return true, or an Error object.

### Field Types

* `fields.Any()` - A field that represents any JSON-able value. No checking is done on this field.
* `fields.AutoID()` - A field that represents an automatically assigned id. (This is dependant on the backend.)
* `fields.AutoInc()` - An `Integer` field that automatically increments, based on a starting value.
    * `start` - (Optional) The starting value for ids. Defaults to 1.
* `fields.Binary()` - A field to store raw binary data.
* `fields.Boolean()` - A field to store boolean values
* `fields.String()` - A field to store text as a string. A maximum limit is not required, but if one is specified, SQL backends will store this in a smaller, more efficient data type.
    * `max_length` - (Optional) The maximum number of chars that can be stored in this field. (If not specified, SQL backends should default to a Text field, or whatever the unlimited text storage type is.)
* `fields.Choice()` - A field that limits possible inputs to a specified list of possible values.
    * `choices` - A list of valid choices.
    * `type` - (Optional) a field type instance, defining the underlying field the choice is stored as. Defaults to `Char`.
* `fields.Date()` - A field to store dates. (This is the same as DateTimeField, but the time component is always set to 0:00:00.)
    * `auto` - Automatically update every time the modle is saved. (Useful for 'last modified' fields)
    * `first` - Set when the model is first created, then never again.
* `fields.DateTime()` - A field to store date and time.
    * `auto` - Automatically update every time the modle is saved. (Useful for 'last modified' fields)
    * `first` - Set when the model is first created, then never again.
* `fields.Dict()` - A field that represents a key/value store. Keys are assumed to be strings, and values are assumed to be `fields.Any()`.
* `fields.File()` - A field that returns a file from the filesystem, however, is stored as a `Char` field path in the database.
    * `basePath` - (Optional) The path under which to store files. Defaults to the field name.
* `fields.Float()` - A field to store floating point numbers.
    * `min` - (Optional) The minimum possible value to be stored.
    * `max` - (Optional) The minimum possible value to be stored.
* `fields.Integer()` - A field to store integer numbers.
    * `min` - (Optional) The minimum possible value to be stored.
    * `max` - (Optional) The minimum possible value to be stored.
* `fields.List()` - A field to store a list of items of one of the other field types. (How this is achieved depends on the backend.)
    * `type` - (Optional) A field type instance, representing the types that will be stored in this list. (Assumed to be `fields.Any` by default.)
* `fields.Reference()` - A field that refers to another instance of a model.
    * `model` - A string that is the name of a defined model. This reference will only accept instances of that model.
    * `filter` - (Optional) An object, or function that filters the choices for this field to a subset of instances of the Model defined by `model`.

## Tests

If you want to run the tests, just run:

```bash
$ npm test
```
