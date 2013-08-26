//----------------------------------------------------------------------------------------------------------------------
// Brief Description of fields.
//
// @module fields
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');

//----------------------------------------------------------------------------------------------------------------------

function Field() {}

Field.prototype.setup = function(name, backend)
{
    this.name = name;
    this.backend = backend;
};

Field.prototype.get = function()
{
    return this.backend.fields['Field'].get();
}; // end get

Field.prototype.set = function(value)
{
    this.backend.fields['Field'].set(value);
}; // end store

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    Field: Field,
    Auto: function(opts)
    {
        function AutoField() { this.opts = opts; }

        util.inherits(AutoField, Field);

        AutoField.prototype.get = function(){ return this.backend.fields['AutoField'].get(); };
        AutoField.prototype.set = function(value){};

        return new AutoField();
    },

    Binary: function(opts)
    {
        function BinaryField() { this.opts = opts; }

        util.inherits(BinaryField, Field);

        BinaryField.prototype.get = function(){ return this.backend.fields['BinaryField'].get(); };
        BinaryField.prototype.set = function(value){ this.backend.fields['BinaryField'].set(value); };

        return new BinaryField();
    },

    Char: function(opts)
    {
        function CharField() { this.opts = opts; }

        util.inherits(CharField, Field);

        CharField.prototype.get = function(){ return this.backend.fields['CharField'].get(); };
        CharField.prototype.set = function(value){ this.backend.fields['CharField'].set(value); };

        return new CharField();
    },

    Choice: function(opts)
    {
        function ChoiceField() { this.opts = opts; }

        util.inherits(ChoiceField, Field);

        ChoiceField.prototype.get = function(){ return this.backend.fields['ChoiceField'].get(); };
        ChoiceField.prototype.set = function(value){ this.backend.fields['ChoiceField'].set(value); };

        return new ChoiceField();
    },

    Date: function(opts)
    {
        function DateField() { this.opts = opts; }

        util.inherits(DateField, Field);

        DateField.prototype.get = function(){ return this.backend.fields['DateField'].get(); };
        DateField.prototype.set = function(value){ this.backend.fields['DateField'].set(value); };

        return new DateField();
    },

    DateTime: function(opts)
    {
        function DateTimeField() { this.opts = opts; }

        util.inherits(DateTimeField, Field);

        DateTimeField.prototype.get = function(){ return this.backend.fields['DateTimeField'].get(); };
        DateTimeField.prototype.set = function(value){ this.backend.fields['DateTimeField'].set(value); };

        return new DateTimeField();
    },

    File: function(opts)
    {
        function FileField() { this.opts = opts; }

        util.inherits(FileField, Field);

        FileField.prototype.get = function(){ return this.backend.fields['FileField'].get(); };
        FileField.prototype.set = function(value){ this.backend.fields['FileField'].set(value); };

        return new FileField();
    },

    Float: function(opts)
    {
        function FloatField() { this.opts = opts; }

        util.inherits(FloatField, Field);

        FloatField.prototype.get = function(){ return this.backend.fields['FloatField'].get(); };
        FloatField.prototype.set = function(value){ this.backend.fields['FloatField'].set(value); };

        return new FloatField();
    },

    Integer: function(opts)
    {
        function IntegerField() { this.opts = opts; }

        util.inherits(IntegerField, Field);

        IntegerField.prototype.get = function(){ return this.backend.fields['IntegerField'].get(); };
        IntegerField.prototype.set = function(value){ this.backend.fields['IntegerField'].set(value); };

        return new IntegerField();
    },

    List: function(opts)
    {
        function ListField() { this.opts = opts; }

        util.inherits(ListField, Field);

        ListField.prototype.get = function(){ return this.backend.fields['ListField'].get(); };
        ListField.prototype.set = function(value){ this.backend.fields['ListField'].set(value); };

        return new ListField();
    },

    Reference: function(opts)
    {
        function ReferenceField() { this.opts = opts; }

        util.inherits(ReferenceField, Field);

        ReferenceField.prototype.get = function(){ return this.backend.fields['ReferenceField'].get(); };
        ReferenceField.prototype.set = function(value){ this.backend.fields['ReferenceField'].set(value); };

        return new ReferenceField();
    },

    RefList: function(opts)
    {
        function RefListField()
        {
            this.opts = opts;
            this.opts.type = module.exports.Reference({ model: this.opts.model });
        } // end RefListField

        util.inherits(RefListField, Field);

        RefListField.prototype.get = function(){ return this.backend.fields['ListField'].get(); };
        RefListField.prototype.set = function(value){ this.backend.fields['ListField'].set(value); };

        return new RefListField();
    },

    Text: function(opts)
    {
        function TextField() { this.opts = opts; }

        util.inherits(TextField, Field);

        TextField.prototype.get = function(){ return this.backend.fields['TextField'].get(); };
        TextField.prototype.set = function(value){ this.backend.fields['TextField'].set(value); };

        return new TextField();
    },
    Property: function(getter, setter)
    {
        // Just store the getter and (optional) setter
        this.getter = getter;
        this.setter = setter | function(){};
    }
}; // end exports

//----------------------------------------------------------------------------------------------------------------------