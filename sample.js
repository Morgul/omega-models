//----------------------------------------------------------------------------------------------------------------------
// Brief Description of sample.js.
//
// @module sample.js
//----------------------------------------------------------------------------------------------------------------------

var om = require('omega-models');
var fields = om.fields;

//----------------------------------------------------------------------------------------------------------------------

module.exports = om.namespace('sample')
	.define({
		User: {
			nick: fields.String({ required: true }),
			email: fields.String({ validators: [ om.validators.isEmail ] }),
			biography: fields.String({ help: "A few words about who you are, and why we care." }),

			first_name: fields.String(),
			middle_name: fields.String(),
			last_name: fields.String(),
			age: fields.Integer({ min: 13, max: 45 }),
			gender: fields.Choice({ choices: ["Male", "Female", "Other"] }),

			avatar: fields.Binary(),

			// Make a property called 'full_name' that isn't synced to the database
			full_name: fields.Property(function()
			{
				var fullname = this.first_name;

				if(this.middle_name)
				{
					fullname += " " + this.middle_name;
				} // end if

				return fullname + " " + this.last_name;
			}),

			// Make a function available called 'incAge'. It will not show up when this is turned into json.
			incAge: function(yearsToAdd)
			{
				this.age += yearsToAdd;
				return this.age;
			}
		},

		Group: {
			name: fields.String({ required: true }),
			active: fields.Boolean({ default: true }),
			users: fields.List({ type: fields.Reference({ model: 'User' }) }),

			// Or...
			altusers: fields.RefList({ model: 'User' })
		},

		SomethingElse: {
			name: fields.String({ required: true }),
			group: fields.Reference({ model: 'Group', filter: { active: true } })
		}
	})
	.backend('nosql', { baseDir: './db' });

//----------------------------------------------------------------------------------------------------------------------
