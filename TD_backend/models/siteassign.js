const mongoose = require('mongoose');
let sitesSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
});

const SiteAssignSchema = mongoose.Schema({
    taname: {
        type: String,
        required: false
    },
    sites:[sitesSchema] 
    
 
});


const SiteAssign = module.exports = mongoose.model('SiteAssign', SiteAssignSchema);