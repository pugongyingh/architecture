var mysql = require('mysql2');
var connection = mysql.createConnection({host:'localhost', user: 'root', database: 'ali', password:'mypass'});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;
