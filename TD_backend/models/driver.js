const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
	companyname:{
		type:String,
		required:false
		},
	idno:{
      type:String,
      required:false
	}

});




const DriverSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    mobile1: {
        type: String,
        required: false
    },
    mobile2: {
        type: String,
        required: false
    },
    presentaddress: {
        type: String,
        required: false
    },
    permenentaddress: {
        type: String,
        required: false
    },
    lno: {
        type: String,
        required: false
    },
    lexdate: {
        type: String,
        required: false
    },
    bankname: {
        type: String,
        required: false
    },
    accountno: {
        type: String,
        required: false
    },
    ifsc: {
        type: String,
        required: false
    },
    branch: {
        type: String,
        required: false
    },
    aadharno: {
        type: String,
        required: false
    },
    refby: {
        type: String,
        required: false
    },

    
    
	multidest:[multidestSchema]
});


const Driver = module.exports = mongoose.model('Driver', DriverSchema);