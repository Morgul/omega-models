//----------------------------------------------------------------------------------------------------------------------
// Example of using the built-in nosql backend.
//
// @module nosql-example.js
//----------------------------------------------------------------------------------------------------------------------

var om = require('../omega-models');
var Backend = om.backends.NEDB;

// If you check the sample.js, we simply export the namespace object returned by `om.namespace`. This means that we can
// simply use the return of the require.
var ns = require('./sample');

//----------------------------------------------------------------------------------------------------------------------

console.log('Starting NEDB Example...');
var backend = new Backend({ baseDir: './db' });
ns.backend(backend);

var foo = new ns.Something({ name: "Foo" });

console.log('foo: %j', foo);

foo.save(function(error)
{
    if(error)
    {
        console.error('Error:', error.stack);
    } // end if

    console.log('foo: %j', foo);

    console.log('Finsihed NEDB Example');
});

//----------------------------------------------------------------------------------------------------------------------