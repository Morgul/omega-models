// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the models.spec.js module.
//
// @module models.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var om = require('../omega-models');
var fields = require('../lib/fields');
var MockBackend = require('../lib/backends/mock');
var assert = require("assert");

// ---------------------------------------------------------------------------------------------------------------------

describe('Namespace', function()
{

    it('can be created', function()
    {
        var ns = om.namespace('test');
		assert(ns.constructor.name == "Namespace");
    });

    it('can be retrieved once created', function()
    {
        var ns = om.namespace('test');
        var ns1 = om.namespace('test');
        assert(ns === ns1);
    });

    it('has a name property', function()
    {
        var ns = om.namespace('test');
        assert(ns.name == "test");
    });

    describe('#define()', function()
    {
        it('takes a model definition', function()
        {
            var ns = om.namespace('test');
            assert.doesNotThrow(function(){ns.define({});});
        });

        it('throws when the same model is defined twice', function()
        {
            var ns = om.namespace('throws');
            assert.throws(
                function()
                {
                    ns.define({
                        Test: {
                            foo: fields.Field()
                        }
                    });

                    ns.define({
                        Test: {
                            foo: fields.Field()
                        }
                    });
                },
                Error,
                "Expected error not thrown."
            );
        });

        it('creates model instances', function()
        {
            var ns = om.namespace('test');
            ns.define({
                Test: {
                    foo: fields.Field()
                }
            });

            assert(ns.models.Test !== undefined, "model is not defined.");
        });

        it('creates properties for model instances', function()
        {
            var ns = om.namespace('test2');
            ns.define({
                Test: {
                    foo: fields.Field()
                }
            });

            assert(ns.Test !== undefined, "property is not defined.");
        });

        it('returns the namespace instance', function()
        {
            var ns = om.namespace('test');
            var ns1 = ns.define({});
            assert(ns === ns1);
        });
    });

    describe('#backend()', function()
    {
        it('takes a backend module', function()
        {
            var ns = om.namespace('test-backend');
            assert.doesNotThrow(function(){ns.backend(new MockBackend());});
        });

        it('returns the namespace instance', function()
        {
            var ns = om.namespace('test');
            var ns1 = ns.backend(new MockBackend());
            assert(ns === ns1);
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
