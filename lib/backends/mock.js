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

MockBackend.prototype.remove = function(modelInst)
{
    this.last.removed = modelInst;
};

MockBackend.prototype.store = function(modelInst, prepared)
{
    this.last.modelInst = modelInst;
    this.last.prepared = prepared;
};

//----------------------------------------------------------------------------------------------------------------------

module.exports = MockBackend;

//----------------------------------------------------------------------------------------------------------------------