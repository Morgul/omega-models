//----------------------------------------------------------------------------------------------------------------------
// Backend utilizing the wonderful NEDB: https://github.com/louischatriot/nedb
//
// @module nedb.js
//----------------------------------------------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var Model = require('../model');

var _ = require('lodash');
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

NEDBBackend.prototype.remove = function(modelInst, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(modelInst);
    db.remove(modelInst.$key, callback);
};

NEDBBackend.prototype.store = function(modelInst, prepared, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(modelInst);

    db.update(modelInst.$key, prepared, { upsert: true }, function(error, numReplaced, upsert)
    {
        if(upsert)
        {
            // If we inserted a new document, make sure the key is indexed.
            _.forEach(_.keys(modelInst.$key), function(fieldName)
            {
                db.ensureIndex({ fieldName: fieldName });
            });
        } // end if

        callback(error);
    });
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

NEDBBackend.prototype.find = function(model, filter, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(model);
    db.find(filter, callback);
}; // end find

NEDBBackend.prototype.findOne = function(model, filter, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(model);
    db.findOne(filter, callback);
}; // end findOne

NEDBBackend.prototype.findOneAndUpdate = function(model, filter, update, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(model);
    db.update(filter, { $set: update }, {}, function(error)
    {
        if(error)
        {
            callback(error);
        }
        else
        {
            db.findOne(filter, function(error, found)
            {
                callback(error, found);
            });
        } // end if
    })
}; // end findOneAndUpdate

NEDBBackend.prototype.update = function(model, filter, update, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(model);
    db.update(filter, { $set: update }, {}, callback);
}; // end update

NEDBBackend.prototype.mapReduce = function(model, map, reduce, callback)
{
    setImmediate(function(){callback(new Error('Not Implemented.'))});
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = NEDBBackend;

//----------------------------------------------------------------------------------------------------------------------
