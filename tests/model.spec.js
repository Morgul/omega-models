// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the model.spec.js module.
//
// @module model.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var om = require('../omega-models');
var Model = require('../lib/model');
var MockBackend = require('../lib/backends/mock');
var fields = require('../lib/fields');
var assert = require("assert");

// ---------------------------------------------------------------------------------------------------------------------

describe('Model', function()
{
    var ns = om.namespace('model-test');
    ns.define({
        Test: {
            foo: fields.Char()
        },
        TestProps: {
            foo: fields.Property(
                    function(){ return this.$scratch['foo'] || "Bar!"; },
                    function(val){ this.$scratch['foo'] = val; }
                ),
            bar: fields.Property(function(){ return this.$scratch['foo'] || "Bar!"; })
        },
        TestFuncs: {
            foo: fields.Char(),
            bar: function(){ return this.foo; },
            thisObj: function(){ return this; }
        }
    });
    ns.backend(new MockBackend());

    it('should be created by the namespace', function()
    {
        assert(ns.Test != undefined, "property is not defined.");
    });

    it('should be instantiable', function()
    {
        var test = new ns.Test();
        assert(test != undefined);
    });

    it('instances should be frozen', function()
    {
        var test = new ns.Test();
        test.foo = "Baz!";
        assert(test.foo == "Baz!", "foo could not be set");

        test.bar = "Foo!";
        assert(test.bar === undefined, "nonexistent property bar was set");
    });

    it('should take a dictionary, and populate the fields from it', function()
    {
        var test = new ns.Test({ foo: "Bar!" });
        assert.notEqual(test, undefined);
        assert.equal(test.foo, "Bar!");
    });

    it('should take a dictionary, and only populate valid fields from it', function()
    {
        var test = new ns.Test({ foo: "Bar!", baz: "Foo!" });
        assert.equal(test.foo, "Bar!");
        assert.equal(test.baz, undefined, "Non-field property defined from initial dict");
    });

    it('should allow properties to be defined', function()
    {
        var ns = om.namespace('model-test-props');
        ns.define({
            Test: {
                foo: fields.Property(function(){return "Bar!";})
            }
        });

        assert(ns.Test != undefined, "Test undefined.");

        var test = new ns.Test();
        assert(test.foo != undefined, "property is undefined.");
        assert(test.foo == "Bar!", "property is incorrect.");
    });

    it('should allow functions to be defined', function()
    {
        var ns = om.namespace('model-test-funcs');
        ns.define({
            Test: {
                foo: function(){return "Bar!";}
            }
        });

        assert(ns.Test != undefined, "Test undefined.");

        var test = new ns.Test();
        assert(test.foo() != undefined, "function is undefined.");
        assert(test.foo() == "Bar!", "function is incorrect.");
    });

    it('should allow fields to be set', function()
    {
        var test = new ns.Test({ foo: "Bar!" });
        assert(test != undefined);
        assert(test.foo = "Bar!");
    });

    it('properties should support getters', function()
    {
        var test = new ns.TestProps();
        assert(test.foo == "Bar!");
    });

    it('should not allow properties with only getters to be set', function()
    {
        var ns = om.namespace('model-test-props');
        var test = new ns.Test();
        test.foo = "Bleh!";

        assert(test.foo == "Bar!");
    });

    it('properties should support setters', function()
    {
        var test = new ns.TestProps();
        assert(test.foo == "Bar!");

        test.foo = "Baz!";
        assert(test.foo == "Baz!");
    });

    it('should not allow functions to be modified', function()
    {
        var ns = om.namespace('model-test-funcs');
        var test = new ns.Test();
        test.foo = function(){ return "Bleh!"; };

        assert(test.foo() == "Bar!");
    });

    it('functions should get the proper \'this\' object', function()
    {
        var test = new ns.TestFuncs();

        assert.equal(test.bar(), undefined);

        test.foo = "Baz!";
        assert.equal(test.bar(), "Baz!");
        assert.equal(test.thisObj(), test);
    });

    it('should be able to be stringified as json', function()
    {

        var test = new ns.Test({ foo: "Bar!" });
        var testString = JSON.stringify(test);
        assert.equal(testString, "{\"foo\":\"Bar!\"}", "Model instance did not produce the correct json.");
    });

    it('should not include functions when stringified as json', function()
    {
        var test = new ns.TestFuncs({ foo: "Bar!" });
        var testString = JSON.stringify(test);
        var output = JSON.parse(testString);

        assert(!('bar' in output));
    });

    it('should allow more than one instance to be created', function()
    {
        var test = new ns.Test();
        test.foo = "Bar!";
        assert(test.foo == "Bar!");

        var test2 = new ns.Test();
        test2.foo = "Baz!";
        assert(test.foo == "Bar!");
        assert(test2.foo == "Baz!");
    });

    describe('#save()', function()
    {
        it('calls the default namespace backend with the model instance, and a list of prepared values', function()
        {
            var test = new ns.Test();
            test.foo = "Bar!";

            test.save();
            assert.equal(test, ns.$backend.last.modelInst);
            assert.deepEqual({foo:test.foo}, ns.$backend.last.prepared);
        });

        it('calls the models\'s backend when instance created with one', function()
        {
            var backend = new MockBackend();
            var test = new ns.Test({}, backend);
            test.foo = "Baz!";

            test.save();
            assert.equal(test, backend.last.modelInst);
            assert.deepEqual({foo:test.foo}, backend.last.prepared);
        });
    });

    describe('#remove()', function()
    {
        it('calls the backend, passing the model instance', function()
        {
            var backend = new MockBackend();
            var test = new ns.Test({}, backend);
            test.foo = "Baz!";

            test.remove();
            assert.equal(test, backend.last.removed);
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------