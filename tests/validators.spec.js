// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the validators.spec.js module.
//
// @module validators.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var validators = require('../lib/validators');
var assert = require("assert");

// ---------------------------------------------------------------------------------------------------------------------

describe('Validators', function()
{

    describe('#isEmail()', function()
    {
        it('should return true for a valid email', function()
        {
            assert(validators.isEmail("foo@bar.com"), "Returned false for a valid email.");
        });

        it('should return false for an invalid email', function()
        {
            assert(validators.isEmail("foobar") == false, "Returned true for an invalid email.");
        });
    });

    describe('#isIPv4()', function()
    {
        it('should return true for a valid ipv4 address', function()
        {
            assert(validators.isIPv4("127.0.0.1"), "Returned false for a valid ipv4 address.");
        });

        it('should return false for an invalid ipv4 address', function()
        {
            assert(validators.isIPv4("999.999.999.999") == false, "Returned true for an invalid ipv4 address.");
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------