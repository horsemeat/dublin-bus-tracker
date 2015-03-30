/**
  * @file        main.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 12:41
  * @description Main view controller
  */

(function(angular, undefined) {
    'use strict';
    angular.module('DublinBusTrackerApp').controller('MainController', ['$scope', 'webSocket', function($scope, webSocket) {
        
        //var socket = io.connect();

        $scope.next_bus_time = 'never';
        $scope.all_bus_times = [];

        webSocket.on('connect', function () {
          console.log("connected");
        });

        webSocket.on('bus', function (msg) {
          console.log(msg);
          if (msg.length > 0) {
            $scope.$apply(function() {
              $scope.next_bus_time = msg[0].expectedWait;
              $scope.all_bus_times = msg.slice(1);
            })
          }
        });
        
    }]);

    
})(angular);