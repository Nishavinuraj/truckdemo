var express = require('express');
var router = express.Router();
var async = require('async');
var OrdersSchema = require('../../models/inventory/orders');
var Orders = require('../../models/inventory/orders')
var Orderledgers = require('../../models/inventory/orderledger');
var moment = require('moment');
var nodemailer = require('nodemailer');
var VendorMaster = require('../../models/vendor_master');
var checkLogin = require('../middlewares/checkLogin');
var jwt = require('jsonwebtoken');

// router.get('/', checkLogin(),function (req, res, next) {
//   let limit = req.query.limit ? req.query.limit : 5
//   let offset = req.query.offset ? req.query.offset : 0
//   let searchText = req.query.searchText;
//   if (searchText !== undefined) {
//       var regex = new RegExp(searchText, 'i');
//       let sitematchCondition = {}
//       if (req.user.role == 'ADMIN') {
//           console.log("ADMIN  >>>>>>>");
//           sitematchCondition = {'site': { $regex: regex }};
//       } else {
//           sitematchCondition = { site: req.user.site };
//       }
//       Orders.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}]}).count(function (e, count) {  
//         Orders.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//              res.send({ records: result, totalRecords: count });   
//           });
//       });
//   }
//   else {
//       let matchCondition = {};
//       if (req.user.role == 'ADMIN') {
//           console.log("ADMIN  >>>>>>>");
//           matchCondition = { };
//       } else {
//           matchCondition = { site: req.user.site };
//       }

//       Orders.count(function (e, count) {  
//         Orders.find(matchCondition).sort({ mr_date: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//              res.send({ records: result, totalRecords: count });   
//           });
//       });   
//   }      
   
// });

router.get('/',checkLogin(),function (req, res, next) {
  let limit = req.query.limit ? req.query.limit : 5
  let offset = req.query.offset ? req.query.offset : 0
  let searchText = req.query.searchText;
  if (searchText !== undefined) {
      var regex = new RegExp(searchText, 'i');
      let sitematchCondition = {}
      if (req.user.role == 'ADMIN') {
          sitematchCondition = {'site': { $regex: regex }};
          console.log("ADMIN  >>>>>>>", sitematchCondition) ;
          Orders.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).count(function (e, count) {  
              Orders.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
              res.send({ records: result, totalRecords: count });   
              });
          });

      } else {
          sitematchCondition = { site: req.user.site };
          console.log("ADMIN  >>>>>>>", sitematchCondition) ;
          Orders.find({
              $and:[
                   {$or:[ 
                      { 'vendor': { $regex: regex }}, 
                      { 'department': { $regex: regex }}, 
                      { 'user': { $regex: regex }}
                  ]},
                  sitematchCondition
               ]}).count(function (e, count) {
                  Orders.find({
                      $and:[
                           {$or:[
                              { 'vendor': { $regex: regex }}, 
                              { 'department': { $regex: regex }}, 
                              { 'user': { $regex: regex }}
                           ]},
                           sitematchCondition
                      ]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                          res.send({ records: result, totalRecords: count })              
               });
              });
      }

  }
  else {
      let matchCondition = {};
      if (req.user.role == 'ADMIN') {
          console.log("ADMIN  >>>>>>>");
          matchCondition = { };
      } else {
          matchCondition = { site: req.user.site };
      }

      Orders.count(function (e, count) {  
          Orders.find(matchCondition).sort({ order_date: -1, order_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
             res.send({ records: result, totalRecords: count });   
          });
      });   
  }      
   
});


var sendEmail  = function(vendor,po,order_items){
    //store
    var buff = Buffer.from('ZXN0aW1hdGVqc3RjQGdtYWlsLmNvbTpqc3RjIzEyMw==','base64').toString();
    if(buff.indexOf(":")==-1){
        console.log("email can not be sent");
        return;
    }
    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: buff.split(":")[0],
        pass: buff.split(":")[1]
    }
    });

    var mailOptions = {
    from: 'support@gl.com',
    to: vendor.email,
    subject: 'GL - Purchase Order',
    html: this.getHtmlBody(vendor,po,order_items)
    };

    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent to :'+vendor.email+' Response:' + info.response);
    }
    });
}

getHtmlBody = function(vendor,po,order_items) {
var text =   `
<html>

<body style="background-color:#e2e1e0;font-family: Open Sans, sans-serif;font-size:100%;font-weight:400;line-height:1.4;color:#000;">
<table style="max-width:670px;margin:50px auto 10px;background-color:#fff;padding:50px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);-moz-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24); border-top: solid 10px green;">
<thead>
  <tr>
    <th style="text-align:left;">
    `+vendor.name+`
    <br/>`+vendor.mobile_no+`
    <br/>`+vendor.email+`
    <br/>`+vendor.address+`
    <br/>`+vendor.location+`
    <br/>`+vendor.statename+`

    </th>
    <th style="text-align:right;font-weight:400;">`+new Date()+`</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td style="height:35px;"></td>
  </tr>
  <tr>
    <td colspan="2" style="border: solid 1px #ddd; padding:10px 20px;">
      <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:150px">Order status</span><b style="color:green;font-weight:normal;margin:0">Success</b></p>
      <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Transaction ID</span> `+po._id+`</p>
      <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order amount</span> Rs. `+po.total_amount+`</p>
    </td>
  </tr>
  <tr>
    <td style="height:35px;"></td>
  </tr>
  <tr>
    <td style="height:35px;">Site: `+po.site+`</td>
  </tr>
  <tr>
    <td style="height:35px;">Order number: `+po.order_number+`</td>
  </tr>
  <tr>
    <td colspan="2" style="font-size:20px;padding:30px 15px 0 15px;">Items</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:15px;">`

   /*  */
    po.order_items.forEach(item=>{
        text = text + `
        <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;font-weight:bold;">
        <span style="display:block;font-size:13px;font-weight:normal;">`+item.name+`</span> Qty:`+item.qty+``+item.unit+`&nbsp;<b style="font-size:12px;font-weight:300;"> Unit Price:`+item.price+`(per unit)</b>
         CGST:`+item.cgst+`,&nbsp;
         SGST:`+item.sgst+`,&nbsp;
         IGST:`+item.igst+`,&nbsp;

        <b style="font-size:12px;font-weight:300;"> Final Price: Rs.`+item.total+`</b>
        </p> 
        `
    })
      
  text = text+ `</td>
  </tr>
</tbody>
<tfooter>
  <tr>
    <td colspan="2" style="font-size:14px;padding:50px 15px 0 15px;">
      <strong style="display:block;margin:0 0 10px 0;">Regards</strong> Shri JSTC<br> Nagpur, India<br><br>
      <b>Phone:</b> 1234-567680<br>
      <b>Email:</b> contact@shrijstc.in
    </td>
  </tr>
</tfooter>
</table>
</body>

</html>

`
return text;
}

router.post('/', function (req, res, next) {
    var site = req.body.site;
    var vendor = req.body.vendor;
    var receiptno = req.body.order_number;
    var transtype = req.body.order_type;
    // var orderdate = req.body.order_date;

    // var avoudtDate;
    // avoudtDate = moment(req.body.order_date, 'YYYY-MM-DD').format();
    // var orderdate = moment(req.body.order_date, 'YYYY-MM-DD').format("YYYY-MM-DD");

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;


    var orderdate = req.body.order_date;

    var d = new Orders(req.body);
    d.save(function (err, save) {
        req.body.order_items.forEach(element => {
        var tarefno = transtype +" issued to "+vendor+ " agnst order no "+receiptno;
        var tadebtamt= 0;
        var tacrdtamt= element['total'];
        var tdqty = 0;
        var tcqty = element['qty'];

        element['order_id'] = save['_id'];
        var orderLeg = new Orderledgers(
        {    
            site:site,
            itemname:element['name'],
            avouno:receiptno,
            arefno:tarefno,
            adoctp:transtype,
            adebtamt:tadebtamt,
            acrdtamt:tacrdtamt,
            avoudt:orderdate,
            dqty:tdqty,
            cqty:tcqty,
            user:null,
            order_id: element['order_id']    
        });
        orderLeg.save(function(i_err,i_save) {
            console.log('items saveinfo ', i_err, i_save)
            console.log(element['order_id'])
        })
        }); 
        VendorMaster.find({name:vendor}).then(function(vendors){
            for(var j=0;j<vendors.length;j++){
                let email = vendors[j].email;
                if(email){
                    sendEmail(vendors[j],save,req.body.order_items);
                }
            }});
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Orders.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let order_id = req.query.id
    var site = req.body.site;
    var vendor = req.body.vendor;
    var receiptno = req.body.order_number;
    var transtype = req.body.order_type;
    // var orderdate = req.body.order_date;

    // var avoudtDate;
    // avoudtDate = moment(req.body.order_date, 'YYYY-MM-DD').format();
    // var orderdate = moment(req.body.order_date, 'YYYY-MM-DD').format("YYYY-MM-DD");

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    var orderdate = req.body.order_date;

    Orders.update({_id:order_id},{$set:{    
        order_number: post_data.order_number,
        order_type: post_data.order_type,
        site: post_data.site,
        order_date:post_data.order_date,    
        delivery_date:post_data.delivery_date,
        vendor:post_data.vendor,
        job_type: post_data.job_type,
        department: post_data.department,
        narration: post_data.narration,
        terms_and_conditions: post_data.terms_and_conditions,
        rounded_off: post_data.rounded_off,
        net_amount: post_data.net_amount,
        total_amount: post_data.total_amount,
        round_off_type: post_data.round_off_type,
        user: req.body.user,   
        order_items:post_data.order_items   
    }})
    .then(function(result) {
        console.log('order_id',order_id)
        Orderledgers.deleteMany({ order_id: order_id }, function (err, d_result) {
           req.body.order_items.forEach(element => {
            var tarefno = transtype +" issued to "+vendor+ " agnst order no "+receiptno;
            var tadebtamt= 0;
            var tacrdtamt= element['total'];
            var tdqty = 0;
            var tcqty = element['qty'];
    
            element['order_id'] = order_id;
              var orderLeg = new Orderledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        adebtamt:tadebtamt,
                        acrdtamt:tacrdtamt,
                        avoudt:orderdate,
                        dqty:tdqty,
                        cqty:tcqty,
                        user:null,
                        order_id: element['order_id']    
                                }
                );
              orderLeg.save(function(err,save) {
                console.log('item _updated')
              })
            }); 
        });
        res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});

router.delete ('/:id', function(req, res, next) {
    console.log('Order Delete', req.params.id);
    
    Orders.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        Orderledgers.deleteMany({ order_id: req.params.id }, function (err, result) {
            console.log(result)
            res.send(deleteResult);
        });
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/generate_order_number', function(req, res) {
    // let order_type = req.body.order_type
    // Orders.find({ order_type: order_type }).count(function (e, count) { 
    //     res.send({count: count});
    // })
    console.log(' matchcond', req.body);

    Orders.find(req.body).count(function (e, count) { 
        res.send({count: count});
    })

  });


module.exports = router;