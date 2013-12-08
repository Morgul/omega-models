//----------------------------------------------------------------------------------------------------------------------
// Backend utilizing the wonderful NEDB: https://github.com/louischatriot/nedb
//
// @module nedb.js
//----------------------------------------------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var Model = require('../model');
var fields = require('../fields');

var _ = require('lodash');
var async = require('async');
var Datastore = require('nedb');

//----------------------------------------------------------------------------------------------------------------------

function NEDBBackend(config)
{
    this.config = config;
    this.last = {};
    this.collections = {};
} // end NEDBBackend

NEDBBackend.prototype.connect = function(callback)
{
    setImmediate(callback);
};

NEDBBackend.prototype._buildFilter = function(filter)
{
    filter = _.assign({}, filter);

    if('$id' in filter)
    {
        filter['_id'] = filter['$id'];
        delete filter['$id'];
    } // end if

    return filter;
};

NEDBBackend.prototype._getCollection = function(modelInst)
{
    function ensurePath(desiredPath)
    {
        var pathSep = path.sep;
        var dirs = desiredPath.split(pathSep);
        var root = "";

        while (dirs.length > 0)
        {
            var dir = dirs.shift();
            if (dir === "")
            {
                // If directory starts with a /, the first path will be an empty string.
                root = pathSep;
            } // end if

            if (!fs.existsSync(root + dir))
            {
                fs.mkdirSync(root + dir);
            } // end if

            root += dir + pathSep;
        } // end while
    } // end ensurePath

    var name = modelInst.constructor.name;
    if(name == 'Function')
    {
        name = modelInst.name;
    } // end if

    if(!(name in this.collections))
    {
        var dbPath = path.resolve(this.config.baseDir);
        ensurePath(dbPath);

        this.collections[name] = new Datastore({ filename:path.join(dbPath, name + '.nedb'), autoload: true });
    } // end if

    return this.collections[name];
}; // end

NEDBBackend.prototype.remove = function(modelInst, filter, callback)
{
    callback = callback || function(){};
    filter = this.escapeFields(modelInst, this._buildFilter(filter));
    var db = this._getCollection(modelInst);
    db.remove(filter, callback);
};

NEDBBackend.prototype.escapeFields = function(model, prepared)
{
    _.each(model.fields, function(field, name)
    {
        if(field instanceof fields.types.ListField)
        {
            if(field.opts.type && field.opts.type instanceof fields.types.ReferenceField)
            {
                var value = prepared[name];
                if(value)
                {
                    _.each(value, function(ref, index)
                    {
                        _.each(ref, function(val, key)
                        {
                            if(key[0] == '$')
                            {
                                ref['_' + key] = val;
                                delete ref[key];
                            } // end if
                        });

                        value[index] = ref;
                    });

                    prepared[name] = value;
                } // end if
            } // end if
        }
        else if(field instanceof fields.types.ReferenceField)
        {
            var ref = prepared[name];

            if(ref)
            {
                _.each(ref, function(val, key)
                {
                    if(key[0] == '$')
                    {
                        ref['_' + key] = val;
                        delete ref[key];
                    } // end if
                });

                prepared[name] = ref;
            } // end if
        } // end if
    });

    return prepared;
};

NEDBBackend.prototype.unescapeFields = function(model, found)
{
    if(found)
    {
        _.each(model.fields, function(field, name)
        {
            if(field instanceof fields.types.ListField)
            {
                if(field.opts.type && field.opts.type instanceof fields.types.ReferenceField)
                {
                    var value = found[name];
                    _.each(value, function(ref, index)
                    {
                        _.each(ref, function(val, key)
                        {
                            if(key.substring(0, 2) == '_$')
                            {
                                ref[key.substring(1)] = val;
                                delete ref[key];
                            } // end if
                        });

                        value[index] = ref;
                    });

                    found[name] = value;
                } // end if
            }
            else if(field instanceof fields.types.ReferenceField)
            {
                var ref = found[name];

                _.each(ref, function(val, key)
                {
                    if(key.substring(0, 2) == '_$')
                    {
                        ref[key.substring(1)] = val;
                        delete ref[key];
                    } // end if
                });

                found[name] = ref;
            } // end if
        });
    } // end if

    return found;
};

NEDBBackend.prototype.store = function(modelInst, prepared, callback)
{
    var self = this;
    callback = callback || function(){};
    var db = this._getCollection(modelInst);
    var filter = this._buildFilter(modelInst.$key);

    prepared = this.escapeFields(modelInst.constructor, prepared);

    // We need to handle the special auto-id case.
    if('_id' in filter && !filter['_id'])
    {
        db.insert(prepared, function(error, doc)
        {
            if(error)
            {
                callback(error);
            }
            else
            {
                // If we inserted a new document, make sure the key is indexed.
                _.forEach(_.keys(modelInst.$key), function(fieldName)
                {
                    db.ensureIndex({ fieldName: fieldName });
                });

                doc['$id'] = doc['_id'];
                doc = self.unescapeFields(modelInst.constructor, doc);

                callback(null, doc);
            } // end if
        });
    }
    else
    {
        db.update(filter, prepared, { upsert: true }, function(error, numReplaced, upsert)
        {
            if(upsert)
            {
                // If we inserted a new document, make sure the key is indexed.
                _.forEach(_.keys(modelInst.$key), function(fieldName)
                {
                    db.ensureIndex({ fieldName: fieldName });
                });
            } // end if

            // There's no way to get the updated document. We really do want to return it, though.
            db.findOne(filter, function(error, doc)
            {
                if(doc)
                {
                    doc['$id'] = doc['_id'];
                    doc = self.unescapeFields(modelInst.constructor, doc);
                } // end if

                callback(error, doc);
            });
        });
    } // end if
};

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------

NEDBBackend.prototype.prepareUpdate = function(model, update)
{
    // We can't update our id, so remove it.
    delete update['$id'];

    // Depopulate reference fields...
    //model.dePopulate();
}; // end prepareUpdate

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

NEDBBackend.prototype.find = function(model, filter, callback)
{
    var self = this;
    callback = callback || function(){};
    filter = this.escapeFields(model, this._buildFilter(filter));
    var db = this._getCollection(model);

    db.find(filter, function(error, found)
    {
        if(found)
        {
            async.each(found, function(doc, done)
            {
                doc['$id'] = doc['_id'];
                _.assign(doc, self.unescapeFields(model, doc));
                done();
            }, function(error)
            {
                callback(error, found);
            });
        }
        else
        {
            callback(error, found);
        } // end if
    });
}; // end find

NEDBBackend.prototype.findOne = function(model, filter, callback)
{
    var self = this;
    callback = callback || function(){};
    filter = this.escapeFields(model, this._buildFilter(filter));

    var db = this._getCollection(model);
    db.findOne(filter, function(error, found)
    {
        if(found)
        {
            found['$id'] = found['_id'];

            found = self.unescapeFields(model, found);
        } // end if

        callback(error, found);
    });
}; // end findOne

NEDBBackend.prototype.findOneAndUpdate = function(model, filter, update, callback)
{
    var self = this;
    callback = callback || function(){};
    filter = this.escapeFields(model, this._buildFilter(filter));
    var db = this._getCollection(model);

    // Handle pre-populated fields
    this.prepareUpdate(model, update);

    update = this.escapeFields(model, update);

    db.findOne(filter, function(error, found)
    {
        if(found)
        {
            // Update the found instance
            _.assign(found, update);

            // Save it back to the database
            db.update(filter, self.escapeFields(model, found), function(error)
            {
                found['$id'] = found['_id'];
                found = self.unescapeFields(model, found);

                callback(error, found);
            });
        }
        else
        {
            callback(error);
        } // end if
    });
}; // end findOneAndUpdate

NEDBBackend.prototype.update = function(model, filter, update, callback)
{
    callback = callback || function(){};
    filter = this.escapeFields(model, this._buildFilter(filter));
    var db = this._getCollection(model);

    // Handle pre-populated fields
    this.prepareUpdate(model, update);

    update = this.escapeFields(model, update);

    db.update(filter, { $set: update }, {}, callback);
}; // end update

NEDBBackend.prototype.mapReduce = function(model, map, reduce, callback)
{
    setImmediate(function(){callback(new Error('Not Implemented.'))});
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = NEDBBackend;

//----------------------------------------------------------------------------------------------------------------------
