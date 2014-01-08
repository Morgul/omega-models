//----------------------------------------------------------------------------------------------------------------------
// A simple backend that should be sufficient as a db store for most use cases.
//
// Options:
//  - writeToDisk: Whether or not we should save to disk on writes. Defaults to true.
//  - gzip: Whether or not we should gzip our on-disk files. Defaults to false.
//  - root: The path we should store our on-disk files. Defaults to './db'.
//
// @module simple.js
//----------------------------------------------------------------------------------------------------------------------

var fs = require('fs');
var zlib = require('zlib');
var path = require('path');
var util = require("util");
var events = require("events");

var _ = require('lodash');
var base32 = require('base32');
var mkdirp = require('mkdirp');

var fields = require('../fields');

var uniquifier = 0;

//----------------------------------------------------------------------------------------------------------------------
// Collection - A simple class representing a collection of documents. Handles storing to disk on writes.
//----------------------------------------------------------------------------------------------------------------------

function Collection(name, root, writeToDisk, gzip)
{
    events.EventEmitter.call(this);

    // Up our maximum event listeners
    this.setMaxListeners(20);

    this.name = name;
    this.writeToDisk = writeToDisk;
    this.gzip = gzip;

    this.path = path.join(path.resolve(root), name + '.sdb');
    this.data = {};

    // Write flags
    this.dirty = false;
    this.writing = false;

    // Load any storage from disk
    this._loadFromDisk(function()
    {
        this.initialized = true;
        this.emit('initialized');
    }.bind(this));
} // end Collection

util.inherits(Collection, events.EventEmitter);

Collection.prototype._processKey = function(key)
{
    // Support multi-part key syntax
    if(typeof key != 'string')
    {
        // If we're an object with single `$id` field, we simply use that value as our key for storing.
        var keys = _.keys(key);
        if(keys.length == 1 && key[keys[0]] !== undefined)
        {
            key = key[keys[0]];
        }
        else
        {
            key = JSON.stringify(key);
        } // end if
    } // end if

    return key;
}; // end _processKey

Collection.prototype._loadFromDisk = function(callback)
{
    if(fs.existsSync(this.path))
    {
        try
        {
            var dataStr = fs.readFileSync(this.path);

            if(this.gzip)
            {
                zlib.gunzip(dataStr, function(err, buffer)
                {
                    if(err)
                    {
                        var error = new Error("Error extracting gzipped collection: " + err.message || err.toString());
                        error.innerException = err;

                        // Emit the error
                        this.emit('error', error);
                    }
                    else
                    {
                        this.data = JSON.parse(buffer.toString());
                    } // end if

                    // Call the callback
                    setImmediate(callback);
                }.bind(this));

                return;
            } // end if

            this.data = JSON.parse(dataStr.toString());

            // Call the callback
            setImmediate(callback);
        }
        catch(ex)
        {
            var error = new Error("Error reading collection from disk: " + err.message || err.toString());
            error.innerException = ex;

            // Emit the error
            this.emit('error', error);

            // Call the callback
            setImmediate(callback);
        } // end if
    }
    else
    {
        // Call the callback
        setImmediate(callback);
    } // end if
}; // end _loadFromDisk

Collection.prototype._writeToDisk = function()
{
    if(this.writing)
    {
        this.dirty = true;
    }
    else
    {
        this.writing = true;

        mkdirp(path.dirname(this.path), function(error)
        {
            if(error)
            {
                var err = new Error(util.format("Error while storing collection %j: %s",
                        this.name, error.message || error.toString()));
                err.innerError = error;

                this.emit('error', err);
                return;
            } // end if

            function finish(error)
            {
                if(error)
                {
                    var err = new Error(util.format("Error while storing collection %j: %s",
                        this.name, error.message || error.toString()));
                    err.innerError = error;

                    this.emit('error', err);
                }
                else
                {
                    // Rate-limit our writing to 500ms.
                    setTimeout(function()
                    {
                        this.writing = false;

                        // Check to see if we need to write
                        if(this.dirty)
                        {
                            this._writeToDisk();
                        } // end if
                    }.bind(this), 50);
                } // end if
            } // end finish

            var data = JSON.stringify(this.data);

            if(this.gzip)
            {
                zlib.gzip(data, function(error, buffer)
                {
                    fs.writeFile(this.path, buffer, finish.bind(this))
                }.bind(this))
            }
            else
            {
                fs.writeFile(this.path, data, finish.bind(this))
            } // end if
        }.bind(this));
    } // end if
}; // end _writeToDisk

Collection.prototype.remove = function(filter)
{
    // Generate a key using the same rules as store.
    var filterAsKey = this._processKey(filter);

    // If that key is a key in the collection, we remove it, and we're done.
    if(filterAsKey in this.data)
    {
        delete this.data[filterAsKey];
    }
    else
    {
        // Otherwise, we need to match based on document contents.
        var keys = _.keys(this.data);
        for(var idx = 0; idx < keys.length; idx++)
        {
            var key = keys[idx];
            var doc = this.data[key];
            var matched = true;

            var subKeys = _.keys(filter);
            for(var ydx=0; ydx < subkeys; ydx++)
            {
                var subKey = subKeys[ydx];
                if(doc[subKey] !== filter[subKey])
                {
                    matched = false;
                } // end if
            } // end if

            if(matched)
            {
                delete this.data[key];
            } // end if
        } // end for
    } // end if

    // Save this to disk
    if(this.writeToDisk)
    {
        setImmediate(this._writeToDisk.bind(this));
    } // end if
}; // end remove

Collection.prototype.store = function(key, value)
{
    if(key === undefined || key === null)
    {
        var error = new Error('Cannot store items with undefined or null keys.');
        this.emit('error', error);
        return;
    } // end if

    key = this._processKey(key);

    this.data[key] = value;

    if(this.writeToDisk)
    {
        setImmediate(this._writeToDisk.bind(this));
    } // end if
}; // end store

Collection.prototype.get = function(key, defaultValue)
{
    // Support multi-part keys
    if(typeof key != 'string')
    {
        key = JSON.stringify(key);
    } // end if

    if(key in this.data)
    {
        return this.data[key];
    } // end if

    return defaultValue;
}; // end get


//----------------------------------------------------------------------------------------------------------------------

function SimpleBackend(config)
{
    this.config = config = config || {};
    config.get = function(key, defaultValue)
    {
        if(key in config)
        {
            return config[key];
        } // end if

        return defaultValue;
    }; // end get

    this.collections = {};
} // end SimpleBackend

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------

// Support passing in a final callback, which gets the errors, if we encounter them. Otherwise, pass it to our callback.
SimpleBackend.prototype._getCollection = function(model, callback, final)
{
    callback = callback || function(){};
    final = final || function(){};

    var collectionName = model.constructor.name;
    if(collectionName == 'Function')
    {
        collectionName = model.name;
    } // end if

    var collection = this.collections[collectionName];
    if(collection)
    {
        if(collection.initialized)
        {
            setImmediate(callback, collection, final);
        }
        else
        {
            collection.once('initialized', function()
            {
                setImmediate(callback, collection, final);
            }.bind(this));

            // Setup an error event handler
            collection.once('error', function(error)
            {
                setImmediate(final, error);
            });
        } // end if
    }
    else
    {
        try
        {
            collection = new Collection(collectionName, this.config.get('root', './db'), this.config.get('writeToDisk', true), this.config.get('gzip', false));
            this.collections[collectionName] = collection;

            collection.once('initialized', function()
            {
                setImmediate(callback, collection, final);
            }.bind(this));

            // Setup an error event handler
            collection.once('error', function(error)
            {
                setImmediate(final, error);
            });
        }
        catch(ex)
        {
            var error = new Error("Error encountered while attempting to open collection.");
            error.innerException = ex;

            setImmediate(final, error);
        } // end if
    } // end if
}; // end _getCollection;

SimpleBackend.prototype._generateID = function(collection, seed)
{
    // If we don't have a collection, then the id we generate might not be unique.
    collection = collection || { data: {} };
    var id;

    function genID()
    {
        uniquifier++;
        return base32.sha1('' + seed + uniquifier + Date.now());
    } // end genID

    // Generate an id, and make sure it's not in the collection already.
    while(id === undefined || id in collection.data)
    {
        id = genID();
    } // end while

    return id;
}; // end _generateID

SimpleBackend.prototype._populateAutoIDFields = function(model, document, collection)
{
    _.each(model.fields, function(field, name)
    {
        if(document[name] === undefined && field instanceof fields.types.AutoIDField)
        {
            document[name] = this._generateID(collection, name);
        } // end if
    }.bind(this));

    return document;
}; // end _populateAutoIDFields

//----------------------------------------------------------------------------------------------------------------------
// Backend API
//----------------------------------------------------------------------------------------------------------------------

SimpleBackend.prototype.connect = function(callback)
{
    setImmediate(callback);
};

SimpleBackend.prototype.remove = function(modelInst, filter, callback)
{
    this._getCollection(modelInst, function(collection, done)
    {
        collection.remove(filter);
        setImmediate(done);
    }, callback);
};

SimpleBackend.prototype.store = function(modelInst, prepared, callback)
{
    this._getCollection(modelInst, function(collection, done)
    {
        // Populate AutoID fields that are not currently populated.
        prepared = this._populateAutoIDFields(modelInst.constructor, prepared, collection);

        // Build a new key object, using the newly populated prepared object.
        var instKey = {};
        _.each(_.keys(modelInst.$key), function(key)
        {
            instKey[key] = prepared[key];
        });

        // Store the model in the collection
        collection.store(instKey, prepared);

        // Call the done
        setImmediate(done, undefined, prepared);
    }.bind(this), callback);
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

SimpleBackend.prototype.find = function(model, filter, callback)
{
    this._getCollection(model, function(collection, done)
    {
        var docs;
        var filterJSON = JSON.stringify(filter);

        if(filterJSON == '{}')
        {
            // Support requesting all items in a collection
            docs = _.values(collection.data);
        }
        else if(typeof filter === 'string')
        {
            // Support a simple lookup by key
            docs = collection.get(filter);
        } // end if

        // Support a lookup by a multi-part key, or key object syntax
        if(docs === undefined)
        {
            try
            {
                docs = collection.get(filterJSON);
            }
            catch(ex)
            {
                var err = new Error("Error encountered while attempting to find item.");
                err.innerException = ex;
                setImmediate(done, err);
                return;
            } // end if
        } // end if

        // Support lookup by contents
        if(docs === undefined)
        {
            docs = _.filter(collection.data, filter);
        } // end if

        // Even if we only found a single document, we must pass back an array.
        if(!Array.isArray(docs) && docs !== undefined)
        {
            docs = [docs];
        } // end if

        // Return what we found
        setImmediate(done, undefined, docs);
    }, callback);
}; // end find

SimpleBackend.prototype.findOne = function(model, filter, callback)
{
    this.find(model, filter, function(error, documents)
    {
        setImmediate(callback, error, (documents || [])[0]);
    });
}; // end findOne

SimpleBackend.prototype.findOneAndUpdate = function(model, filter, update, callback)
{
    this.findOne(model, filter, function(error, document)
    {
        if(document)
        {
            var newDoc = _.assign(document, update);
            this._getCollection(model.name, function(collection, done)
            {
                collection.store(filter, newDoc);
                setImmediate(done, undefined, newDoc);
            }, callback);
        }
        else
        {
            setImmediate(callback, error);
        } // end if
    }.bind(this));
}; // end findOneAndUpdate

SimpleBackend.prototype.update = function(model, filter, update, callback)
{
    this.findOneAndUpdate(model, filter, update, function(error, document)
    {
        // We do not pass back the updated document
        setImmediate(callback, error);
    });
}; // end update

SimpleBackend.prototype.mapReduce = function(model, map, reduce, callback)
{
    this._getCollection(model, function(collection, done)
    {
        var out = _.map(collection.data, map);
        var results = _.reduce(out, reduce);

        setImmediate(done, undefined, results);
    }, callback);
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = SimpleBackend;

//----------------------------------------------------------------------------------------------------------------------
