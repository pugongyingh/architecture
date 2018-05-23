var express = require('express');
var router = express.Router();
var connection = require('.././connection');
var path = require('path');
var fs = require('fs-extra');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var params = require('express-params');
var Promise = require("bluebird");
router.use(cookieParser());
router.use(session({ secret: 'YOUR_SECRET_HERE', resave: false,  saveUninitialized: true }));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
router.get('/', function(req, res){

  if(!req.session.user){
    return res.redirect("../login");
  }
  res.render("hub");
});

router.get("/get_list", function(req, res, next){
  var email = req.session.user;
  connection.query("SELECT friend_email FROM friends WHERE email ='"+email+"';", function(err, results, fields){
    if(err){
      console.log(err);
    }else{

  connection.query("SELECT * FROM projects_data WHERE email IN ('"+results.map(function(elem){ return elem.friend_email; }).join("','")+"') AND shared_hub='yes' ORDER BY date DESC;", function(err, results, fields){
    if(err){
      console.log(err);
    }else{
      function get_like_status(email, project_id) {
    return new Promise(function( res, rej ) {
        var query = "SELECT email FROM likes WHERE email_liked_by='" +
                    email + "' AND project_id='" + project_id + "';"

        connection.query(query, function(err, results, fields) {
            if (err) {
                rej(err);
            } else {
                if(results.length > 0){
                  res("yes");
                }else{
                  res("no");
                }
            }
        });
    });
}

var promises = [];
var full_list = [];
var list = results.map(function(item, index) {
    var arr = [
        item.email,
        item.project_name,
        item.project_description,
        item.header_image,
        item.id
    ]
    promises.push(
        get_like_status(email, item.id).then(function(res) {
            console.log(res);
            arr.push(res);
            full_list.push(arr);
            return arr;
        })
    );
})

Promise.all( promises ).then(function() {
  console.log(full_list);
    res.send(full_list);
}).catch(function( err ) {
    res.send('epic fail!')
})

    }
  })
}
});
})

router.post("/likes", function(req, res, next){
  var email_liked_by = req.session.user;
  var project_id = req.body.project_id;
  var type = req.body.type;
  var owner_of_the_project = req.body.owner_of_the_project;

  if(type === "like"){
    connection.query("SELECT * FROM users WHERE email='"+email_liked_by+"';", function(err, results, fields){
      if(err){console.log(err); return res.send("Please try again later!")}else{
        var liked_by = results[0].full_name;
        var profile_image = results[0].profile_image;
        connection.query("INSERT INTO likes (email, project_id, liked_by, profile_image, email_liked_by) VALUES ('"+owner_of_the_project+"', '"+project_id+"', '"+liked_by+"', '"+profile_image+"', '"+email_liked_by+"');",function(err, results, fields){
          if(err){console.log(err); return res.send("There was an error. Please try again later!")}else{
            res.send("The project has been liked!");
          }
        });

      }

    })
  }else{
    connection.query("DELETE FROM likes WHERE email_liked_by='"+email_liked_by+"' AND project_id='"+project_id+"';", function(err, results, fields){
      if(err){console.log(err); return res.send("Please try again later!")}else{
        res.send("The project has been disliked");
      }

    })
  }
})


module.exports = router;
