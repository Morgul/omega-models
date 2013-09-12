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
            foo: fields.String()
        },
        TestKey: {
            name: fields.String({ key: true }),
            alt: fields.String({ key: true }),
            foo: fields.String()
        },
        TestAutoKey: {
            name: fields.String()
        },
        TestProps: {
            foo: fields.Property(
                    function() { return this.$scratch.foo || "Bar!"; },
                    function(val) { this.$scratch.foo = val; }
                ),
            bar: fields.Property(function() { return this.$scratch.foo || "Bar!"; })
        },
        TestProps2: {
            first_name: fields.String(),
            last_name: fields.String(),
            full_name: fields.Property(function()
            {
                return this.first_name + " " + this.last_name;
            })

        },
        TestFuncs: {
            foo: fields.String(),
            bar: function(){ return this.foo; },
            thisObj: function(){ return this; }
        }
    });
    ns.backend(new MockBackend());

    it('should be created by the namespace', function()
    {
        assert(ns.Test !== undefined, "property is not defined.");
    });

    it('should be instantiable', function()
    {
        var test = new ns.Test();
        assert(test !== undefined);
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

    it('has a $key property that represents the primary key for the model', function()
    {
        var test = new ns.TestKey({ foo: "Bar!", name: "Test", alt: "More Test!" });
        assert.deepEqual(test.$key, { name: "Test", alt: "More Test!" });
    });

    it('should automatically add a $id field if not fields are marked as `key:true`', function(done)
    {
        var test = new ns.TestAutoKey({ name: "Test" });
        test.save(function(error)
        {
            assert.equal(test.$id, "some_key");
            done();
        });
    });

    it('should allow properties to be defined', function()
    {
        var ns = om.namespace('model-test-props');
        ns.define({
            Test: {
                foo: fields.Property(function(){return "Bar!";})
            }
        });

        assert(ns.Test !== undefined, "Test undefined.");

        var test = new ns.Test();
        assert(test.foo !== undefined, "property is undefined.");
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

        assert(ns.Test !== undefined, "Test undefined.");

        var test = new ns.Test();
        assert(test.foo() !== undefined, "function is undefined.");
        assert(test.foo() == "Bar!", "function is incorrect.");
    });

    it('should allow fields to be set', function()
    {
        var test = new ns.Test({ foo: "Bar!" });
        assert(test !== undefined);
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

    it('should include properties in json', function()
    {

        var test = new ns.TestProps2({ first_name: "Foo", last_name: "Bar" });
        var testString = JSON.stringify(test);
        assert.equal(testString, "{\"first_name\":\"Foo\",\"last_name\":\"Bar\",\"full_name\":\"Foo Bar\"}", "Model instance did not produce the correct json.");
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
        it('calls the default namespace backend with the model instance, and a list of prepared values', function(done)
        {
            var test = new ns.Test();
            test.foo = "Bar!";

            test.save(function(error)
            {
                assert.equal(error, undefined, "Encountered error while saving: " + (error || "").toString());
                assert.deepEqual(ns.$backend.last, {
                    store: {
                        modelInst: test,
                        prepared: {foo: test.foo}
                    }
                });
                done();
            });
        });

        it('calls the models\'s backend when instance created with one', function(done)
        {
            var backend = new MockBackend();
            var test = new ns.Test({}, backend);
            test.foo = "Baz!";

            test.save(function(error)
            {
                assert.equal(error, undefined, "Encountered error while saving: " + (error || "").toString());
                assert.deepEqual(backend.last, {
                    store: {
                        modelInst: test,
                        prepared: {foo: test.foo}
                    }
                });
                done();
            });
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

            assert.deepEqual(backend.last, {
                remove: {
                    modelInst: test
                }
            });
        });
    });

    describe('#find()', function()
    {
        it('calls the backend with the filter and callback', function(done)
        {
            ns.Test.find({foo: 'Bar!'}, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    find: {
                        filter: {foo: 'Bar!'}
                    }
                });

                done();
            });
        });

        it('supports passing a single argument as id', function(done)
        {
            ns.Test.find("some_id", function()
            {
                assert.deepEqual(ns.$backend.last, {
                    find: {
                        filter: {id: "some_id"}
                    }
                });

                done();
            });
        });
    });

    describe('#findOne()', function()
    {
        it('calls the backend with the filter and callback', function(done)
        {
            ns.Test.findOne({foo: 'Bar!'}, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    findOne: {
                        filter: {foo: 'Bar!'}
                    }
                });

                done();
            });
        });

        it('supports passing a single argument as id', function(done)
        {
            ns.Test.findOne("some_id", function()
            {
                assert.deepEqual(ns.$backend.last, {
                    findOne: {
                        filter: {id: "some_id"}
                    }
                });

                done();
            });
        });
    });

    describe('#findOneAndUpdate()', function()
    {
        it('calls the backend with the filter, the update and callback', function(done)
        {
            ns.Test.findOneAndUpdate({foo: 'Bar!'}, {foo: 'Baz!'}, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    findOneAndUpdate: {
                        filter: {foo: 'Bar!'},
                        update: {foo: 'Baz!'}
                    }
                });

                done();
            });
        });

        it('supports passing a single argument as id', function(done)
        {
            ns.Test.findOneAndUpdate("some_id", {foo: 'Baz!'}, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    findOneAndUpdate: {
                        filter: {id: "some_id"},
                        update: {foo: 'Baz!'}
                    }
                });

                done();
            });
        });
    });

    describe('#update()', function()
    {
        it('calls the backend with the filter, the update and callback', function(done)
        {
            ns.Test.update({foo: 'Bar!'}, {foo: 'Baz!'}, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    update: {
                        filter: {foo: 'Bar!'},
                        update: {foo: 'Baz!'}
                    }
                });

                done();
            });
        });

        it('supports passing a single argument as id', function(done)
        {
            ns.Test.update("some_id", {foo: 'Baz!'}, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    update: {
                        filter: {id: "some_id"},
                        update: {foo: 'Baz!'}
                    }
                });

                done();
            });
        });
    });

    describe('#mapReduce()', function()
    {
        it('calls the backend with the map, the reduce and callback', function(done)
        {
            function map(){}
            function reduce(){}

            ns.Test.mapReduce(map, reduce, function()
            {
                assert.deepEqual(ns.$backend.last, {
                    mapReduce: {
                        map: map,
                        reduce: reduce
                    }
                });

                done();
            });
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
