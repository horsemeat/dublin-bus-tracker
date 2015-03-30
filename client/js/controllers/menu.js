/**
  * @file        menu.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 13:35
  * @description Menu controller
  */

(function(angular, undefined) {
    'use strict';
    
    angular.module('DublinBusTrackerApp').controller('MenuController', ['$scope', '$window', '$localStorage', function($scope, $window, $localStorage) {
        $scope.$storage = $localStorage.$default({
            busName: '41c',
            stopId: '3705',
            warningTime: 10
        });
    }]);

})(angular);