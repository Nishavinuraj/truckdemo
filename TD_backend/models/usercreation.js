const mongoose = require('mongoose');
let permissionsSchema = mongoose.Schema({
    pname: {
        type: String,
        required: false
    },
    
    //dashboard menu
       maindashboard: {
        type: String,
        required: false
    },
    dashboardreports: {
        type: String,
        required: false
    },



    //main traffic agent
    maintrafficagent: {
        type: String,
        required: false
    },
    tm: {
        type: String,
        required: false
    },ta: {
        type: String,
        required: false
    },
    
    
    //main site management
    
    
    mainsitemanagement: {
        type: String,
        required: false
    },
    ls: {
        type: String,
        required: false
    },
    be: {
        type: String,
        required: false
    },
    ere: {
        type: String,
        required: false
    },
    pod: {
        type: String,
        required: false
    },
    pri: {
        type: String,
        required: false
    },
    r: {
        type: String,
        required: false
    },lr: {
        type: String,
        required: false
    },
    
    // main tyre management
    maintyremanagement: {
        type: String,
        required: false
    },
    tmm: {
        type: String,
        required: false
    },
    ntf: {
        type: String,
        required: false
    },
    tinsp: {
        type: String,
        required: false
    },
    tmreports: {
        type: String,
        required: false
    },

    // main inventory


    maininventory: {
        type: String,
        required: false
    },
    
    
    pur: {
        type: String,
        required: false
    },
    // job: {
    //     type: String,
    //     required: false
    // },
    mat: {
        type: String,
        required: false
    },mati: {
        type: String,
        required: false
    },scrap: {
        type: String,
        required: false
    },
    // mrr: {
    //     type: String,
    //     required: false
    // },mir: {
    //     type: String,
    //     required: false
    // }
    // ,
    
    inventoryreports: {
        type: String,
        required: false
    }

// main accounts

,
    mainaccounts: {
        type: String,
        required: false
    },
    accounttransactions: {
        type: String,
        required: false
    },dailycashreports: {
        type: String,
        required: false
    },monthlyoutstanding: {
        type: String,
        required: false
    },trialbalance: {
        type: String,
        required: false
    },balancesheet: {
        type: String,
        required: false
    },
    // deb: {
    //     type: String,
    //     required: false
    // },cre: {
    //     type: String,
    //     required: false
    // },
    acc: {
        type: String,
        required: false
    }
    
    //main driver
    
    ,maindriver: {
        type: String,
        required: false
    }
    
// admin priviliges
    ,adminpriviliges: {
        type: String,
        required: false
    },lat: {
        type: String,
        required: false
    },long: {
        type: String,
        required: false
    }
    
    
    

});












const UsercreationSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },password: {
        type: String,
        required: false
    },tpassword: {
        type: String,
        required: false
    },site: {
        type: String,
        required: false
    },role: {
        type: String,
        required: false
    },
    permissions:[permissionsSchema] 
    
 
});


const Usercreation = module.exports = mongoose.model('Usercreation', UsercreationSchema);