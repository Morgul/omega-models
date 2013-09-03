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

    setImmediate(callback);
};

//----------------------------------------------------------------------------------------------------------------------
// Query API
//----------------------------------------------------------------------------------------------------------------------

MockBackend.prototype.find = function(filter, callback)
{
    this.last = {
        find: {
            filter: filter
        }
    };

    setImmediate(callback);
}; // end find

MockBackend.prototype.findOne = function(filter, callback)
{
    this.last = {
        findOne: {
            filter: filter
        }
    };

    setImmediate(callback);
}; // end findOne

MockBackend.prototype.findOneAndUpdate = function(filter, update, callback)
{
    this.last = {
        findOneAndUpdate: {
            filter: filter,
            update: update
        }
    };

    setImmediate(callback);
}; // end findOneAndUpdate

MockBackend.prototype.update = function(filter, update, callback)
{
    this.last = {
        update: {
            filter: filter,
            update: update
        }
    };

    setImmediate(callback);
}; // end update

MockBackend.prototype.mapReduce = function(map, reduce, callback)
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
