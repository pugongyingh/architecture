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
  var dir = "./public/img/users_directory/"+email;
  fs.ensureDir(dir, function(err) {
    if(err){
      console.log(err);
    }

  });

connection.query("SELECT profile_image FROM users WHERE email = '"+email+"';", function(err, results, fields){
  console.log(results);
var profile_image = results[0].profile_image;
console.log(profile_image);
res.render("settings.ejs", {
  email : email,
  profile_image : profile_image
 });
 });
});


router.post("/save_changes", function(req,res, next){

  console.log(req.body);

  var email = req.session.user;
  var full_name = req.body.postfull_name
  var password = md5(req.body.postpassword);

   connection.query("UPDATE users SET full_name = '"+full_name+"', password = '"+password+"' WHERE email = '"+email+"';", function(err, results, fields){
     if(err){
       console.log(err);
       res.send(err);
     }
     res.send(true);
   });



});

router.post("/upload_profile_image", function(req,res,next){
  if (!req.files) {
    res.send('No files were uploaded.');
    console.log("No files were uploaded");
    return;
  }
  var email =  req.session.user;
  var image = req.files.image;
  var ext = req.body.ext;
  var dir = "./public/img/users_directory/" + email + "/profile_image."+ext;
  console.log(dir);
  image.mv(dir, function(err) {
    if (err) {
      res.status(500).send(err);
    }
    else {
      res.send("Image Uploaded");
    }
})

var profile_image = "../img/users_directory/"+email+"/profile_image."+ext;
connection.query("UPDATE users SET profile_image = '"+profile_image+"' WHERE email = '"+email+"';", function(err, results, fields){
  if(err){
    console.log(err);
  }
  console.log(results);
});

});
module.exports = router;
