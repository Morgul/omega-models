//----------------------------------------------------------------------------------------------------------------------
// Brief Description of models.js.
//
// @module models.js
//----------------------------------------------------------------------------------------------------------------------

var _ = require('lodash');

var fields = require('./lib/fields');
var validators = require('./lib/validators');
var Model = require('./lib/model');
var Backend = require('./lib/backend');

var namespaces = {};

//----------------------------------------------------------------------------------------------------------------------

function Namespace(name)
{
    this.name = name;
    this.models = {};
    this._backend = undefined;
} // end Namespace

Namespace.prototype.define = function(definitions)
{
    var self = this;

    // Find each model definition, and create a new Model instance.
    _.each(definitions, function(def, key)
    {
        // If we already have a model of the same name defined, we need to throw an exception; this is a completely
        // invalid state.
        if(key in self.models)
        {
            throw new Error("Model \"" + key + "\" already defined.")
        } // end if

        self.models[key] = Model.create(key, this, def);

        // Define a property with this value on ourselves
        Object.defineProperty(self, key, {
            writable: false,
            enumerable: true,
            value: self.models[key]
        });
    });

    // Make chainable
    return this;
}; // end define

Namespace.prototype.backend = function(name, config)
{
    config = config || {};
    this._backend = new Backend(name, config);

    // Make chainable
    return this;
}; // end backend

//----------------------------------------------------------------------------------------------------------------------

function namespace(name)
{
    if(name in namespaces)
    {
        return namespaces[name];
    }
    else
    {
        var ns = new Namespace(name);
        namespaces[name] = ns;
        return ns;
    } // end if
} // end Model

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    namespace: namespace,
    fields: fields,
    validators: validators
}; // end exports

//----------------------------------------------------------------------------------------------------------------------