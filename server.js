// Node.js server for the Dublin Bus Tracker app.
//
// The client/server protocol works as follows:
// 1. The client connects.
// 2. The client sends a 'changeParams' request, containing a stop number and
//    a bus number about which they want to be notified 
//   {"stopId": string, "busName": string}
// 3. The server will periodically send a 'bus' message containing info about
//   the requested entities, as a list of 
//   { "busName": string, "stopId": string, "expectedTime": string, 
//     "expectedTimeTxt": string, "expectedWait": string}
// 4. The client can send more 'changeParams' messages to modify the data they
//    want to receive from the client.
// 5. The client disconnects.
var http = require('http');
var path = require('path');

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var socketio = require('socket.io');
var moment = require('moment-timezone');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

// Communications options.
var fetch_timeout_ms = 30000;
var push_timeout_ms = 5000;

// Map of socket object to client parameters. stopId and busName will be empty
// if no changeParams request has been received for the given client.
var clients = [];

// Set of stops currently tracked. Map from stopId to number of clients tracking
// it.
var tracked_stops = {};

// Data fetched from RTPI. Map from stop number to a list of 
// (busName, expectedTime, expectedTimeTxt, expectedWait).
var rtpi_data = {};

// Factory function for parsers. Required to avoid the common "create closure in
// a loop" error.
function createParser(stop) {
  return function(error, response, result) {
    // Clear RTPI data for this stop.
    rtpi_data[stop] = [];
    if (error || response.statusCode != 200){
      var error_data = {
        "error": "error message from server"
      };
      console.log("Error from dublin bus server: " + error);
      rtpi_data[stop].push(error_data);
    }else{
      $ = cheerio.load(result);
      console.log("after load stop " + stop);
      $("#rtpi-results tr").each(function(i, tr) {
        var bus = $(tr).find("td").eq(0).text().trim().toLowerCase();
        console.log("bus: " + bus);
        
        // Skip the header row.
        if (bus !== "Route" && bus !== "") {
          var expected_time_txt = $(tr).find("td").eq(2).text().trim();
          if (expected_time_txt === "Due") {
            expected_time_txt = new Date().getHours() + ":" + new Date().getMinutes();
          }
          var expected_time = moment.tz(expected_time_txt, 'HH:mm', 'Europe/Dublin').utc();

          var now = moment.utc();
          console.log(now.format());
          var expected_wait = moment.duration(0);
          
          if(expected_time.isAfter(now)) {
            expected_wait = moment.duration(+expected_time - +now);
          }
  
          var bus_data = {
            "busName": bus,
            "stopId": stop,
            "expectedTimeTxt": expected_time_txt,
            "expectedTime": expected_time.toISOString(),
            "expectedWait": expected_wait.toISOString()
          };
          
          rtpi_data[stop].push(bus_data);
          console.log("Added data about " + stop + " (" + bus + " @ " + expected_time_txt + ")");
        }
      });
    }
  }
}

// Fetches all the required info for all the tracked_stops from the Dublin Bus 
// site, and puts it in rtpi_data.
function fetchBuses() {
  var url_template = "http://www.dublinbus.ie/en/RTPI/Sources-of-Real-Time-Information/?searchtype=view&searchquery=";
  
  console.log("Start fetchBuses()");
  for (var stop in tracked_stops) {
    console.log("fetching data for " + stop);
    var url = url_template + stop;
    
    request.get(url, createParser(stop)); 
  }
}

router.use('/bower_components',  express.static(__dirname + '/bower_components'));
router.use(express.static(path.resolve(__dirname, 'client')));

function pushBuses() {
  console.log("Start pushBuses");
  for (var socket_id in clients) {
    console.log("Pushing to " + socket_id);
    var clientData = clients[socket_id];
    
    if (clientData.stopId === "") {
      console.log("No changeParams for client " + socket_id + ".");
      continue;
    }
    
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
        console.log("Sending data about " + bus.busName + "@" + bus.expectedTimeTxt);
        result.push(bus);
      }else if(bus.error){
        console.log("Sending error.");
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
  
  var clientData = {"socket": socket, "stopId": "", "busName": ""};
  clients[socket.id] = clientData;
  
  socket.on('changeParams', function(params) {
    console.log('changeParams for ' + socket.id)
    
    // TODO: remove the old stop from tracked_stops, if necessary.
    clients[socket.id].stopId = params.stopId.toLowerCase();
    clients[socket.id].busName = params.busName.toLowerCase();
    
    var stopId = clients[socket.id].stopId;
    
    if (!(stopId in tracked_stops)) {
      tracked_stops[stopId] = 0;
    }
    tracked_stops[stopId]++;
    
    // Fetch data immediately, so we can serve it to the client.
    fetchBuses();
  });
  
  socket.on('disconnect', function () {
    // TODO: remove stops from tracked_stops, if necessary.
    delete clients[socket.id];
  });
});