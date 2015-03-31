var http = require('http');
var path = require('path');

var async = require('async');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var socketio = require('socket.io');
var moment = require('moment');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

// Map of socket object to client parameters.
var clients = [];

function getAllBuses(stop, bus_number, result_callback) {
  var stop = stop.toLowerCase();
  var bus_number = bus_number.toLowerCase();
  var url_template = "http://www.dublinbus.ie/en/RTPI/Sources-of-Real-Time-Information/?searchtype=view&searchquery=";
  var url = url_template + stop;
  var results = [];
  request.get(url, function(err, response, result) {
    $ = cheerio.load(result);
    console.log("after load");
    $("#rtpi-results tr").each(function(i, tr) {
      var bus = $(tr).find("td").eq(0).text().trim().toLowerCase();
      
      // Skip unwanted rows.
      if (bus === bus_number) {
        var expected_time = $(tr).find("td").eq(2).text().trim();
        if (expected_time === "Due") {
          expected_time = new Date().getHours() + ":" + new Date().getMinutes();
        }
        expected_time = moment(expected_time, "HH:mm");
        
        var now = moment();
        var expected_wait = moment.duration(0);
        
        if(expected_time.isAfter(now)) {
          expected_wait = moment.duration(+expected_time - +now);
        }

        var return_object = {
          "busName": bus,
          "stopId": stop,
          "expectedTime": expected_time.toISOString(),
          "expectedWait": expected_wait.toISOString()
        };
        results.push(return_object);
      }
    });
    result_callback(results);
  });
}

router.use('/bower_components',  express.static(__dirname + '/bower_components'));
router.use(express.static(path.resolve(__dirname, 'client')));

function pushBuses() {
  getAllBuses("3705", "41c", function(results) {
    //console.log("Pushing data to clients: " + JSON.stringify(results,null,'\t'));
    broadcast("bus", results);
  });
}

// Allow the server to run both from Cloud9 and from OpenShift.
var server_port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
var server_ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1';

server.listen(server_port, server_ip, function(){
  var addr = server.address();
  console.log("Bus server listening at", addr.address + ":" + addr.port);
  setInterval(pushBuses, 30000)
});

io.on('connection', function (socket) {
  // Empty options for now.
  clients[socket.id] = {"socket": socket};
  
  console.log("New connection: " + socket.id);
  pushBuses();

  socket.on('disconnect', function () {
    delete clients[socket.id];
  });
});

function broadcast(event, data) {
  for (var socket_id in clients) {
    clients[socket_id].socket.emit(event, data);
  }
}