# Omega Models

An elegant ORM solution for node.js. Intended to be used with the omega web framework, but not required.

## Status

Currently, this is only just being built. It isn't complete, but the implemented parts have unit tests.
I expect in a short while I should have an initial implementation.

If you want to see what using it will look like, check out 'sample.js' in the root of the project.

## Fields

_Note_: Field names starting with `$` are not supported. While they will work in the most part, internally we use
variables with those names on the instances. If you overwrite them, everything will explode horribly.

All fields have the following options available:

* `key` - Makes a field as the primary key for this model.
* `default` - Sets the default value for this field.
* `required` - This field is required to be not null/undefined in order to save the model.
* `validators` - A list of functions of the form `function(fieldValue)` that must return true, or an error string.

### Field Types

* `fields.Auto()` - An `Integer` field that automatically increments according to available IDs.
    * `start` - (Optional) The starting value for ids. Defaults to 1.
* `fields.Binary()` - A field to store raw binary data.
* `fields.Boolean()` - A field to store boolean values
* `fields.Char()` - A field to store a limited number of characters. (A maximum limit is not required, but many databases will impose one.)
    * `max_length` - (Optional) The maximum number of chars that can be stored in this field. (If not specified, SQL backends should default to the maximum length for a char field.)
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
* `fields.Text()` - A field that can store an unlimited amount of text.

## Tests

If you want to run the tests, please just run:

```bash
$ npm test
```