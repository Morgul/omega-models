//----------------------------------------------------------------------------------------------------------------------
// Brief Description of mock.js.
//
// @module mock.js
//----------------------------------------------------------------------------------------------------------------------

function NoSQLBackend(config)
{
    this.config = config;
    this.last = {};
} // end NoSQLBackend

NoSQLBackend.prototype.connect = function(){};

NoSQLBackend.prototype.remove = function(modelInst)
{
    this.last.removed = modelInst;
};

NoSQLBackend.prototype.store = function(modelInst, prepared)
{
    this.last.modelInst = modelInst;
    this.last.prepared = prepared;
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

NoSQLBackend.prototype.distinct = function(query, callback)
{
    this.last.distinct = {};
    this.last.distinct.query = query;

    callback();
}; // end distinct

NoSQLBackend.prototype.find = function(query, callback)
{
    this.last.find = {};
    this.last.find.query = query;

    callback();
}; // end find

NoSQLBackend.prototype.findOne = function(query, callback)
{
    this.last.findOne = {};
    this.last.findOne.query = query;

    callback();
}; // end findOne

NoSQLBackend.prototype.findOneAndUpdate = function(query, update, callback)
{
    this.last.findOneAndUpdate = {};
    this.last.findOneAndUpdate.query = query;
    this.last.findOneAndUpdate.update = update;

    callback();
}; // end findOneAndUpdate

NoSQLBackend.prototype.update = function(query, update, callback)
{
    this.last.update = {};
    this.last.update.query = query;
    this.last.update.update = update;

    callback();
}; // end update

NoSQLBackend.prototype.mapReduce = function(map, reduce, callback)
{
    this.last.mapReduce = {};
    this.last.mapReduce.map = map;
    this.last.mapReduce.reduce = reduce;

    callback();
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = NoSQLBackend;

//----------------------------------------------------------------------------------------------------------------------
