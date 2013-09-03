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

Model.prototype = {
    get $key()
    {
        var keys = {};
        _.each(this.constructor.keys, function(key)
        {
            keys[key] = this.$values[key];
        }.bind(this));

        return keys;
    }
};

Model.prototype.toJSON = function()
{
    var jsonObj = _.assign({}, this.$values);
    _.each(this.constructor.properties, function(value, key)
    {
        jsonObj[key] = this[key];
    }.bind(this));

    return jsonObj;
};

Model.prototype.remove = function(callback)
{
    var self = this;
    var backend = this.$backend || this.constructor.ns.$backend;
    callback = callback || function(){};

    // Tell the backend to remove us
    backend.remove(this, callback);
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
    backend.store(this, prepared, callback);
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
    constructor.keys = [];

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

    //------------------------------------------------------------------------------------------------------------------
    // Query API
    //------------------------------------------------------------------------------------------------------------------

    // Supports passing a single value in as the query, which will be assumed to be the id of the object.
    function processQuery(query)
    {
        if(query != null && typeof query === 'object')
        {
            return query;
        } // end if

        // We assume that anything else is the key for 'id'. While this might be a little naive, it means we don't have
        // to impose arbitrary restrictions on the type of key supported by the shorthand 'query by id' syntax.
        return { id: query };
    } // end processQuery

    constructor.distinct = function(query, callback)
    {
        var backend = this.ns.$backend;
        backend.distinct(query, callback);
    }; // end distinct

    constructor.find = function(query, callback)
    {
        var backend = this.ns.$backend;
        query = processQuery(query);
        backend.find(query, callback);
    }; // end find

    constructor.findOne = function(query, callback)
    {
        var backend = this.ns.$backend;
        query = processQuery(query);
        backend.findOne(query, callback);
    }; // end findOne

    constructor.findOneAndUpdate = function(query, update, callback)
    {
        var backend = this.ns.$backend;
        query = processQuery(query);
        backend.findOneAndUpdate(query, update, callback);
    }; // end findOneAndUpdate

    constructor.update = function(query, update, callback)
    {
        var backend = this.ns.$backend;
        query = processQuery(query);
        backend.update(query, update, callback);
    }; // end update

    constructor.mapReduce = function(map, reduce, callback)
    {
        var backend = this.ns.$backend;
        backend.mapReduce(map, reduce, callback);
    }; // end mapReduce

    return constructor;
}; // end create

//----------------------------------------------------------------------------------------------------------------------

module.exports = Model;

//----------------------------------------------------------------------------------------------------------------------