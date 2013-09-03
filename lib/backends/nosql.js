//----------------------------------------------------------------------------------------------------------------------
// Brief Description of mock.js.
//
// @module mock.js
//----------------------------------------------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var nosql = require('nosql');

function NoSQLBackend(config)
{
    this.config = config;
    this.baseDir = config.baseDir || path.resolve('./db');
    this.collections = {};
} // end NoSQLBackend

NoSQLBackend.prototype.connect = function(callback)
{
    // No op
    setImmediate(callback);
}; // end connect

NoSQLBackend.prototype._buildFilter = function(modelInst)
{
    var keys = [];
    _.each(modelInst.$key, function(value, key)
    {
        keys.push(key + " == " + value);
    });

    return keys.join(" && ") + ";";
}; // end _buildFilter

NoSQLBackend.prototype._getCollection = function(modelInst)
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
    if(!(name in this.collections))
    {
        var dbPath = path.resolve(this.baseDir);
        ensurePath(dbPath);

        this.collections[name] = nosql.load(path.join(dbPath, name + '.nosql'));
    } // end if

    return this.collections[name];
}; // end

NoSQLBackend.prototype.remove = function(modelInst, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(modelInst);
    db.remove(this._buildFilter(modelInst), callback);
}; // end remove

NoSQLBackend.prototype.store = function(modelInst, prepared, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(modelInst);
    var filter = this._buildFilter(modelInst);

    // If there's already a record that matches our filter, we update. Otherwise, we insert. There may be a more elegant
    // way to do this, but this will work for now.
    db.one(filter, function(doc)
    {
        if(doc)
        {
            // Updates are kinda a pain in the ass. I can't just pass a filter and what to update; no I need to pass a
            // function that's half filter, half update. Ugh.
            db.update(function(doc)
            {
                // We use lodash's findWhere to easily test against our key
                if(_.findWhere(doc, modelInst.$key))
                {
                    _.assign(doc, prepared);
                } // end if

                return doc;
            }, function(count)
            {
                callback();
            });
        }
        else
        {
            db.insert(prepared, function(count)
            {
                callback();
            });
        } // end if
    });
}; // end store

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

NoSQLBackend.prototype.find = function(filter, callback)
{
    setImmediate(callback, new Error("Not yet implemented!"));
}; // end find

NoSQLBackend.prototype.findOne = function(filter, callback)
{
    setImmediate(callback, new Error("Not yet implemented!"));
}; // end findOne

NoSQLBackend.prototype.findOneAndUpdate = function(filter, update, callback)
{
    setImmediate(callback, new Error("Not yet implemented!"));
}; // end findOneAndUpdate

NoSQLBackend.prototype.update = function(filter, update, callback)
{
    setImmediate(callback, new Error("Not yet implemented!"));
}; // end update

NoSQLBackend.prototype.mapReduce = function(map, reduce, callback)
{
    setImmediate(callback, new Error("Not yet implemented!"));
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = NoSQLBackend;

//----------------------------------------------------------------------------------------------------------------------
