var express = require('express');
var router = express.Router();
var connection = require('.././connection');
var path = require('path');
var fs = require('fs-extra');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var params = require('express-params');
var fileUpload = require('express-fileupload');
var md5 = require('md5');
router.use(fileUpload());

router.use(cookieParser());
router.use(session({ secret: 'YOUR_SECRET_HERE', resave: false,  saveUninitialized: false }));
router.use(bodyParser.urlencoded({extended: true, limit: '50000mb'}));
router.use(bodyParser.json({limit:'50000mb'}));

/* GET home page. */
router.get('/', function(req, res){

  if(!req.session.user){
    return res.redirect("../login");
  }
  var email = req.session.user;
  connection.query("SELECT portfolio_header, portfolio_color FROM users WHERE email = '"+email+"';", function(err, results, fields){
  var portfolio_header = results[0].portfolio_header;
  var color = results[0].portfolio_color;
  res.render("portfolio", {
    email : email,
    portfolio_header : portfolio_header,
    color : color
   });
   });
});


router.get("/get_list", function(req, res, next){
  var email = req.session.user;


  connection.query("SELECT * FROM projects_data WHERE email = '"+email+"' AND shared_portfolio='yes';", function(err, results, fields){
    if(err){
      console.log(err);
    }else{
      var list = new Array();
      console.log(results.length);
      for(var i=0; i < results.length; i++){
        var empty = new Array();
        list.push(empty);
        list[i].push(results[i].email);
        list[i].push(results[i].project_name);
        list[i].push(results[i].project_description);
        list[i].push(results[i].header_image);
        list[i].push(results[i].id);
      if((i+1) === results.length){
        res.send(list);
      }
      }

    }
  })

});

router.post("/upload_header_image", function(req,res,next){
  if (!req.files) {
    res.send('No files were uploaded.');
    console.log("No files were uploaded");
    return;
  }
  console.log("at tje ;eaes cadf asf");
  var email =  req.session.user;
  var image = req.files.image;
  var ext = req.body.ext;
  var dir = "./public/img/users_directory/" + email + "/portfolio_header."+ext;
  console.log(dir);
  image.mv(dir, function(err) {
    if (err) {
      res.status(500).send(err);
    }
    else {
      res.send("Image Uploaded");
    }
});

var portfolio_header = "../img/users_directory/"+email+"/portfolio_header."+ext;
connection.query("UPDATE users SET portfolio_header = '"+portfolio_header+"' WHERE email = '"+email+"';", function(err, results, fields){
  if(err){
    console.log(err);
  }
  console.log(results);
});

});


router.post("/portfolio_color", function(req, res, next){
  var email = req.session.user;
  var color= req.body.color;

  connection.query("UPDATE users SET portfolio_color='"+color+"' WHERE email='"+email+"';",function(err, results, fields){
    if(err){
      return res.send(err);
    }else{
      res.send("color change to " + color);
    }
  });
})

module.exports = router;
