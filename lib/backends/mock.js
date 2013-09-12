//----------------------------------------------------------------------------------------------------------------------
// Brief Description of mock.js.
//
// @module mock.js
//----------------------------------------------------------------------------------------------------------------------

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------

function MockBackend(config)
{
    this.config = config;
    this.last = {};
} // end MockBackend

MockBackend.prototype.connect = function(callback)
{
    setImmediate(callback);
};

MockBackend.prototype.remove = function(modelInst, callback)
{
    this.last = {
        remove: {
            modelInst: modelInst
        }
    };

    setImmediate(callback);
};

MockBackend.prototype.store = function(modelInst, prepared, callback)
{
    this.last = {
        store: {
            modelInst: modelInst,
            prepared: prepared
        }
    };

    setImmediate(callback, undefined, _.assign({}, prepared, {'$id': 'some_key'}));
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

MockBackend.prototype.find = function(model, filter, callback)
{
    this.last = {
        find: {
            filter: filter
        }
    };

    setImmediate(callback);
}; // end find

MockBackend.prototype.findOne = function(model, filter, callback)
{
    this.last = {
        findOne: {
            filter: filter
        }
    };

    setImmediate(callback);
}; // end findOne

MockBackend.prototype.findOneAndUpdate = function(model, filter, update, callback)
{
    this.last = {
        findOneAndUpdate: {
            filter: filter,
            update: update
        }
    };

    setImmediate(callback);
}; // end findOneAndUpdate

MockBackend.prototype.update = function(model, filter, update, callback)
{
    this.last = {
        update: {
            filter: filter,
            update: update
        }
    };

    setImmediate(callback);
}; // end update

MockBackend.prototype.mapReduce = function(model, map, reduce, callback)
{
    this.last = {
        mapReduce: {
            map: map,
            reduce: reduce
        }
    };

    setImmediate(callback);
}; // end mapReduce

//----------------------------------------------------------------------------------------------------------------------

module.exports = MockBackend;

//----------------------------------------------------------------------------------------------------------------------
