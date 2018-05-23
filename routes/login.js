var express = require('express');
var router = express.Router();
var connection = require('.././connection');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var md5 = require('md5');
var bodyParser = require('body-parser');

router.use(cookieParser());
router.use(session({ secret: 'YOUR_SECRET_HERE', resave: false,  saveUninitialized: true }));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', function(req, res, next) {
  var email = req.body.email;
  var password = md5(req.body.password);
  var query = "SELECT full_name FROM users WHERE email='" + email + "'AND password='" + password + "' AND status='verified';";
  connection.query(query, function(err, results, fields){
    if(err){
      console.log("Here is an error" + err);
    }else{

      if(results.length === 1){
        req.session.user = email;
        console.log(req.session.user);
        res.send(true);
        res.end();
      }else{
        res.send(false);
        res.end();
      }
    }
  });

});

module.exports = router;
