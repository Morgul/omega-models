// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the fields.spec.js module.
//
// @module fields.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var assert = require("assert");

var om = require('../omega-models');
var Model = require('../lib/model');
var fields = require('../lib/fields');

// ---------------------------------------------------------------------------------------------------------------------

describe('Fields', function()
{

    it('stores the name of the field', function()
    {
        var field = new fields.Field();
        field.setup("test", {ns:{}});
        assert.equal(field.name, "test");
    });

    it('creates getters and setters', function()
    {
        var constructor = function(){ this.$values = {}; };
        constructor.ns = {};

        var field = new fields.Field();
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
            var field = new fields.Field();
            field.opts = { required: true };
            field.setup("test", {ns:{}});

            assert.throws(function()
            {
                field.prepare(undefined);
            }, Error);
        });

        it('does not throws an error if required, and set.', function()
        {
            var field = new fields.Field();
            field.opts = { required: true };
            field.setup("test", {ns:{}});

            assert.doesNotThrow(function()
            {
                field.prepare("Foo!");
            });
        });

        it('throws an error if validators do not return true.', function()
        {
            var field = new fields.Field();
            field.opts = { validators: [function(){ return ""; }] };
            field.setup("test", {ns:{}});

            assert.throws(function()
            {
                field.prepare(undefined);
            }, Error);
        });
    });

    describe('BooleanField', function()
    {
        it('converts "true", "checked", "yes", "t", "1", 1 to the boolean true', function()
        {
            var boolField = fields.Boolean();
            boolField.setup('test', {});

            assert(boolField.prepare('true'), "Failed to convert \"true\".");
            assert(boolField.prepare('checked'), "Failed to convert \"checked\".");
            assert(boolField.prepare('yes'), "Failed to convert \"yes\".");
            assert(boolField.prepare('t'), "Failed to convert \"t\".");
            assert(boolField.prepare('1'), "Failed to convert \"1\".");
            assert(boolField.prepare(1), "Failed to convert 1.");
        });

        it('converts "false", "unchecked", "no, "f", "0", 0 to the boolean false', function()
        {
            var boolField = fields.Boolean();
            boolField.setup('test', {});

            assert(!boolField.prepare('false'), "Failed to convert \"false\".");
            assert(!boolField.prepare('unchecked'), "Failed to convert \"unchecked\".");
            assert(!boolField.prepare('no'), "Failed to convert \"no\".");
            assert(!boolField.prepare('f'), "Failed to convert \"f\".");
            assert(!boolField.prepare('0'), "Failed to convert \"0\".");
            assert(!boolField.prepare(0), "Failed to convert 0.");
        });
    });

    describe('StringField', function()
    {
        it('converts values to a string', function()
        {
            var stringField = fields.String();
            stringField.setup('test', {});

            assert.equal(stringField.prepare(true), "true");
        });

        it('throws an error if the length is greater than `max_length`', function()
        {
            var stringField = fields.String({ max_length: 3 });
            stringField.setup('test', {});

            assert.throws(function()
            {
                stringField.prepare("too damned long");
            },
            Error);
        });
    });

    describe('ChoiceField', function()
    {
        it('throws an error if `choices` is not defined', function()
        {
            var choiceField = fields.Choice();
            choiceField.setup('test', {});

            assert.throws(function()
            {
                choiceField.prepare("baz");
            },
            Error);
        });

        it('throws an error if value is not one of the possible choices', function()
        {
            var choiceField = fields.Choice({ choices: ['foo', 'bar'] });
            choiceField.setup('test', {});
            assert.throws(function()
            {
                choiceField.prepare("baz");
            },
            Error);
        });
    });

    describe('FloatField', function()
    {
        it('throws an error if value less then `min`', function()
        {
            var floatField = fields.Float({ min: 3.141592 });
            floatField.setup('test', {});

            assert.throws(function()
            {
                floatField.prepare(1.7);
            },
            Error);
        });

        it('throws an error if value is greater than `max`', function()
        {
            var floatField = fields.Float({ max: 3.141592 });
            floatField.setup('test', {});

            assert.throws(function()
            {
                floatField.prepare(3.2);
            },
            Error);
        });

        it('throws an error if value is not a number', function()
        {
            var floatField = fields.Float();
            floatField.setup('test', {});

            assert.throws(function()
            {
                floatField.prepare("eleven!");
            },
            Error);
        });
    });

    describe('IntegerField', function()
    {
        it('throws an error if value less then `min`', function()
        {
            var intField = fields.Integer({ min: 3 });
            intField.setup('test', {});

            assert.throws(function()
            {
                intField.prepare(1);
            },
            Error);
        });

        it('throws an error if value is greater than `max`', function()
        {
            var intField = fields.Integer({ max: 42 });
            intField.setup('test', {});

            assert.throws(function()
            {
                intField.prepare(52);
            },
            Error);
        });

        it('throws an error if value is not a number', function()
        {
            var intField = fields.Integer();
            intField.setup('test', {});

            assert.throws(function()
            {
                intField.prepare("eleven!");
            },
            Error);
        });
    });

    describe('ReferenceField', function()
    {
        it('store a Model instance as it\'s `$key`', function()
        {
            var refField = fields.Reference();
            refField.setup('test', {});

            var ns = om.namespace('test-fields').define({
                Test: {
                    foo: fields.String({ key: true })
                }
            });

            var test = new ns.Test({ foo: "Bar!" });
            assert.deepEqual(refField.prepare(test), {foo: "Bar!"});
        });
    });

    /*
    describe('Field', function()
    {
        it('', function()
        {
            assert(false, "Not implemented yet.");
        });
    });
    */
});

// ---------------------------------------------------------------------------------------------------------------------