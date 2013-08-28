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

function templateConstructor(initial)
{
    this._values = {};
    this._props = {};
    Model.call(this, initial);

    Object.freeze(this);
} // end templateConstructor

Model.create = function(name, ns, def)
{
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

    constructor.prototype.save = function(backend)
    {
        // If we don't have a backend passed in, we use the namespace's backend.
        backend = backend || constructor.ns._backend;

        backend.save(this);
    }; // end save

    return constructor;
}; // end create

//----------------------------------------------------------------------------------------------------------------------

module.exports = Model;

//----------------------------------------------------------------------------------------------------------------------