/**
  * @file        menu.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 13:35
  * @description Menu controller
  */

(function(angular, undefined) {
    'use strict';
    
    angular.module('DublinBusTrackerApp').controller('MenuController', ['$scope', '$window', '$localStorage', 'webSocket', '$rootScope', function($scope, $window, $localStorage, webSocket, $rootScope) {
        $rootScope.$storage = $localStorage.$default({
            busName: '',
            stopId: '',
            warningTime: 10
        });
        
        if( !$rootScope.$storage.busName.length || !$rootScope.$storage.stopId.length ) {
            $rootScope.isSettingsOpen = true;
        }
        
        $scope.$watchGroup(['$storage.busName', '$storage.stopId'], function(v) {
           webSocket.emit('changeParams', {
               busName: v[0],
               stopId: v[1]
           });
        });
    }]);

})(angular);