//----------------------------------------------------------------------------------------------------------------------
// A backend implementing NoSQL, a zero dependency node.js database. (https://github.com/petersirka/nosql)
//
// @module nosql.js
//----------------------------------------------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var Model = require('../model');

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

NoSQLBackend.prototype._buildFilter = function(filter)
{
    var keys = [];
    _.each(filter, function(value, key)
    {
        if(typeof value == 'string')
        {
            value = '"' + value + '"';
        } // end if

        keys.push("doc." + key + " == " + value);
    });

    return keys.join(" && ");
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
    if(name == 'Function')
    {
        name = modelInst.name;
    } // end if

    if(!(name in this.collections))
    {
        var dbPath = path.resolve(this.baseDir);
        ensurePath(dbPath);

        this.collections[name] = nosql.load(path.join(dbPath, name + '.nosql'));
    } // end if

    return this.collections[name];
}; // end

NoSQLBackend.prototype._buildUpdate = function(filter, update)
{
    return function(doc)
    {
        // We use lodash's findWhere to easily test against our key
        if(_.findWhere(doc, filter))
        {
            _.assign(doc, update);
        } // end if

        return doc;
    }; // end updateFunction
};

NoSQLBackend.prototype.remove = function(modelInst, callback)
{
    callback = callback || function(){};
    var db = this._getCollection(modelInst);
    db.remove(this._buildFilter(modelInst.$key), callback);
}; // end remove

NoSQLBackend.prototype.store = function(modelInst, prepared, callback)
{
    var self = this;
    callback = callback || function(){};
    var db = this._getCollection(modelInst);
    var filter = this._buildFilter(modelInst.$key);

    // If there's already a record that matches our filter, we update. Otherwise, we insert. There may be a more elegant
    // way to do this, but this will work for now.
    db.one(filter, function(doc)
    {
        if(doc)
        {
            // Updates are kinda a pain in the ass. I can't just pass a filter and what to update; no I need to pass a
            // function that's half filter, half update. Ugh.
            db.update(self._buildUpdate(modelInst.$key, prepared), function(count)
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

NoSQLBackend.prototype.find = function(model, filter, callback)
{
    var query = this._buildFilter(filter);
    var db = this._getCollection(model);

    db.all(query, function(found)
    {
        found = found || [];
        setImmediate(callback, undefined, found);
    });
}; // end find

NoSQLBackend.prototype.findOne = function(model, filter, callback)
{
    var query = this._buildFilter(filter);
    var db = this._getCollection(model);

    db.one(query, function(found)
    {
        setImmediate(callback, undefined, found);
    });
}; // end findOne

NoSQLBackend.prototype.findOneAndUpdate = function(model, filter, update, callback)
{
    var self = this;
    var query = this._buildFilter(filter);
    var db = this._getCollection(model);

    db.one(query, function(found)
    {
        db.update(self._buildUpdate(filter, update), function()
        {
            setImmediate(callback, undefined, found);
        });
    });
}; // end findOneAndUpdate

NoSQLBackend.prototype.update = function(model, filter, update, callback)
{
    var db = this._getCollection(model);

    db.update(this._buildUpdate(filter, update), function()
    {
        setImmediate(callback, undefined);
    });
}; // end update

NoSQLBackend.prototype.mapReduce = function(model, map, reduce, callback)
{
    var db = this._getCollection(model);
    setImmediate(callback, new Error("Not yet implemented!"));
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = NoSQLBackend;

//----------------------------------------------------------------------------------------------------------------------
