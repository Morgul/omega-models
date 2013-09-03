//----------------------------------------------------------------------------------------------------------------------
// Example of using the built-in nosql backend.
//
// @module nosql-example.js
//----------------------------------------------------------------------------------------------------------------------

var om = require('../omega-models');
var NoSQLBackend = om.backends.NoSQL;

// If you check the sample.js, we simply export the namespace object returned by `om.namespace`. This means that we can
// simply use the return of the require.
var ns = require('./sample');

//----------------------------------------------------------------------------------------------------------------------

console.log('Starting NoSQL Example...');

// Set the backend to a new instance of the NoSQL backend.
var backend = new NoSQLBackend({ baseDir: './db' });
ns.backend(backend);

// Create a new User.
var admin = new ns.User({
    nick: "admin",
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    age: 45,
    gender: "Female"
});

console.log('Admin User representation: %j', admin);

// Create a few more users

// Find a user by name

// Find all female users

// Find and update a user

// Update a user

// Find a user, do some things with it, modify the model directly, and then save it back to the db.

admin.save(function()
{
    console.log('Finished NoSQL Example.');
});

//----------------------------------------------------------------------------------------------------------------------