var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('billty_one.ejs', {title: "Welcome."});
});

module.exports = router;
