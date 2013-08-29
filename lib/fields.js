//----------------------------------------------------------------------------------------------------------------------
// Brief Description of fields.
//
// @module fields
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');

//----------------------------------------------------------------------------------------------------------------------

function Field(){}

Field.prototype.setup = function(name, model)
{
    this.opts = this.opts || {};
    this.name = name;
    this.model = model;
    this.value = undefined;
};

Field.prototype.getter = function()
{
    var fieldDef = this;
    return function()
    {
        return this._values[fieldDef.name];
    }; // end get
}; // end getter

Field.prototype.setter = function()
{
    var fieldDef = this;
    return function(value)
    {
        this._values[fieldDef.name] = value;
    }; // end set
}; // end setter

Field.prototype.prepare = function(value)
{
    value = value || this.opts.default;

    if(!value && this.opts.required)
    {
        throw new Error('Field \'' + this.name + '\' required.');
    } // end if

    (this.opts.validators || []).forEach(function(validator)
    {
        var results = validator(value);
        if(results !== true)
        {
            throw new Error("Validation failed: " + results);
        } // end if
    });

    return value;
}; // end validate

//----------------------------------------------------------------------------------------------------------------------

function PropertyField(getter, setter)
{
    this._getter = getter;
    this._setter = setter;
} // end PropertyField

util.inherits(PropertyField, Field);

PropertyField.prototype.getter = function()
{
    var fieldDef = this;
    function defaultGetter()
    {
        return this._props[fieldDef.name];
    } // end defaultGetter

    return this._getter || defaultGetter;
}; // end getter

PropertyField.prototype.setter = function()
{
    var fieldDef = this;
    function defaultSetter(value)
    {
        this._props[fieldDef.name] = value;
    } // end defaultSetter

    // We only every use the default setter if we're using the default getter.
    if(!this._getter && !this._setter)
    {
        return defaultSetter;
    } // end if

    return this._setter || function(){};
}; // end setter

PropertyField.prototype.prepare = function(value){};

//----------------------------------------------------------------------------------------------------------------------

function AutoField(opts) { this.opts = opts; }
util.inherits(AutoField, Field);
AutoField.prototype.setter = function(value){};

function BinaryField(opts) { this.opts = opts; }
util.inherits(BinaryField, Field);

function TextField(opts) { this.opts = opts; }
util.inherits(TextField, Field);

function CharField(opts) { this.opts = opts; }
util.inherits(CharField, Field);

function ChoiceField(opts) { this.opts = opts; }
util.inherits(ChoiceField, Field);

function DateField(opts) { this.opts = opts; }
util.inherits(DateField, Field);

function DateTimeField(opts) { this.opts = opts; }
util.inherits(DateTimeField, Field);

function FileField(opts) { this.opts = opts; }
util.inherits(FileField, Field);

function FloatField(opts) { this.opts = opts; }
util.inherits(FloatField, Field);

function IntegerField(opts) { this.opts = opts; }
util.inherits(IntegerField, Field);

function ListField(opts) { this.opts = opts; }
util.inherits(ListField, Field);

function ReferenceField(opts) { this.opts = opts; }
util.inherits(ReferenceField, Field);


function RefListField(opts)
{
    this.opts = opts;
    this.opts.type = module.exports.Reference({ model: this.opts.model });
} // end RefListField

util.inherits(RefListField, Field);

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    Field: Field,
    PropertyField: PropertyField,
    Auto: function(opts)
    {
        return new AutoField(opts);
    },

    Binary: function(opts)
    {
        return new BinaryField(opts);
    },

    Char: function(opts)
    {
        return new CharField(opts);
    },

    Choice: function(opts)
    {
        return new ChoiceField(opts);
    },

    Date: function(opts)
    {
        return new DateField(opts);
    },

    DateTime: function(opts)
    {
        return new DateTimeField(opts);
    },

    File: function(opts)
    {
        return new FileField(opts);
    },

    Float: function(opts)
    {
        return new FloatField(opts);
    },

    Integer: function(opts)
    {
        return new IntegerField(opts);
    },

    List: function(opts)
    {
        return new ListField(opts);
    },

    Reference: function(opts)
    {
        return new ReferenceField(opts);
    },

    RefList: function(opts)
    {
        return new RefListField(opts);
    },

    Text: function(opts)
    {
        return new TextField(opts);
    },

    Property: function(getter, setter)
    {
        return new PropertyField(getter, setter);
    }
}; // end exports

//----------------------------------------------------------------------------------------------------------------------