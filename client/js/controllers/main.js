/**
  * @file        main.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 12:41
  * @description Main view controller
  */

(function(angular, undefined) {
    'use strict';
    angular.module('DublinBusTrackerApp').controller('MainController', ['$scope', function($scope) {
        
        $scope.$on('socket:bus', function (event, data) {
          console.log(data);
          if (data.length > 0) {
            $scope.nextBus = data.slice(0,1).pop();
            $scope.otherBuses = data.slice(1);
          } else {
            $scope.nextBus = null;
            $scope.otherBuses = {};
          }
        });
      
    }]);

    
})(angular);