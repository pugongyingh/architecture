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
var q = require("q");
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
res.render("friends", {
  email : email
 });
});

router.post('/add_friend', function(req, res){

  if(!req.session.user){
    res.redirect("../login");
  }
  var request_from = req.session.user;
  var email = req.body.postemail;
  if(email === request_from){
    return res.send("You can't be a friend of yourself!");
  }
  console.log(email + "checking" + request_from);
  connection.query("SELECT friend_email FROM friends WHERE email = '"+email+"';", function(err, results, fields){
    if(err){
      console.log(err);
    }
    if(results.length > 0){
      return res.send("This person is already your Friend");
    }
    connection.query("SELECT from_name FROM friend_requests WHERE email='"+email+"' AND request_from='"+request_from+"';", function(err, results, fields){
      if(err){
        console.log(err);
      }
       if(results.length != 0){
         return res.send("You have already sent the friend request. The person hasn't responded yet!");
       }
       connection.query("SELECT full_name, profile_image FROM users WHERE email='"+request_from+"';", function(err, results, fields){
         if(err){
           console.log(err);
         }
         var full_name = results[0].full_name;
         var profile_image = results[0].profile_image;
         console.log(results);
         connection.query("INSERT INTO friend_requests (email, request_from, from_name, profile_image) VALUES ('"+email+"', '"+request_from+"', '"+full_name+"', '"+profile_image+"');", function(err, results, fields){
           if(err){
             console.log("This is the last error "+err);
           }
           res.send("Friend Request Has been sent");

         });


       })


    });
  });
});

router.get("/friend_requests", function(req, res,next){
  var email = req.session.user;
  var query = "SELECT * FROM friend_requests WHERE email = '"+email+"';";

  connection.query(query, function(err, results, fields){
   if(err){return res.send(err);}
   if(results.length === 0){
     return res.send("");
   }else{
     var friend_requests = new Array();






     for(var i=0; i < results.length; i++){


       var from_name = results[i].from_name;
       var request_from =  results[i].request_from;
       var profile_image = results[i].profile_image;

       var empty = new Array();
       friend_requests.push(empty);
       friend_requests[i].push(from_name);
       friend_requests[i].push(request_from);
       friend_requests[i].push(profile_image);
     }
   res.send(friend_requests);
 }
  })
});

router.post("/accept_reject_friend", function(req, res, next){
  console.log(req.body);

  var email = req.session.user;
  var request_from = req.body.postrequest_from;
  var from_name = req.body.postfrom_name;
  var profile_image = req.body.postprofile_image;
  var type = req.body.posttype;

  if(type === "reject"){
    connection.query("DELETE FROM friend_requests WHERE email='"+email+"' AND request_from='"+request_from+"';", function(err, results, fields){
      if(err){
        console.log(err);
        return res.send(err);
      }else{
        res.send(true);
      }

    })
  }else{
    connection.query("DELETE FROM friend_requests WHERE email='"+email+"' AND request_from='"+request_from+"';", function(err, results, fields){
      if(err){
        console.log(err);
        return res.send(err);
      }else{
        connection.query("INSERT INTO friends (email, friend_email, friend_full_name, profile_image) VALUES ('"+email+"', '"+request_from+"', '"+from_name+"', '"+profile_image+"');", function(err, results, fields){
          if(err){
            console.log(err);
            return res.send(err);
          }else{
            connection.query("SELECT * FROM users WHERE email = '"+email+"';", function(err, results, fields){

              if(err){
                console.log(err);
                return res.send(err);
              }
              var email = request_from;
              var friend_email = results[0].email;
              var friend_full_name = results[0].full_name;
              var profile_image = results[0].profile_image;

              connection.query("INSERT INTO friends (email, friend_email, friend_full_name, profile_image) VALUES ('"+email+"', '"+friend_email+"', '"+friend_full_name+"', '"+profile_image+"');", function(err, results, fields){
                if(err){
                  return res.send(err);
                }else{
                  res.send(true);
                }
              });


            })
          }
        })
      }

    })
  }



})

router.get("/friends_list", function(req, res,next){
  var email = req.session.user;
  var query = "SELECT * FROM friends WHERE email = '"+email+"';";

  connection.query(query, function(err, results, fields){
   if(err){return res.send(err);}
   if(results.length === 0){
     return res.send("");
   }else{
     var friends_list = new Array();






     for(var i=0; i < results.length; i++){


       var friend_full_name = results[i].friend_full_name;
       var profile_image = results[i].profile_image;

       var empty = new Array();
       friends_list.push(empty);
       friends_list[i].push(friend_full_name);
       friends_list[i].push(profile_image);
       if((i+1) === results.length){
         res.send(friends_list);
       }
     }

 }
  })
});


module.exports = router;
