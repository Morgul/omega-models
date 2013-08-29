//----------------------------------------------------------------------------------------------------------------------
// Brief Description of model.js.
//
// @module model.js
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');

var _ = require('lodash');
var fields = require('./fields');

//----------------------------------------------------------------------------------------------------------------------

function Model(initial)
{
    if(initial)
    {
        initial = _.pick(initial, function(value, key)
        {
            return key in this.constructor.fields || key in this.constructor.properties
        }.bind(this));

        _.assign(this, initial);
    } // end if
} // end Model

Model.prototype.toJSON = function()
{
    return _.assign({}, this._values, this._props);
};

Model.prototype.save = function(backend, callback)
{
    var self = this;
    callback = callback || function(){};
    backend = backend || this.constructor.ns._backend;

    var prepared = {};

    _.forEach(this.constructor.fields, function(field, name)
    {
        prepared[name] = field.prepare(self._values[name], backend);
    });

    // Tell the backend to save
    backend.store(this, prepared);

    callback();
};

//----------------------------------------------------------------------------------------------------------------------

/**
 * Creates a new Model.
 *
 * This isn't actually a "Model instance", but rather is a specialized constructor that when instantiated will create a
 * correct instance of the desired model. Javascript is rather odd about the way this whole thing works, but using this
 * function promises that the resulting model instances will have the correct names, and also test true for
 * `inst instanceof Model`. Still, it's a bit of a pain.
 * @param name
 * @param ns
 * @param def
 * @returns {Function}
 */
Model.create = function(name, ns, def)
{
    function templateConstructor(initial)
    {
        this._values = {};
        this._props = {};
        Model.call(this, initial);

        Object.freeze(this);
    } // end templateConstructor

    // Wonderful hack to get a function with the right name. Thanks for playing, Javascript.
    var constructor = (new Function('Model', 'return ' + templateConstructor.toString().replace('templateConstructor', name)))(Model);

    util.inherits(constructor, Model);

    constructor.ns = ns;
    constructor.schema = def;
    constructor.fields = {};
    constructor.properties = {};
    constructor.functions = {};

    _.each(constructor.schema, function(field, name)
    {
        if(field instanceof fields.Field)
        {
            field.setup(name, constructor);

            if(field instanceof fields.PropertyField)
            {
                constructor.properties[name] = field;
            }
            else
            {
                constructor.fields[name] = field;
            } // end if

            // Define Getter/Setter for this field
            Object.defineProperty(constructor.prototype, name, {
                get: field.getter(),
                set: field.setter()
            });
        }
        else if(typeof field == 'function')
        {
            constructor.functions[name] = field;

            // Define Getter/Setter for this field
            Object.defineProperty(constructor.prototype, name, {
                value: field,
                enumerable: false,
                writable: false
            });
        } // end if
    });

    return constructor;
}; // end create

//----------------------------------------------------------------------------------------------------------------------

module.exports = Model;

//----------------------------------------------------------------------------------------------------------------------