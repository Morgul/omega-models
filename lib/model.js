//----------------------------------------------------------------------------------------------------------------------
// Brief Description of model.js.
//
// @module model.js
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');

var _ = require('lodash');
var async = require('async');
var fields = require('./fields');

//----------------------------------------------------------------------------------------------------------------------

function Model(initial)
{
    var self = this;
    if(initial)
    {
        initial = _.pick(initial, function(value, key)
        {
            return key in self.constructor.fields || key in self.constructor.properties;
        });

        // Sanitize reference fields
        _.forEach(this.constructor.fields, function(field, name)
        {
            var value = initial[name];
            var RefModel = self.constructor.ns[field.opts.model];
            if(field instanceof fields.types.ReferenceField)
            {
                initial[name] = buildKey(RefModel.keys, value);
            }
            else if(field instanceof fields.types.ListField && Array.isArray(initial[name]))
            {
                if(field.opts.type instanceof fields.types.ReferenceField)
                {
                    RefModel = self.constructor.ns[field.opts.type.opts.model];
                    initial[name].forEach(function(ref, idx)
                    {
                        value[idx] = buildKey(RefModel.keys, ref);
                    });

                    initial[name] = value;
                } // end if
            } // end if
        });

        _.assign(this, initial);

        // Special case setting $id
        if('$id' in initial)
        {
            this.$values['$id'] = initial['$id'];
        } // end if
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
    backend.remove(this, this.$key, callback);
};

Model.prototype.save = function(callback)
{
    var self = this;
    var backend = this.$backend || this.constructor.ns.$backend;
    callback = callback || function(){};

    var prepared = {};

    // Catch validation or saving errors, and return them through the callback.
    try
    {
        _.forEach(this.constructor.fields, function(field, name)
        {
            prepared[name] = field.prepare(self.$values[name], backend);
        });

        // Tell the backend to save
        backend.store(this, prepared, function(error, updated)
        {
            // If the backend returns a new object, we should apply it, as it's what got stored.
            if(!error && updated)
            {
                // Handle the fact that we have no setter for AutoIDFields
                if('$id' in updated)
                {
                    self.$values['$id'] = updated['$id'];
                } // end if

                _.assign(self, updated);
            } // end if

            callback(error);
        });
    }
    catch(ex)
    {
        callback(ex);
    } // end try/catch
};

Model.prototype.getRefs = function()
{
    var refs = [];

    var _fields = this.constructor.fields;
    _.each(_fields, function(field, name)
    {
        if(field instanceof fields.types.ListField)
        {
            if(field.opts.type instanceof fields.types.ReferenceField)
            {
                refs.push([name, field]);
            } // end if
        }
        else if(field instanceof fields.types.ReferenceField)
        {
            refs.push([name, field]);
        } // end if
    });

    return refs;
}; // end geRefs

Model.prototype.populate = function(recursive, callback)
{
    if(typeof recursive == 'function')
    {
        callback = recursive;
        recursive = false;
    } // end if

    callback = callback || function(){};
    var self = this;
    var refs = this.getRefs();

    async.each(refs, function(ref, done)
    {
        var name = ref[0];
        var field = ref[1];
        var value = self.$values[name];

        if(!Array.isArray(value))
        {
            value = [value];
        } // end if

        var populated = [];

        async.each(value, function(key, finished)
        {
            var RefModel = self.constructor.ns[field.opts.model];
            if(field instanceof fields.types.ListField)
            {
                RefModel = self.constructor.ns[field.opts.type.opts.model];
            } // end if

            if(_.isEmpty(key)) {
                // There's nothing to look up, as an empty key is invalid.
                finished();
                return;
            } // end if

            RefModel.findOne(key, function(error, model)
            {
                if(!error && model)
                {
                    if(recursive)
                    {
                        model.populate(true, function()
                        {
                            populated.push(model);
                            finished(error);
                        });
                    }
                    else
                    {
                        populated.push(model);
                        finished(error);
                    } // end if
                }
                else
                {
                    finished(error);
                } // end if
            });

        }, function(error)
        {
            if(field instanceof fields.types.ListField)
            {
                self.$values[name] = populated;
            }
            else
            {
                self.$values[name] = populated[0];
            } // end if

            done(error);
        });
    }, function(error)
    {
        callback(error, self);
    });
}; // end populate

Model.prototype.dePopulate = function()
{
    var self = this;

    _.forEach(this.constructor.fields, function(field, name)
    {
        var value = self.$values[name];
        var RefModel = self.constructor.ns[field.opts.model];
        if(field instanceof fields.types.ReferenceField)
        {
            self.$values[name] = buildKey(RefModel.keys, value);
        }
        else if(field instanceof fields.types.ListField && Array.isArray(self.$values[name]))
        {
            if(field.opts.type instanceof fields.types.ReferenceField)
            {
                RefModel = self.constructor.ns[field.opts.type.opts.model];
                self.$values[name].forEach(function(ref, idx)
                {
                    value[idx] = buildKey(RefModel.keys, ref);
                });

                self.$values[name] = value;
            } // end if
        } // end if
    });
}; // end dePopulate

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
    // jshint evil: true
    // (to allow us to use the Function constructor below)

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

    // Check to see if a key was set, and if not, we should build one ourselves.
    if(constructor.keys.length == 0)
    {
        var idField = fields.AutoID({ key: true });
        idField.setup('$id', constructor);
        constructor.fields['$id'] = idField;

        Object.defineProperty(constructor.prototype, '$id', {
            enumerable: true,
            get: idField.getter(),
            set: idField.setter()
        });
    } // end if

    //------------------------------------------------------------------------------------------------------------------
    // Query API
    //------------------------------------------------------------------------------------------------------------------

    // Supports passing a single value in as the filter, which will be assumed to be the id of the object.
    function processFilter(filter)
    {
        if(filter !== null && typeof filter === 'object')
        {
            return filter;
        } // end if

        // We assume that anything else is the value for 'id'. While this might be a little naive, it means we don't
        // have to impose arbitrary restrictions on the type of value supported by the shorthand 'filter by id' syntax.
        return { id: filter };
    } // end processFilter

    function modelInstCallback(Model, callback)
    {
        callback = callback || function(){};

        return function(error, found)
        {
            if(error)
            {
                callback(error);
            }
            else if(found)
            {
                if(Array.isArray(found))
                {
                    var instances = [];
                    found.forEach(function(value)
                    {
                        instances.push(new Model(value));
                    });

                    callback(undefined, instances);
                }
                else
                {
                    var inst = new Model(found);
                    callback(undefined, inst);
                } // end if
            }
            else
            {
                callback();
            } // end if
        };
    } // end modelInstCallback

    constructor.remove = function(filter, callback)
    {
        var backend = this.ns.$backend;
        filter = processFilter(filter);
        backend.remove(this, filter, modelInstCallback(this, callback));
    }; // end find

    constructor.find = function(filter, callback)
    {
        var backend = this.ns.$backend;

        if(typeof filter == 'function')
        {
            callback = filter;
            filter = {};
        } // end if

        filter = processFilter(filter);
        backend.find(this, filter, modelInstCallback(this, callback));
    }; // end find

    constructor.findOne = function(filter, callback)
    {
        var backend = this.ns.$backend;
        filter = processFilter(filter);
        backend.findOne(this, filter, modelInstCallback(this, callback));
    }; // end findOne

    constructor.findOneAndUpdate = function(filter, update, callback)
    {
        var backend = this.ns.$backend;
        filter = processFilter(filter);
        backend.findOneAndUpdate(this, filter, update, modelInstCallback(this, callback));
    }; // end findOneAndUpdate

    constructor.update = function(filter, update, callback)
    {
        var backend = this.ns.$backend;
        filter = processFilter(filter);
        backend.update(this, filter, update, callback);
    }; // end update

    constructor.mapReduce = function(map, reduce, callback)
    {
        var backend = this.ns.$backend;
        backend.mapReduce(this, map, reduce, modelInstCallback(this, callback));
    }; // end mapReduce

    return constructor;
}; // end create

//----------------------------------------------------------------------------------------------------------------------

function buildKey(keyDef, values)
{
    var keys = {};
    _.each(keyDef, function(key)
    {
        if(values && values[key])
        {
            keys[key] = values[key];
        } // end if
    }.bind(this));

    return keys;
} // end buildKey

//----------------------------------------------------------------------------------------------------------------------

module.exports = Model;

//----------------------------------------------------------------------------------------------------------------------
