var express = require('express');
var router = express.Router();
var connection = require('.././connection');
var path = require('path');
var fs = require('fs-extra');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var params = require('express-params');
router.use(cookieParser());
router.use(session({ secret: 'YOUR_SECRET_HERE', resave: false,  saveUninitialized: true }));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
router.get('/', function(req, res){

  if(!req.session.user){
    return res.redirect("../login");
  }
  var email = req.session.user;


  var dir = './public/img/users_directory/'+ email;
  fs.ensureDir(dir, function(err) {
    if(err){
      console.log(err);
    }

  });
res.render("home", {email : email });
});


router.post("/projects_list", function(req, res, next){
  var email = req.session.user;
  var projects_list = new Array();
  connection.query("SELECT project_name, project_description, header_image, recent, id FROM projects_data WHERE email = '"+email+"' ORDER BY project_name;",function(err, results, fields){

    for(var i=0; i < results.length; i++){
      var empty =  new Array();
      projects_list.push(empty);
      projects_list[i].push(results[i].project_name);
      projects_list[i].push(results[i].project_description);
      projects_list[i].push(results[i].header_image);
      projects_list[i].push(results[i].recent);
      projects_list[i].push(results[i].id);
    }

    res.send(projects_list)
})
})

router.post("/", function(req, res, next){
  var email = req.session.user;
  console.log(req.body);
  var project_name =  req.body.postproject_name;
  var insert = req.body.postenter;


  //checking if project exists
  connection.query("SELECT project_name, recent FROM projects_data WHERE email = '" + email + "' AND project_name = '" + project_name + "';", function(err, results, fields){
    if(results.length > 0){

      res.send(false);
      res.end();
    }else if(insert === 'false'){
      res.send(true);
      res.end();
    }else{
      //inserting the project name
      connection.query("INSERT INTO projects_data (email, project_name, project_description) VALUES ('" + email + "','" + project_name+ "','NULL');", function (err, results, fields) {
      if(err){console.log(err);}
      var project_id = results.insertId;
      //creating the project directory
      var dir = "./public/img/users_directory/"+ email + "/" + project_id;
      fs.ensureDir(dir, function(err) {
        if(err){
          console.log(err);
        }
        res.send(""+project_id);
        res.end();
      });



    });

    }

  });



});

router.post("/change_name", function(req, res, err){
  var email = req.session.user;
  var project_name = req.body.project_name;
  var project_id = req.body.project_id;

  connection.query("UPDATE projects_data SET project_name='"+project_name+"' WHERE id='"+project_id+"';", function(err, results, fields){
    if(err){ console.log(err); return res.send(err);}else{
      res.send("Name updated to : " + project_name);
    }

  });
})


router.post("/share_to_friend", function(req, res, next){
  var email_of_user = req.session.user;
  var friend_email = req.body.friend_email;
  var project_name = req.body.project_name;
  if(email_of_user === friend_email){
    return res.send("Its your Email ID!");
  }
  connection.query("SELECT friend_email FROM friends WHERE email = '"+email_of_user+"';", function(err, results, fields){
    if(err){
      console.log(err);
    }
    if(results.length < 1){
      return res.send("This person is not your Friend");
    }else{
     connection.query("SELECT * FROM projects_data WHERE email='"+email_of_user+"' AND project_name='"+project_name+"';", function(err, results, fields){
       if(err){ console.log(err); return res.send(err); }else{
        var header_image =  results[0].header_image;
        var project_id =  results[0].id;
        connection.query("INSERT INTO shared (email, project_id, shared_by, project_name, header_image) VALUES ('"+friend_email+"', '"+project_id+"', '"+email_of_user+"', '"+project_name+"', '"+header_image+"');", function(err, results, fields){

          if(err){ console.log(err); return res.send(err)}else{
            res.send("Project has been shared to the Email ID " + friend_email);
          }

        })
       }
     })
    }
  });
})

router.get("/shared_projects", function(req, res, next){
  var email = req.session.user;

  connection.query("SELECT * FROM shared WHERE email='"+email+"';", function(err, results, fields){
    if(err){console.log(err); return res.send(err)}else{
      if(results.length < 1){
        return res.send(true);
      }else{
        var shared_projects = new Array();






        for(var i=0; i < results.length; i++){


          var project_id = results[i].project_id;
          var shared_by =  results[i].shared_by;
          var header_image = results[i].header_image;
          var project_name = results[i].project_name;

          var empty = new Array();
          shared_projects.push(empty);
          shared_projects[i].push(project_id);
          shared_projects[i].push(shared_by);
          shared_projects[i].push(header_image);
          shared_projects[i].push(project_name);
        }
        console.log(shared_projects);
      res.send(shared_projects);
      }
    }
  })
})

router.post("/list_likes", function(req, res, next){
  var email = req.session.user;
  var project_id = req.body.project_id;
  console.log(req.body);
  connection.query("SELECT * FROM likes WHERE email='"+email+"' AND project_id='"+project_id+"';", function(err, results, fields){
    if(err){console.log(err); return res.send(err);}else{
      var list_likes = [];
      if(results.length > 0){

        for(var i=0; i < results.length; i++){
          list_likes.push([]);
          list_likes[i].push(results[i].liked_by);
          list_likes[i].push(results[i].profile_image);
          if((i+1) === results.length){
            res.send(list_likes);
          }

        }
      }else{
        res.send(list_likes);
      }
    }
  })
})
module.exports = router;
