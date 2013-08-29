// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the fields.spec.js module.
//
// @module fields.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var assert = require("assert");

var Field = require('../lib/fields').Field;

// ---------------------------------------------------------------------------------------------------------------------

describe('Fields', function()
{

    it('stores the name of the field', function()
    {
        var field = new Field();
        field.setup("test", {ns:{}});
        assert.equal(field.name, "test");
    });

    it('creates getters and setters', function()
    {
        var constructor = function(){ this._values = {}; };
        constructor.ns = {};

        var field = new Field();
        field.setup("test", constructor);

        Object.defineProperty(constructor.prototype, "test", {
            get: field.getter(),
            set: field.setter()
        });

        var testInst = new constructor();
        testInst.test = "Foo!";

        assert.equal(testInst.test, "Foo!");
    });

    describe('#prepare()', function()
    {
        it('throws an error if required, and not set.', function()
        {
            var field = new Field();
            field.opts = { required: true };
            field.setup("test", {ns:{}});

            assert.throws(function()
            {
                field.prepare(undefined);
            }, Error);
        });

        it('does not throws an error if required, and set.', function()
        {
            var field = new Field();
            field.opts = { required: true };
            field.setup("test", {ns:{}});

            assert.doesNotThrow(function()
            {
                field.prepare("Foo!");
            });
        });

        it('throws an error if validators do not return true.', function()
        {
            var field = new Field();
            field.opts = { validators: [function(){ return ""; }] };
            field.setup("test", {ns:{}});

            assert.throws(function()
            {
                field.prepare(undefined);
            }, Error);
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------