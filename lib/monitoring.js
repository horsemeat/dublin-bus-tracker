// monitoring.js
//
// Imports the pmx module and defines custom metrics.
// To initialize the module, call the init() function.
//
// It defines two custom PMX metrics:
// - num_monitored_stops: number of monitored stops
// - num_connected_clients: number of connected clients

(function() {
    'use strict';
    
    var pmx = require('pmx');
    pmx.init();
    
    var Monitor = {
        init: function(clients, stops) {
            // Metrics.
            var probe = pmx.probe();
            
            probe.metric({
              name: "num_monitored_stops",
              agg_type: "max",
              value: function() {
                return Object.keys(stops).length;
              }
            });
            
            probe.metric({
              name: "num_connected_clients",
              agg_type: "max",
              value: function() {
                return Object.keys(clients).length;
              }
            });
        }
    }
    
    module.exports = Monitor;
})()