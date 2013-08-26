//----------------------------------------------------------------------------------------------------------------------
// Implements the API omega-models uses to communicate with it's database backends.
//
// @module backend.js
//----------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------

function Backend(name, config)
{
    this.name = name;
    this.config = config;

    // Require the actual backend module; if it's 'nosql', then we use our built-in backend for that.
    if(name == 'nosql')
    {
        var NoSQLBackend = require('./backends/nosql');
        this.module = new NoSQLBackend(this.config);
    }
    else if(name == 'mock')
    {
        var MockBackend = require('./backends/mock');
        this.module = new MockBackend(this.config);
    }
    else
    {
        var DatabaseBackend = require(name);
        this.module = new DatabaseBackend(this.config);
    } // end if
} // end Backend

//----------------------------------------------------------------------------------------------------------------------

module.exports = Backend;

//----------------------------------------------------------------------------------------------------------------------