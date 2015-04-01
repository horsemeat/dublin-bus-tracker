/**
  * @file        main.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 12:41
  * @description Main view controller
  */

(function(angular, undefined) {
    'use strict';
    angular.module('DublinBusTrackerApp').controller('MainController', ['$scope', '$interval', '$rootScope', function($scope, $interval, $rootScope) {
        
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
        
        //$timeout        
        $interval(function() {
          
          if(!$scope.nextBus) return;
          
          console.log(moment.utc($scope.nextBus.expectedTime).diff(moment.utc(), 'minutes'));
          console.log(moment.utc($scope.nextBus.expectedTime).format());
          console.log(moment.utc().format());

          if( moment($scope.nextBus.expectedTime).diff(moment.utc(), 'minutes') <= $scope.$storage.warningTime ) {
            $rootScope.isRunningOutOfTime = true;
          } else {
            $rootScope.isRunningOutOfTime = false;
          }
        }, 1000);
        
    }]);

    
})(angular);