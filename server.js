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

// Communications options.
var fetch_timeout_ms = 30000;
var push_timeout_ms = 5000;

// Map of socket object to client parameters.
var clients = [];

// List of stops currently tracked.
var tracked_stops = [];

// Data fetched from RTPI. Map from stop number to a list of 
// (busName, expectedTime, expectedWait).
var rtpi_data = [];

// Fetches all the required info for all the tracked_stops from the Dublin Bus 
// site, and puts it in rtpi_data.
function fetchBuses() {
  var url_template = "http://www.dublinbus.ie/en/RTPI/Sources-of-Real-Time-Information/?searchtype=view&searchquery=";
  
  // Clear rtpi_data.
  rtpi_data.length = 0;
  
  for (var i = 0; i < tracked_stops.length; i++) {
    var stop = tracked_stops[i].toLowerCase();
    var url = url_template + stop;
    
    request.get(url, function(unused_err, unused_response, result) {
      $ = cheerio.load(result);
      console.log("after load stop " + stop);
      $("#rtpi-results tr").each(function(i, tr) {
        console.log(i + ": " + tr.toString());
        var bus = $(tr).find("td").eq(0).text().trim().toLowerCase();
        
        // Skip the header row.
        if (bus !== "Route" && bus !== "") {
          var expected_time_txt = $(tr).find("td").eq(2).text().trim();
          if (expected_time_txt === "Due") {
            expected_time_txt = new Date().getHours() + ":" + new Date().getMinutes();
          }
          var expected_time = moment(expected_time_txt, "HH:mm");
          
          var now = moment();
          var expected_wait = moment.duration(0);
          
          if(expected_time.isAfter(now)) {
            expected_wait = moment.duration(+expected_time - +now);
          }
  
          var bus_data = {
            "busName": bus,
            "stopId": stop,
            "expectedTime": expected_time.toISOString(),
            "expectedWait": expected_wait.toISOString()
          };
          
          if (!(stop in rtpi_data)) {
            rtpi_data[stop] = [];
          }
          
          rtpi_data[stop].push(bus_data);
          console.log("Added data about " + stop + " (" + bus + " @ " + expected_time_txt + ")");
        }
      });
    });
  }
}

router.use('/bower_components',  express.static(__dirname + '/bower_components'));
router.use(express.static(path.resolve(__dirname, 'client')));

function pushBuses() {
  for (var socket_id in clients) {
    var clientData = clients[socket_id];
    
    if (!(clientData.stopId in rtpi_data)) {
      console.warn("No data yet for stop " + clientData.stopId + 
                   ". Cannot send data to client " + socket_id);
      continue;
    }
    
    var busData = rtpi_data[clientData.stopId];
    var result = [];
    for (var i = 0; i < busData.length; ++i) {
      var bus = busData[i];
      if (bus.busName === clientData.busName) {
        result.push(bus);
      }
    }
    
    clientData.socket.emit("bus", result);
  }
}

// Allow the server to run both from Cloud9 and from OpenShift.
var server_port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
var server_ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1';

server.listen(server_port, server_ip, function(){
  var addr = server.address();
  console.log("Bus server listening at", addr.address + ":" + addr.port);
  setInterval(pushBuses, push_timeout_ms);
  setInterval(fetchBuses, fetch_timeout_ms);
});

io.on('connection', function (socket) {
  console.log("New connection: " + socket.id);
  
  // All clients are interested in bus 41c on stop 3705 for now.
  // TODO: implement an endpoint to change the client parameters.
  var clientData = {"socket": socket, "stopId": "3705", "busName": "41c"};
  clients[socket.id] = clientData;
  
  if (!(clientData.stopId in tracked_stops)) {
    tracked_stops.push(clientData.stopId);
  }
  
  // Fetch data immediately, so we can serve it to the new client.
  fetchBuses();

  socket.on('disconnect', function () {
    // TODO: remove stops from tracked_stops, if necessary.
    delete clients[socket.id];
  });
});