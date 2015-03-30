/**
  * @file        main.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 12:41
  * @description Main view controller
  */

(function(angular, undefined) {
    'use strict';
    
    
    function getInterval(time) {
        var bus_time = (moment(time, "HH:mm").unix() - moment().unix()) * 1000;
        return moment.duration(bus_time).humanize();
    }
    
    angular.module('DublinBusTrackerApp').controller('MainController', ['$scope', function($scope) {
        
        var socket = io.connect();

        $scope.next_bus_time = 'never';
        $scope.all_bus_times = [];

        socket.on('connect', function () {
          console.log("connected");
        });

        socket.on('bus', function (msg) {
          console.log(msg);
          if (msg.length > 0) {
            $scope.$apply(function() {
              $scope.next_bus_time = getInterval(msg[0])
              $scope.all_bus_times = msg.slice(1).map(getInterval);
            })
          }
        });
        
    }]);

    
})(angular);