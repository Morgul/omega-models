//----------------------------------------------------------------------------------------------------------------------
// Brief Description of fields.
//
// @module fields
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');
var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------

function Field(opts)
{
    this.opts = opts;
} // end Field

Field.prototype.setup = function(name, model)
{
    this.opts = this.opts || {};
    this.name = name;
    this.model = model;
    this.value = undefined;

    if(this.opts.key)
    {
        this.model.keys.push(this.name);
    } // end if
};

Field.prototype.getter = function()
{
    var fieldDef = this;
    return function()
    {
        return this.$values[fieldDef.name];
    }; // end get
}; // end getter

Field.prototype.setter = function()
{
    var fieldDef = this;
    return function(value)
    {
        this.$values[fieldDef.name] = value;
    }; // end set
}; // end setter

Field.prototype.prepare = function(value)
{
    //TODO: Understand why this is necessary when validating a type (ex: ChoiceField or ListField)
    this.opts = this.opts || {};

    if(value === undefined)
    {
        value = this.opts.default;
    } // end if

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
        return this.$scratch[fieldDef.name];
    } // end defaultGetter

    return this._getter || defaultGetter;
}; // end getter

PropertyField.prototype.setter = function()
{
    var fieldDef = this;
    function defaultSetter(value)
    {
        this.$scratch[fieldDef.name] = value;
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

function AutoIDField(opts) { this.opts = opts; }
util.inherits(AutoIDField, Field);
AutoIDField.prototype.prepare = function(value)
{
    // We NEVER support setting an AutoID. So the prepared value is always undefined.
    return undefined;
}; // end prepare
AutoIDField.prototype.setter = function(value){};

//----------------------------------------------------------------------------------------------------------------------

//FIXME: How do we actually talk to the backend, to get the highest value? Needs design!
function AutoIncField(opts) { this.opts = opts; }
util.inherits(AutoIncField, Field);
AutoIncField.prototype.setter = function(value){};

//----------------------------------------------------------------------------------------------------------------------

function BinaryField(opts) { this.opts = opts; }
util.inherits(BinaryField, Field);

//----------------------------------------------------------------------------------------------------------------------

function BooleanField(opts) { this.opts = opts; }
util.inherits(BooleanField, Field);
BooleanField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);

    // This coerces to a string, regardless of underlying type.
    value = value.toString();

    // Convert value to a proper boolean, always
    switch(value.toLowerCase())
    {
        case "false": case "f": case "0": case "no": case "unchecked":
        return false;

        default:
            return true;
    } // end switch
};

//----------------------------------------------------------------------------------------------------------------------

function StringField(opts) { this.opts = opts; }
util.inherits(StringField, Field);
StringField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);
    if(value || value === "")
    {
        var max_length = this.opts.max_length;

        if(max_length && value.length > max_length)
        {
            throw new Error('Length of value greater than max_length.');
        } // end if
    } // end if

    if(value)
    {
        // Convert it to a string.
        value += '';
    } // end if

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function ChoiceField(opts) { this.opts = opts; }
util.inherits(ChoiceField, Field);
ChoiceField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);
    var choices = this.opts.choices;

    if(!choices)
    {
        throw new Error('The \'choices\' option is required.');
    } // end if

    if(choices.indexOf(value) == -1)
    {
        throw new Error('Value not a valid choice!');
    } // end if

    // Support limiting to a specific field type.
    if(this.opts.type && !(this.opts.type instanceof Field))
    {
        throw new Error('Value not a field type.')
    } // end if

    // If they specified type, we need to validate it
    if(this.opts.type)
    {
        try
        {
            value = this.opts.type.prepare(value);
        }
        catch(ex)
        {
            throw new Error('Value did not validate as the specified type: \"' + ex.toString() + '\"');
        } // end try/catch
    } // end if

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function DateField(opts) { this.opts = opts; }
util.inherits(DateField, Field);

//----------------------------------------------------------------------------------------------------------------------

function DateTimeField(opts) { this.opts = opts; }
util.inherits(DateTimeField, Field);

//----------------------------------------------------------------------------------------------------------------------

function EmbeddedField(opts) { this.opts = opts; }
util.inherits(EmbeddedField, Field);
EmbeddedField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);
    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function FileField(opts) { this.opts = opts; }
util.inherits(FileField, Field);
FileField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);

    //TODO: Implement `opts.basePath` support.

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function FloatField(opts) { this.opts = opts; }
util.inherits(FloatField, Field);
FloatField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);
    value = parseFloat(value);
    if(isNaN(value))
    {
        throw new Error('Value is not a valid float!')
    } // end if

    // Check min and max
    var min = this.opts.min;
    var max = this.opts.max;

    if(min && value < min)
    {
        throw new Error('Value is less than minimum.')
    } // end if

    if(max && value > max)
    {
        throw new Error('Value is less than maximum.')
    } // end if

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function IntegerField(opts) { this.opts = opts; }
util.inherits(IntegerField, Field);
IntegerField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);
    value = parseInt(value);
    if(isNaN(value))
    {
        throw new Error('Value is not a valid integer!')
    } // end if

    // Check min and max
    var min = this.opts.min;
    var max = this.opts.max;

    if(min && value < min)
    {
        throw new Error('Value is less than minimum.')
    } // end if

    if(max && value > max)
    {
        throw new Error('Value is less than maximum.')
    } // end if

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function ListField(opts) { this.opts = opts; }
util.inherits(ListField, Field);
ListField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);

    // If it's undefined, we make it an empty list.
    value = value || [];

    if(!Array.isArray(value))
    {
        throw new Error('Value is not an array.');
    } // end if

    // Support limiting to a specific field type.
    if(this.opts.type && !(this.opts.type instanceof Field))
    {
        throw new Error('Value not a field type.')
    } // end if

    // If they specified type, we need to validate it
    if(this.opts.type)
    {
        try
        {
            _.each(value, function(val)
            {
                this.opts.type.prepare(val);
            }.bind(this));
        }
        catch(ex)
        {
            throw new Error('Value did not validate as the specified type: \"' + ex.toString() + '\"');
        } // end try/catch
    } // end if

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

function ReferenceField(opts) { this.opts = opts; }
util.inherits(ReferenceField, Field);
ReferenceField.prototype.prepare = function(value)
{
    value = Field.prototype.prepare.call(this, value);

    // Defeat circular references, by importing as needed.
    var Model = require('./model');

    // If we're set to an instance of Model, what we really need is the key.
    if(value instanceof Model)
    {
        value = value.$key;
    } // end if

    //TODO: Implement `opts.filter` support.

    return value;
};

//----------------------------------------------------------------------------------------------------------------------

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
    types: {
        AutoIDField: AutoIDField,
        AutoIncField: AutoIncField,
        BinaryField: BinaryField,
        BooleanField: BooleanField,
        ChoiceField: ChoiceField,
        DateField: DateField,
        EmbeddedField: EmbeddedField,
        FileField: FileField,
        FloatField: FloatField,
        IntegerField: IntegerField,
        ListField: ListField,
        ReferenceField: ReferenceField,
        StringField: StringField
    },
    AutoID: function(opts)
    {
        return new AutoIDField(opts);
    },
    AutoInc: function(opts)
    {
        return new AutoIncField(opts);
    },

    Binary: function(opts)
    {
        return new BinaryField(opts);
    },

    Boolean: function(opts)
    {
        return new BooleanField(opts);
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

    Embedded: function(opts)
    {
        return new EmbeddedField(opts);
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

    String: function(opts)
    {
        return new StringField(opts);
    },

    Property: function(getter, setter)
    {
        return new PropertyField(getter, setter);
    }
}; // end exports

//----------------------------------------------------------------------------------------------------------------------
