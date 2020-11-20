var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var index = require('./routes/index');
var users = require('./routes/users');
var dashboard = require('./routes/dashboard');
var reports = require('./routes/reports');
var reportsinv = require('./routes/reportsinv');
var accounts = require('./routes/accounts');
var estimates = require('./routes/estimates');
var itemsl = require('./routes/itemsl');
var ordersl = require('./routes/ordersl');
var scrapsl = require('./routes/scrapsl');

var trucksl = require('./routes/trucksl');
var bankbalance = require('./routes/bankbalance');
var site_management = require('./routes/site_management');
var billing = require('./routes/billing');
var plant_rate = require('./routes/plant_rate');
var meta = require('./routes/meta/meta');
var seed = require('./routes/seed');
var gpsratemaster = require('./routes/gps_rate_masters');
var site_expense = require('./routes/site_expense');
var rates = require('./routes/rates');
var fleets_target = require('./routes/fleets_target');
var user_creation = require('./routes/user_creation');
var import_files = require('./routes/import_files');
var plants_truck_position = require('./routes/plants_truck_position');
var login = require('./routes/login');

// traffic agent
var site_assign_to_traffic_agents = require('./routes/site_assign_to_traffic_agents');
var vehicle_monitoring = require('./routes/vehicle_monitoring');
var accounts_transaction = require('./routes/accounts_transaction');
var attach_documents = require('./routes/attach_documents');
var traffic_agent = require('./routes/traffic_agent');
var trafficagent_master = require('./routes/traffic-agent/trafficagent-master');


// accounts
var accounts_dataentry = require('./routes/accounts/accounts-dataentry');


var tyre_maintenance = require('./routes/tyre_maintenance');
var truck_maintenance = require('./routes/truck_maintenance');

var vendor_master = require('./routes/vendor_master');
var job_card = require('./routes/job_card');
var plant_rates_list = require('./routes/plant_rates_list');
var siteaddress = require('./routes/siteaddress');

// site management
var billty_dataentry = require('./routes/site-management/billty-dataentry')
var billty_print = require('./routes/billty_print');

// admin priviliges
var admin_master = require('./routes/admin-privileges/admin-master');
var tyre_ratelist = require('./routes/admin-privileges/tyre-ratelist');
var site_petrolpump = require('./routes/admin-privileges/site-petrolpump');
var site_destinationkms = require('./routes/admin-privileges/site-destinationkms');
var truck_average = require('./routes/admin-privileges/truck-average');
var tyre_target_master = require('./routes/admin-privileges/tyre-target-master');

var accounts_master = require('./routes/admin-privileges/accounts-master');
var accounts_category = require('./routes/admin-privileges/accounts-category');

var site_profile = require('./routes/admin-privileges/site-profile');
var broker_master = require('./routes/admin-privileges/broker-master');
var consignee_master = require('./routes/admin-privileges/consignee-master');
var diesal_ratemaster = require('./routes/admin-privileges/diesal-ratemaster');

// tyre Management
var tyre_master = require('./routes/tyre-management/tyre-master');
var truck_inspection = require('./routes/tyre-management/truck_inspection');
var tyre_company_master = require('./routes/tyre-management/tyre-company-master');
var observation_and_recommendation = require('./routes/tyre-management/observation-and-recommendation');

// inventory
var inventory_units = require('./routes/inventory/units');
var item_master = require('./routes/inventory/items-master');
var orders = require('./routes/inventory/orders');
var material_receipt = require('./routes/inventory/material-receipt');
var material_issue = require('./routes/inventory/material-issue');
var scrap_sale = require('./routes/inventory/scrap-sale');
// maintenance
var engine_typemaster = require('./routes/maintenance/engine-typemaster');
var job_workmaster = require('./routes/maintenance/job-workmaster');
var job_work = require('./routes/maintenance/job-work');
var reminders = require('./routes/maintenance/reminders');
// site management
var vehicle_master = require('./routes/site-management/vehicle-master');
// 
// estimates

var app = express();
console.log('cors');
//here is the magic
app.use(cors());


/* app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
}); */

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
// app.set('view engine', 'ejs');
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/api/dashboard', dashboard);
app.use('/api/reports', reports);
app.use('/api/reportsinv', reportsinv);
app.use('/api/bankbalance', bankbalance);
app.use('/api/accounts', accounts);
app.use('/api/itemsl', itemsl);
app.use('/api/ordersl', ordersl);
app.use('/api/scrapsl', scrapsl);
app.use('/api/estimates', estimates);
app.use('/api/trucksl', trucksl);
app.use('/api/site_management', site_management);
app.use('/api/meta', meta);
app.use('/api/seed', seed);
app.use('/api/plant_rate', plant_rate);
app.use('/api/billing', billing);
app.use('/api/gps_rate_master', gpsratemaster);
app.use('/api/site_expense', site_expense);
app.use('/api/rates', rates);
app.use('/api/fleets_target', fleets_target);
app.use('/api/user_creation', user_creation);
app.use('/api/login', login);
app.use('/api/import', import_files);
app.use('/api/plants_truck_position', plants_truck_position);
app.use('/api/billty/print', billty_print);
app.use('/api/site_assign_to_traffic_agents', site_assign_to_traffic_agents);
app.use('/api/vehicle_monitoring', vehicle_monitoring);
app.use('/api/accounts_transaction', accounts_transaction);
app.use('/api/attach_documents', attach_documents);
app.use('/api/traffic_agent', traffic_agent);
app.use('/api/tyre_maintenance', tyre_maintenance);
app.use('/api/truck_maintenance', truck_maintenance);
app.use('/api/vendor_master', vendor_master);
app.use('/api/job_card', job_card);
app.use('/api/plant_rates_list', plant_rates_list);
app.use('/api/siteaddress1', siteaddress);
// traffic agent
app.use('/api/traffic-agent/trafficagent-master', trafficagent_master);
// accounts
app.use('/api/accounts/accounts-dataentry', accounts_dataentry);

// tyre-management
app.use('/api/tyre-management/tyre-master', tyre_master);
app.use('/api/tyre-management/truck_inspection', truck_inspection);
app.use('/api/tyre-management/tyre-company-master', tyre_company_master);
app.use('/api/tyre-management/observation-and-recommendation', observation_and_recommendation);


// app.use('/api/tyre-company-master', tyre_company_master);

// site management
app.use('/api/site-management/billty-dataentry', billty_dataentry);

// admin-privileges
app.use('/api/admin-privileges/admin-master', admin_master);
app.use('/api/admin-privileges/tyre-ratelist', tyre_ratelist);
app.use('/api/admin-privileges/site-petrolpump', site_petrolpump);
app.use('/api/admin-privileges/site-destinationkms', site_destinationkms);
app.use('/api/admin-privileges/truck-average', truck_average);
app.use('/api/admin-privileges/tyre-target-master', tyre_target_master);
app.use('/api/admin-privileges/admin-master', admin_master);

app.use('/api/admin-privileges/site-profile', site_profile);
app.use('/api/admin-privileges/accounts-master', accounts_master);
app.use('/api/admin-privileges/accounts-category', accounts_category);

app.use('/api/admin-privileges/broker-master', broker_master);
app.use('/api/admin-privileges/consignee-master', consignee_master);
app.use('/api/admin-privileges/diesal-ratemaster', diesal_ratemaster);
// inventory
app.use('/api/inventory/units', inventory_units);
app.use('/api/inventory/items-master', item_master);
app.use('/api/inventory/orders', orders);
app.use('/api/inventory/material-receipt', material_receipt);
app.use('/api/inventory/material-issue', material_issue);
app.use('/api/inventory/scrap-sale', scrap_sale);
// estimates
// app.use('/api/inventory/create-estimates', create_estimates);
// maintenance
app.use('/api/maintenance/engine-typemaster', engine_typemaster);
app.use('/api/maintenance/job-workmaster', job_workmaster);
app.use('/api/maintenance/job-work', job_work);
app.use('/api/maintenance/reminders', reminders);

// site management
app.use('/api/site-management/vehicle-master', vehicle_master);


app.use('*', function (req, res) {
  console.log(req, res, 'not found')
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

// var multer = require('multer');
// var upload = multer({ dest: './uploads' });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
