//----------------------------------------------------------------------------------------------------------------------
// Brief Description of mock.js.
//
// @module mock.js
//----------------------------------------------------------------------------------------------------------------------

function MockBackend(config)
{
    this.config = config;

    this.fields = {
        Auto: { store: function(){} },
        Binary: { store: function(){} },
        Char: { store: function(){} },
        Choice: { store: function(){} },
        Date: { store: function(){} },
        DateTime: { store: function(){} },
        File: { store: function(){} },
        Float: { store: function(){} },
        Integer: { store: function(){} },
        List: { store: function(){} },
        Reference: { store: function(){} },
        Text: { store: function(){} }
    }; // end fields
} // end MockBackend

MockBackend.prototype.connect = function(){};

//----------------------------------------------------------------------------------------------------------------------

module.exports = MockBackend;

//----------------------------------------------------------------------------------------------------------------------