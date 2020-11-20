const mongoose = require('mongoose');
const PermissionsSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    value: {
        type: String,
        required: false
    },
});


const Permissions = module.exports = mongoose.model('UserPermissions', PermissionsSchema);
