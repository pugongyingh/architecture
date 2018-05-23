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
var fs = require('fs');
router.use(fileUpload());

router.use(cookieParser());
router.use(session({ secret: 'YOUR_SECRET_HERE', resave: false,  saveUninitialized: false }));
router.use(bodyParser.urlencoded({extended: true, limit: '50000mb'}));
router.use(bodyParser.json({limit:'50000mb'}));

router.get("/:project_id/:email", function(req, res, next){

  if(!req.session.user){
   return res.redirect("../login");
  }else{

  var email =  req.params.email;
  var project_id = req.params.project_id;
  var dir = "./public/img/users_directory/"+email+"/"+project_id;



  var file_names = new Array();
  var header_image = "";
fs.readdir(dir, function(err, files) {
    files.forEach(function(f) {
        var file = f.substr(0, f.lastIndexOf('.'));

        if(file === "header_image"){
          header_image = "../../img/users_directory/"+email+"/"+project_id + "/" +f;
          console.log(header_image);
        }
    });

    connection.query("SELECT * FROM projects_data WHERE email = '"+email+"' AND id='"+project_id+"';", function(err, results, fields){
      if(results[0].project_description === "NULL"){
        var description = "";
      }else{
        description = results[0].project_description;
      }
      var color = results[0].color;
      var project_name = results[0].project_name;
      res.render("show", {
        email: email,
        color : color,
        header_image : header_image,
        description : description,
        project_name: project_name,
        project_id: project_id

       });
    })



});


}
});


//saving Description



module.exports = router;
