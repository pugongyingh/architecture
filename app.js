var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var md5 = require('md5');
const uuidV1 = require('uuid/v1');
var connection = require('./connection');
var session = require('express-session');
var params = require('express-params');
var fs = require('fs');
var rimraf = require('rimraf');
var url = require("url");
//routers
var index = require('./routes/index');
var login = require('./routes/login');
var home = require("./routes/home");
var workspace =  require("./routes/workspace");
var settings =  require("./routes/settings");
var friends =  require("./routes/friends");
var hub = require("./routes/hub");
var show = require("./routes/show");
var portfolio = require("./routes/portfolio");


var app = express();
//routers

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({ secret: 'YOUR_SECRET_HERE', resave: false,  saveUninitialized: true }));


app.use('/', index);
app.use('/login', login);
app.use("/login_user", login);
app.use("/home", home);
app.use("/workspace", workspace);
app.use("/settings", settings);
app.use("/friends", friends);
app.use("/hub", hub);
app.use("/show", show);
app.use("/portfolio", portfolio);
// create the connection to database

//mail
const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));



//APIs
//logout APIs
app.get("/check", function(req,res,next){
  res.render("check");
})
app.post("/project_images", function(req, res, next){

  var email = req.body.postemail;
  var project_id = req.body.project_id;
  var dir = "./public/img/users_directory/"+email+"/"+project_id;
  var images = new Array();
  console.log(dir);
  fs.readdir(dir, function(err, files) {
      files.forEach(function(f) {
          var file = f.substr(0, f.lastIndexOf('.'));
          if(file != "header_image"){
          images.push("../img/users_directory/"+email+"/"+project_id+"/"+f);
}
      });
      res.send(images);

});
});
app.get("/reset_password/:id", function(req,res, next){
  var reset_password = req.params.id;
  connection.query("SELECT email FROM users WHERE reset_password ='"+reset_password+"';", function(err, results, fields){
    if(err){console.log(err);
    res.send("err");}else{
      if(results.length < 1){
        res.send("The link doesn't match with the one in our databases!");
      }else{
        res.render("reset_password", {
          reset_password: reset_password
        });
      }
    }
  })
});

app.post("/update_password", function(req, res, next){
  console.log(req.body);
  var password = md5(req.body.postpassword);
  var reset_password =  req.body.postreset_password;

  connection.query("UPDATE users SET password='"+password+"', status='verified', reset_password='NULL' WHERE reset_password='"+reset_password+"';", function(err, results, fields){
    if(err){
      console.log(err);
      return res.send(false);

    }else{
      res.send(true);
    }
  })

})
app.post("/reset_password", function(req,res, next){
  var email = req.body.postemail;
  console.log(email);
  var reset_password =  uuidV1();

  connection.query("UPDATE users SET reset_password='"+reset_password+"' WHERE email='"+email+"';", function(err, results, fields) {
    if(err){console.log(err); return res.send(false);}else{
      let transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: 'sohailakbar499@gmail.com',
              pass: "hobbit123"
          }
      });
      let mailOptions = {
        from: 'Project Hacks', // sender address
        to: email, // list of receivers
        subject: 'Reset Password', // Subject line
        html: "<img style='margin-left:450px; margin-top: 150px;'  height='150px' width='150px' src='http://www.projectchacks.com/favicon.png'/></br><div style='margin-left:450px' width='500px' text-align:'center';><a style='color:black; text-decoration: none;' href='http://www.projectchacks.com:9000/reset_password/"+ reset_password + "'><h3>CLICK TO RESET PASSWORD</h3></a></div>"
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions);
    console.log(mailOptions);
      res.send(true);
    }

  })
})
app.post("/project_description", function(req, res, next){



  var project_description = req.body.postproject_description;
  var project_name = req.body.postproject_name;
  var email = req.session.user;
  console.log(project_description);
  console.log(project_name);
  console.log(email);
  var query = "UPDATE projects_data SET project_description='"+project_description+"' WHERE email = '"+email+"'AND project_name = '"+project_name+"';";

  connection.query(query, function(err, results, fields){
    if(err){res.send(err)}
    res.send(true);
    res.end();
  })
})



app.get("/logout", function(req, res){
  req.session.destroy(function(err) {
  if(err) {
    console.log(err);
  } else {
    res.redirect('/login');
  }
});
})

//check_email post API
app.post("/check_email", function(req,res){
  console.log(req.body.postemail);
  var email = req.body.postemail;

  connection.query("SELECT * FROM users WHERE email = '"+ email +"';", function (err, results, fields) {
  if(results.length != 0){
    res.send(true)
  }else{
    res.send(false)
  }
});
});

//register_user

app.post("/register_user", function(req,res){
  var user_data = req.body;
  var email = user_data.email;
  var full_name = user_data.full_name;
  var password = md5(user_data.password);
  var status = "unverified";
  var verification_code = uuidV1();

  connection.query("INSERT INTO users (email, full_name, password, status, verification_code) VALUES ('" + email + "','" + full_name+ "','" + password + "','" + status + "','" + verification_code + "');", function (err, results, fields) {
  console.log(err);
  console.log(results);
  let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'sohailakbar499@gmail.com',
          pass: "hobbit123"
      }
  });
  let mailOptions = {
    from: 'Project Hacks', // sender address
    to: email, // list of receivers
    subject: 'Verification Code', // Subject line
    html: "<img style='margin-left:450px'  height='150px' width='150px' src='http://www.projectchacks.com/favicon.png'/></br><div style='margin-left:450px' width='500px' text-align:'center';><a style='color:black; text-decoration: none;' href='http://www.projectchacks.com:9000/verify/"+ verification_code + "'><h3 style=''>"+full_name+"</h3></a></br><h2 style=''>Welcome!</h2></br><h4 style=''>We are pleased to have you, click your name to Verfiy</h4>"
};

// send mail with defined transport object
transporter.sendMail(mailOptions);
console.log(mailOptions);
res.send(true);

});

});

// API for verification 35.163.74.247:9000/verify?id=

app.get("/verify/:id", function(req, res){
var verification_code = req.params.id;
console.log(verification_code);
var query = "SELECT full_name FROM users WHERE verification_code='" + verification_code+ "';";
connection.query(query, function(err, results, fields){
  if(err){
    res.send("There was an error. Please try again later");
  }
  if(results.length === 1){
   connection.query("UPDATE users SET status='verified' WHERE verification_code='" + verification_code + "';", function(err, results, fields){
     if(err){
       res.send("There was an error. Please try again later");
     }else{
       res.redirect("/login");
     }
   });
 }else{
   res.send("Your Verification code doesn't match with our databases please try again later");
 }
})
});

app.post("/delete_project", function(req, res, next){

  var email = req.session.user;
  var project_name =  req.body.postproject_name;
  var query = "DELETE FROM projects_data WHERE project_name='"+project_name+"' AND email ='"+email+"';";
  var dir = "./public/img/users_directory/"+email+"/"+project_name;

  connection.query(query, function(err, results, fields){
    if(err){
      console.log(err);
      return res.send("There was an error. Please try again later!");
    }
    res.send("Your project has been deleted");
  });


rimraf(dir, function () { console.log('done'); });

});

app.post("/share_to_portfolio", function(req, res, next){
  var email = req.session.user;
  var project_name = req.body.postproject_name;
  var query = "UPDATE projects_data SET shared_portfolio = 'yes' WHERE email='"+email+"' AND project_name='"+project_name+"';";

  connection.query(query, function(err, results, fields){
    if(err){
      return res.send(err);
    }
    res.send("Your project Has been shared to the Portfolio!");
  })
});

app.post("/share_to_hub", function(req, res, next){
  var email = req.session.user;
  var project_name = req.body.postproject_name;
  var query = "UPDATE projects_data SET shared_hub = 'yes' WHERE email='"+email+"' AND project_name='"+project_name+"';";

  connection.query(query, function(err, results, fields){
    if(err){
      return res.send(err);
    }
    res.send("Your project Has been shared to the hub!");
  })
});


app.set('port', process.env.PORT || 9000);
app.listen(app.get('port'), function() {
  console.log('Express server listening on port 9000');
});
module.exports = app;
