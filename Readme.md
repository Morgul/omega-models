# Omega Models

An elegant ORM solution for node.js. Intended to be used with the omega web framework, but **not required**. Supports
mulitple backends for storage, including [mongoDB](http://www.mongodb.org/), [nedb](https://github.com/louischatriot/nedb),
[riak](http://basho.com/riak/), [redis](http://redis.io/), as well as [SQLite](http://www.sqlite.org/) and
[PostgreSQL](http://www.postgresql.org/). (It even includes a mock backend for unit tests.)

These backends are provided by separate projects (except for `nedb`, which is included.)

## Status

[![Build Status](https://travis-ci.org/Morgul/omega-models.png)](https://travis-ci.org/Morgul/omega-models])

I would consider this library 'alpha' quality. I still don't have all of the features I would like, but most of the
required ones are there. You _can_ use it, and with the built-in `nedb` backend, it will work as expected. I'm lacking
a lot of documentation, and while a lot of the system is unit tested, it needs some real-world testing. If you're feeling
adventurous, go for it. Otherwise, hold off until it's got a few more versions under it's belt.

### Missing Features

These are the big ticket items still missing:

* `AutoID` field - Backends will need to implement this, where possible. What do we do when a backend doesn't support this?
* `AutoInc` field - Backend dependant.

## Backends

Currently, the only backends that exist are the two built into Omega Models itself. Those are:
* `nedb` - A lightweight, node.js in-memory or file backed database that implements a subset of MongoDB's api. Highly recommended.
* `mock` - A mocked backend, used for unit tests.

See [here](https://github.com/Morgul/omega-models/blob/master/omega-models.js#L80) for how they're exposed.

## Fields

_Note_: Field names starting with `$` are not supported. While they will work in the most part, internally we use
variables with those names on the instances. If you overwrite them, everything will explode horribly.

All fields have the following options available:

* `key` - Makes a field as the primary key for this model.
* `default` - Sets the default value for this field.
* `required` - This field is required to be not null/undefined in order to save the model.
* `validators` - A list of functions of the form `function(fieldValue)` that must return true, or an Error object.

### Field Types

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
* `fields.Date()` - A field to store dates.
* `fields.DateTime()` - A field to store date and time.
* `fields.File()` - A field that returns a file from the filesystem, however, is stored as a `Char` field path in the database.
    * `basePath` - (Optional) The path under which to store files. Defaults to the field name.
* `fields.Float()` - A field to store floating point numbers.
    * `min` - (Optional) The minimum possible value to be stored.
    * `max` - (Optional) The minimum possible value to be stored.
* `fields.Integer()` - A field to store integer numbers.
    * `min` - (Optional) The minimum possible value to be stored.
    * `max` - (Optional) The minimum possible value to be stored.
* `fields.List()` - A field to store a list of items of one of the other field types. (How this is achieved depends on the backend.)
    * `type` - A field type instance, representing the types that will be stored in this list.
* `fields.Reference()` - A field that refers to another instance of a model.
    * `model` - A string that is the name of a defined model. This reference will only accept instances of that model.
    * `filter` - (Optional) An object, or function that filters the choices for this field to a subset of instances of the Model defined by `model`.

## Tests

If you want to run the tests, please just run:

```bash
$ npm test
```