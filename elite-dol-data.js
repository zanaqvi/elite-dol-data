//Initiallising node modules
var express = require("express");
var https = require('https');
const { Pool, Client } = require('pg');
var app = express();



//const ELITE_SECRET = 'elite_secret';
const basicAuth = require('express-basic-auth');

//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});
//express basic auth
app.use(basicAuth({
    users: {
        'admin': '',
        'conver': ''
    }
}));

// initializing postgresql connection credentials
const pool = new Pool({
	user: '',
	host: '',
	database: '',
	password: '',
	port: 5432,
	max: 20,
	idleTimeoutMillis: 10000,
	connectionTimeoutMillis: 2000
  });

pool.on('error', (err, client) => {
	console.error('Unexpected error on idle client', err);
});

//execute query and send response back
var executePooledPgQuery = function(res, query){
	pool.connect((err, pgClient, release) => {
		if (err) {
			  console.error('Error acquiring client', err.stack);
			  res.status(500).send(err);
		} else {
			pgClient.query(query, (err, resultset) => {
				release();
				if (err) {   
					console.log("Error while querying database :- " + err);
					res.status(500).send(err);
				}
				else {
					console.log('Response Sent\n');
					res.send(resultset);
				}
			});
		}
	  });
}
var server = app.listen(process.env.PORT || 3688, function () {
	var port = server.address().port;
	console.log("DOL data app now running on port", port);
});

app.get("/api/test", function(req , res){
	console.log("request received");
	res.status(200).send({ auth: true, message: 'all ok' });
});


app.get("/api/get_nurse_data", function(req , res){
    var query = "select * from elite.usstats_oesdata where occ_code in ('29-1111', '29-1141') and ";
    var orderby = " order by oes_year, state";

    if (!req.query.state && !req.query.year){
        res.status(500).send('request should have atleast year (integer e.g 2010) or state param (2 letter capitalized string e.g UT) ');
        return;
    }
    else if (req.query.state && !req.query.year) {
        query = query + "st = '" + req.query.state + "' ";
    }
    else if (!req.query.state && req.query.year) {
        query = query + "oes_year = " + req.query.year.toString() + " ";
    }
    else {
        query = query + "oes_year = " + req.query.year.toString() + " and st = '" + req.query.state + "' ";
    }

    query = query + orderby;
    //console.log(query);
    executePooledPgQuery(res, query);

});

app.get("/api/get_occ_codes", function(req , res){
	var query = "select occ_code, trim(lower(replace(occ_title,'\"', ''))) as trimmed_title, min(oes_year) as min_year, max(oes_year) as max_year, count(*) as row_count from elite.usstats_oesdata \
        group by occ_code, trim(lower(replace(occ_title,'\"', ''))) \
        order by trim(lower(replace(occ_title,'\"', '')))";
	executePooledPgQuery(res, query);
});

app.get("/api/get_occ_code_data", function(req , res){
    var query = "select * from elite.usstats_oesdata where occ_code = '";
    var orderby = " order by oes_year, state";
    if (!req.query.occ_code){
        res.status(500).send('request should have occ_code e.g 15-2011 and atleast year (integer e.g 2010) or state param (2 letter capitalized string e.g UT) ');
        return;
    }
    query = query + req.query.occ_code + "' and ";

    if (!req.query.state && !req.query.year){
        res.status(500).send('request should also have atleast year (integer e.g 2010) or state param (2 letter capitalized string e.g UT) ');
        return;
    }
    else if (req.query.state && !req.query.year) {
        query = query + "st = '" + req.query.state + "' ";
    }
    else if (!req.query.state && req.query.year) {
        query = query + "oes_year = " + req.query.year.toString() + " ";
    }
    else {
        query = query + "oes_year = " + req.query.year.toString() + " and st = '" + req.query.state + "' ";
    }

    query = query + orderby;
    //console.log(query);
    executePooledPgQuery(res, query);

});