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

var fields = require('../fields');

//----------------------------------------------------------------------------------------------------------------------
// Collection - A simple class representing a collection of documents. Handles storing to disk on writes.
//----------------------------------------------------------------------------------------------------------------------

function Collection(name, writeToDisk, gzip)
{
    events.EventEmitter.call(this);

    this.name = name;
    this.writeToDisk = writeToDisk;
    this.gzip = gzip;

    this.path = path.join(path.resolve(this.config.get('root', './db')), name);
    this.data = {};

    // Load any storage from disk
    this._loadFromDisk(function()
    {
        this.emit('initialized');
    }.bind(this));
} // end Collection

util.inherits(Collection, events.EventEmitter);

Collection.prototype._loadFromDisk = function(callback)
{
    if(fs.existsSync(this.path))
    {
        try
        {
            var dataStr = fs.readFileSync(this.path, { encoding: 'utf8' });

            if(this.gzip)
            {
                zlib.gunzip(dataStr, function()
                {
                    // Call the callback
                    return callback();
                });
            } // end if

            this.data = JSON.parse(dataStr);

            // Call the callback
            callback();
        }
        catch(ex)
        {
            var error = new Error("Error reading collection from disk.");
            error.innerException = ex;

            // Emit the error
            this.emit('error', error);

            // Call the callback
            callback();
        } // end if
    } // end if
}; // end _loadFromDisk

Collection.prototype._writeToDisk = function()
{
    //TODO: Put some rate-limiting here.

    // Build a write stream for saving to disk.
    var writeStream = new fs.createWriteStream(this.path, { flags: 'w', encoding: 'utf8' });
    if(this.gzip)
    {
        writeStream = zlib.createGzip().pipe(writeStream);
    } // end if

    // Listen for errors
    writeStream.on('error', function(error)
    {
        var err = new Error("Error while storing collection '" + this.name + "'.");
        err.innerError = error;

        this.emit('error', err);
    }.bind(this));

    // Write the collection to disk
    writeStream.write(JSON.stringify(this.data));
}; // end _writeToDisk

Collection.prototype.remove = function(filter)
{
    this.data = _.reject(this.data, filter);

    if(this.writeToDisk)
    {
        setImmediate(this._writeToDisk);
    } // end if
}; // end remove

Collection.prototype.store = function(key, value)
{
    if(key === undefined || key === null)
    {
        var error = new Error('Cannot store items wil undefined or null keys.');
        this.emit('error', error);
        return;
    } // end if

    // Support multi-part keys
    if(typeof key != 'string')
    {
        key = JSON.stringify(key);
    } // end if

    this.data[key] = value;

    if(this.writeToDisk)
    {
        setImmediate(this._writeToDisk);
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
    this.config = config;
    this.config.get = function(key, defaultValue)
    {
        if(key in module.exports)
        {
            return module.exports[key];
        } // end if

        return defaultValue;
    }; // end get

    this.collections = {};
    this.collectionFiles = {};
} // end SimpleBackend

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------

SimpleBackend.prototype._getCollection = function(collectionName, callback)
{
    callback = callback || function(){};

    var collection = this.collections[collectionName];
    if(collection)
    {
        setImmediate(callback, undefined, collection);
    }
    else
    {
        try
        {
            collection = new Collection(collectionName, this.config.get('writeToDisk', true), this.config.get('gzip', false));
            collection.on('initialized', function()
            {
                this.collections[collectionName] = collection;
                setImmediate(callback, undefined, collection);
            }.bind(this));
        }
        catch(ex)
        {
            var error = new Error("Error encountered while attempting to open collection.");
            error.innerException = ex;
            setImmediate(callback, error);
        } // end if
    } // end if
}; // end _getCollection;

SimpleBackend.prototype._generateID = function(collection, document)
{
    // If we don't have a collection, then the id we generate might not be unique.
    collection = collection || { data: {} };

    //TODO: Implement!
    return undefined;
}; // end _generateID

SimpleBackend.prototype._populateAutoIDFields = function(model, document, collection)
{
    _.each(model.fields, function(field, name)
    {
        if(document[name] === undefined && field instanceof fields.types.AutoIDField)
        {
            document[name] = this._generateID(collection);
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
    this._getCollection(modelInst.constructor.name, function(error, collection)
    {
        collection.on('error', function(error)
        {
            setImmediate(callback, error);
        });

        // Handle the case where an exception was caught inside _getCollection.
        if(error)
        {
            callback(error);
        }
        else
        {
            collection.remove(filter);
            setImmediate(callback);
        } // end if
    });
};

SimpleBackend.prototype.store = function(modelInst, prepared, callback)
{
    this._getCollection(modelInst.constructor.name, function(error, collection)
    {
        collection.on('error', function(error)
        {
            setImmediate(callback, error);
        });

        // Handle the case where an exception was caught inside _getCollection.
        if(error)
        {
            callback(error);
        }
        else
        {
            // Populate AutoID fields that are not currently populated.
            prepared = this._populateAutoIDFields(modelInst.constructor, prepared);

            // Store the model in the collection
            collection.store(modelInst.$key, prepared);

            // Call the callback
            setImmediate(callback, undefined, prepared);
        }; // end if
    });
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

SimpleBackend.prototype.find = function(model, filter, callback)
{
    this._getCollection(model.name, function(error, collection)
    {
        collection.on('error', function(error)
        {
            setImmediate(callback, error);
        });

        // Handle the case where an exception was caught inside _getCollection.
        if(error)
        {
            callback(error);
        }
        else
        {
            var doc = undefined;

            // Support a simple lookup by key
            if(typeof filter === 'string')
            {
                doc = collection.get(filter);
            } // end if

            // Support a lookup by a multi-part key, or key object syntax
            if(doc === undefined)
            {
                try
                {
                    doc = collection.get(JSON.stringify(filter))
                }
                catch(ex)
                {
                    var err = new Error("Error encountered while attempting to find item.");
                    err.innerException = ex;
                    setImmediate(callback, err);
                } // end if
            } // end if

            // Support lookup by contents
            if(doc === undefined)
            {
                doc = _.filter(collection.data, filter)
            } // end if

            // Even if we only found a single document, we must pass back an array.
            if(!Array.isArray(doc) && doc !== undefined)
            {
                doc = [doc];
            } // end if

            // Return what we found
            setImmediate(callback, undefined, doc);
        } // end if
    });
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
    this._getCollection(model.name, function(error, collection)
    {
        collection.on('error', function(error)
        {
            setImmediate(callback, error);
        });

        // Handle the case where an exception was caught inside _getCollection.
        if(error)
        {
            callback(error);
        }
        else
        {
            //TODO: Implement!
            setImmediate(callback);
        } // end if
    });
}; // end findOneAndUpdate

SimpleBackend.prototype.update = function(model, filter, update, callback)
{
    this._getCollection(model.name, function(error, collection)
    {
        collection.on('error', function(error)
        {
            setImmediate(callback, error);
        });

        // Handle the case where an exception was caught inside _getCollection.
        if(error)
        {
            callback(error);
        }
        else
        {
            //TODO: Implement!
            setImmediate(callback);
        } // end if
    });
}; // end update

SimpleBackend.prototype.mapReduce = function(model, map, reduce, callback)
{
    this._getCollection(model.name, function(error, collection)
    {
        collection.on('error', function(error)
        {
            setImmediate(callback, error);
        });

        // Handle the case where an exception was caught inside _getCollection.
        if(error)
        {
            callback(error);
        }
        else
        {
            //TODO: Implement!
            setImmediate(callback, new Error("Not Implemented."));
        } // end if
    });
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = SimpleBackend;

//----------------------------------------------------------------------------------------------------------------------
