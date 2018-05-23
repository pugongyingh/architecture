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

router.get("/:id", function(req, res, next){

  if(!req.session.user){
   return res.redirect("../login");
  }else{

  var email =  req.session.user;
  var id = req.params.id;
  id = id.replace(/%20/g," ");
  var dir = "./public/img/users_directory/"+email+"/"+id;

  connection.query("SELECT project_name, recent FROM projects_data WHERE email = '" + email + "' AND id = '" + id + "';", function(err, results, fields){
    if(results.length > 0){
      console.log(results[0].recent)
      if(results[0].recent != 1){
  connection.query("UPDATE projects_data SET recent=NULL WHERE recent=5 AND email='"+email+"';", function(err, results, fields){
    connection.query("UPDATE projects_data SET recent=5 WHERE recent=4 AND email='"+email+"';", function(err, results, fields){
      connection.query("UPDATE projects_data SET recent=4 WHERE recent=3 AND email='"+email+"';", function(err, results, fields){
        connection.query("UPDATE projects_data SET recent=3 WHERE recent=2 AND email='"+email+"';", function(err, results, fields){
          connection.query("UPDATE projects_data SET recent=2 WHERE recent=1 AND email='"+email+"';", function(err, results, fields) {
            connection.query("UPDATE projects_data SET recent=1 WHERE id='" +id+"' AND email='"+email+"';");
          });
        });

        });

      });

    });
  }
}
});


  var file_names = new Array();
  var header_image = "";
fs.readdir(dir, function(err, files) {
    files.forEach(function(f) {
        var file = f.substr(0, f.lastIndexOf('.'));

        if(file === "header_image"){
          header_image = "../img/users_directory/"+email+"/"+id + "/" +f;
          console.log(header_image);
        }
    });

    connection.query("SELECT project_description, color, project_name FROM projects_data WHERE email = '"+email+"' AND id='"+id+"';", function(err, results, fields){
      if(results[0].project_description === "NULL"){
        var description = "";
      }else{
        description = results[0].project_description;
      }
      var color = results[0].color;
      var project_name = results[0].project_name;
      res.render("workspace", {
        email: email,
        project_name : project_name,
        header_image : header_image,
        description : description,
        color: color,
        project_id: id

       });
    })



});


}
});

router.post("/upload_image", function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  if (!req.files) {
    res.send('No files were uploaded.');
    return;
  }
  var email =  req.session.user;
  var image = req.files.image;
  var project_id = req.body.project_id;
  var ext =  req.body.ext;
  var type = req.body.type;

  if(type === "header_image"){
    var dir = "./public/img/users_directory/" + email + "/"+project_id+"/header_image."+ext;
  }else{
    var dir = "./public/img/users_directory/" + email + "/"+project_id+"/untitled."+ext;
    var i=1;
    while(fs.existsSync(dir)) {

    dir = "./public/img/users_directory/" + email + "/"+project_id+"/untitled("+i+")."+ext;
    i++;
}
console.log(dir);
  }

  image.mv(dir, function(err) {
    if (err) {
      res.status(500).send(err);
    }
    else {

      if(type === "header_image"){

      var header_image_path ="../img/users_directory/" + email + "/"+project_id+"/header_image."+ext;
      connection.query("UPDATE projects_data SET header_image = '"+header_image_path+"' WHERE email = '"+email+"' AND id = '"+project_id+"';", function(err, results, fields){
      res.send('File uploaded!');
      });
}else{
      res.send('File uploaded!');
    }
    }
  });

});


router.post("/delete_image", function(req, res, next){

  console.log(req.body);
  var src = req.body.postsrc;
  src = src.substring(2);
  src = "./public"+src;


  fs.unlink(src, function(err){
    if(err){
      console.log(err);
      return res.send(err);
    }else{
      res.send(true);
    }
  });

});

router.post("/change_image_name", function(req,res, next){
  console.log(req.body);
  var old_name = req.body.postold_name.substring(2);
  var new_image_name = req.body.postnew_image_name;

  var re = /(?:\.([^.]+))?$/;
  var ext = re.exec(old_name)[1];
  console.log(ext);
  var path = old_name.substring(0, old_name.lastIndexOf('/'));
  var path = "./public"+path+"/"+new_image_name+"."+ext;
  if(!fs.existsSync(path)) {

    fs.rename("./public" + old_name, path, function(err) {
      if ( err ) console.log('ERROR: ' + err);
      res.send(".."+path+"/"+new_image_name+"."+ext);
  });
}else{
  res.send("The file already exists!");
}

})


router.post("/project_color", function(req, res, next){
  var email = req.session.user;
  var project_id = req.body.project_id;
  var color= req.body.color;

  connection.query("UPDATE projects_data SET color='"+color+"' WHERE email='"+email+"' AND id='"+project_id+"';",function(err, results, fields){
    if(err){return res.send(err);}else{
      res.send("Color has been changed to "+ color);

    }
  });
})
module.exports = router;
