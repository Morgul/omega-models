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
    return _.assign({}, this.$values, this.$scratch);
};

Model.prototype.remove = function(callback)
{
    var self = this;
    var backend = this.$backend || this.constructor.ns.$backend;
    callback = callback || function(){};

    // Tell the backend to remove us
    backend.remove(this);

    callback();
};

Model.prototype.save = function(callback)
{
    var self = this;
    var backend = this.$backend || this.constructor.ns.$backend;
    callback = callback || function(){};

    var prepared = {};

    _.forEach(this.constructor.fields, function(field, name)
    {
        prepared[name] = field.prepare(self.$values[name], backend);
    });

    // Tell the backend to save
    backend.store(this, prepared);

    callback();
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

Model.prototype.distinct = function(query, callback)
{
    var backend = this.$backend || this.constructor.ns.$backend;
    backend.distinct(query, callback);
}; // end distinct

Model.prototype.find = function(query, callback)
{
    var backend = this.$backend || this.constructor.ns.$backend;
    backend.find(query, callback);
}; // end find

Model.prototype.findOne = function(query, callback)
{
    var backend = this.$backend || this.constructor.ns.$backend;
    backend.findOne(query, callback);
}; // end findOne

Model.prototype.findOneAndUpdate = function(query, callback)
{
    var backend = this.$backend || this.constructor.ns.$backend;
    backend.findOneAndUpdate(query, callback);
}; // end findOneAndUpdate

Model.prototype.update = function(query, callback)
{
    var backend = this.$backend || this.constructor.ns.$backend;
    backend.update(query, callback);
}; // end update

Model.prototype.mapReduce = function(map, reduce, callback)
{
    var backend = this.$backend || this.constructor.ns.$backend;
    backend.mapReduce(map, reduce, callback);
}; // end mapReduce

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
    function templateConstructor(initial, backend)
    {
        this.$values = {};
        this.$scratch = {};
        this.$backend = backend;

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
                enumerable: true,
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