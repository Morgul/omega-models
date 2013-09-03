//----------------------------------------------------------------------------------------------------------------------
// Brief Description of mock.js.
//
// @module mock.js
//----------------------------------------------------------------------------------------------------------------------

function MockBackend(config)
{
    this.config = config;
    this.last = {};
} // end MockBackend

MockBackend.prototype.connect = function(){};

MockBackend.prototype.remove = function(modelInst, callback)
{
    this.last.removed = modelInst;
};

MockBackend.prototype.store = function(modelInst, prepared, callback)
{
    this.last.modelInst = modelInst;
    this.last.prepared = prepared;
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

MockBackend.prototype.distinct = function(query, callback)
{
    this.last.distinct = {};
    this.last.distinct.query = query;

    callback();
}; // end distinct

MockBackend.prototype.find = function(query, callback)
{
    this.last.find = {};
    this.last.find.query = query;

    callback();
}; // end find

MockBackend.prototype.findOne = function(query, callback)
{
    this.last.findOne = {};
    this.last.findOne.query = query;

    callback();
}; // end findOne

MockBackend.prototype.findOneAndUpdate = function(query, update, callback)
{
    this.last.findOneAndUpdate = {};
    this.last.findOneAndUpdate.query = query;
    this.last.findOneAndUpdate.update = update;

    callback();
}; // end findOneAndUpdate

MockBackend.prototype.update = function(query, update, callback)
{
    this.last.update = {};
    this.last.update.query = query;
    this.last.update.update = update;

    callback();
}; // end update

MockBackend.prototype.mapReduce = function(map, reduce, callback)
{
    this.last.mapReduce = {};
    this.last.mapReduce.map = map;
    this.last.mapReduce.reduce = reduce;

    callback();
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = MockBackend;

//----------------------------------------------------------------------------------------------------------------------