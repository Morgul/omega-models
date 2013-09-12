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

var admin = new ns.User({
    nick: "admin",
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    age: 30,
    gender: "Female"
});

var foo = new ns.User({
    nick: "foo",
    email: "foo@example.com",
    first_name: "Foo",
    last_name: "Bar",
    age: 13,
    gender: "Male"
});

var bar = new ns.User({
    nick: "bar",
    email: "bar@example.com",
    first_name: "Bar",
    last_name: "Foo",
    age: 18,
    gender: "Female"
});

admin.save(function(error)
{
    if(error)
    {
        console.error('Error:', error.stack);
    } // end if

    console.log('Saved the admin user.');

    foo.save(function(error)
    {
        if(error)
        {
            console.error('Error:', error.stack);
        } // end if

        console.log('Saved the foo user.');

        bar.save(function(error)
        {
            if(error)
            {
                console.error('Error:', error.stack);
            } // end if

            console.log('Saved the bar user.');

            ns.User.find({ gender: "Female" }, function(error, users)
            {
                if(error)
                {
                    console.error('Error:', error.stack);
                } // end if

                console.log('Female Users: %j', users);
            });

            ns.User.findOne({ gender: "Female" }, function(error, user)
            {
                if(error)
                {
                    console.error('Error:', error.stack);
                } // end if

                console.log('Just one female User: %j', user);
            });
        });
    });

    console.log('Finsihed NEDB Example');
});

//----------------------------------------------------------------------------------------------------------------------