#!/usr/bin/env node

//----------------------------------------------------------------------------------------------------------------------
// Example of using the built-in nosql backend.
//
// @module nosql-example.js
//----------------------------------------------------------------------------------------------------------------------

var om = require('../omega-models');
var SimpleBackend = om.backends.Simple;

// If you check the sample.js, we simply export the namespace object returned by `om.namespace`. This means that we can
// simply use the return of the require.
var ns = require('./sample');

//----------------------------------------------------------------------------------------------------------------------

console.log('Starting Simple Example...');

// Set the backend to a new instance of the NoSQL backend.
var backend = new SimpleBackend({ root: './db' });
ns.backend(backend);

var something = new ns.Something({
    name: "something"
});

var somethingElse = new ns.SomethingElse({
    name: "somethingElse"
});

var group = new ns.Group({
    name: 'Test Group'
});

function queryTest()
{
    // Find a user by name
    ns.User.findOne({first_name: 'Foo'}, function(error, foo)
    {
        console.log("Foo user: %j", foo);

        // Find all female users
        ns.User.find({gender: "Female"}, function(error, women)
        {
            console.log("Female users:", women);

            ns.User.findOneAndUpdate({first_name: 'Foo'}, {first_name: 'Foo', age: 15}, function(error, foo)
            {
                console.log('Updated Foo user: %j', foo);

                ns.User.update({first_name: 'Bar'}, {middle_name: 'Baz'}, function(error)
                {
                    // Find a user, do some things with it, modify the model directly, and then save it back to the db.
                    ns.User.findOne({first_name: 'Bar'}, function(error, bar)
                    {
                        console.log('Updated Bar user: %j', bar);

                        bar.biography = "This is Bar Foo, the younger sister of the infamous Foo Bar. She has lived in his shadow for a long, long time. Now, finally, she can get her own entry in a database.";
                        bar.save(function()
                        {
                            ns.SomethingElse.findOne({name: "somethingElse"}, function(error, something)
                            {
                                console.log('Something: %j', something);
                                something.populate(function(error, something)
                                {
                                    console.log('Something (after populate): %j', something);

                                    something.dePopulate();

                                    console.log('Something (after depopulate): %j', something);

                                    console.log('Finished Simple Example.');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
} // end queryTest

// Create a new User.
var admin = new ns.User({
    nick: "admin",
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    age: 30,
    gender: "Female"
});

admin.save(function()
{
    console.log('Admin User representation: %j', admin);

    // Create a few more users
    var foo = new ns.User({
        nick: "foo",
        email: "foo@example.com",
        first_name: "Foo",
        last_name: "Bar",
        age: 13,
        gender: "Male"
    });

    foo.save(function()
    {
        console.log('Saving foo user...');

        var bar = new ns.User({
            nick: "bar",
            email: "bar@example.com",
            first_name: "Bar",
            last_name: "Foo",
            age: 18,
            gender: "Female"
        });

        bar.save(function()
        {
            console.log('Saved bar user.');

            group.save(function()
            {
                somethingElse.group = group;
                somethingElse.save(function()
                {
                    console.log('Saved somethingElse instance');
                    something.save(function()
                    {
                        console.log('Saved something instance');
                        queryTest();
                    });
                });
            });
        });
    });
});

//----------------------------------------------------------------------------------------------------------------------
