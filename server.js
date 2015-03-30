var http = require('http');
var path = require('path');

var async = require('async');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var socketio = require('socket.io');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var messages = [];
var sockets = [];

exports.getAllBuses = function(stop, bus_number, result_callback) {
  var url_template = "http://www.dublinbus.ie/en/RTPI/Sources-of-Real-Time-Information/?searchtype=view&searchquery=";
  var url = url_template + stop;
  var results = [];
  request.get(url, function(err, response, result) {
    $ = cheerio.load(result);
    console.log("after load");
    $("#rtpi-results tr").each(function(i, tr) {
      var bus = $(tr).find("td").eq(0).text().trim();
      var time = $(tr).find("td").eq(2).text().trim();
      if (bus === bus_number) {
        if (time === "Due") {
          results.push(new Date().getHours() + ":" + new Date().getMinutes())
        } else {
          results.push(time);
        }
      }
    });
    result_callback(results);
  });
};

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

function pushBuses() {
  getAllBuses("3705", "41c", function(results) {
    console.log("Pushing data to clients: " + results);
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
  sockets.push(socket);
  console.log("New connection: " + sockets.indexOf(socket))
  pushBuses();

  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
  });
});

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}