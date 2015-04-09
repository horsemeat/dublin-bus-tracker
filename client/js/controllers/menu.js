/**
  * @file        menu.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 13:35
  * @description Menu controller
  */

(function(angular, undefined) {
    'use strict';
    
    angular.module('DublinBusTrackerApp').controller('MenuController', ['$scope', '$window', '$localStorage', 'webSocket', '$rootScope', function($scope, $window, $localStorage, webSocket, $rootScope) {
        var unwatch = angular.noop();
        var timerPromise = null;

        $rootScope.$storage = $localStorage.$default({
            busName: '',
            stopId: '',
            warningTime: 10,
            isAudioEnabled: true
        });
        
        $scope.$on('socket:connect', function() {
            unwatch = $scope.$watchGroup(['$storage.busName', '$storage.stopId'], changeParams);
        });
        
        $scope.$on('socket:disconnect', function() {
            unwatch();
        });
        
        if( !$rootScope.$storage.busName.length || !$rootScope.$storage.stopId.length ) {
            $rootScope.isSettingsOpen = true;
        }

        function changeParams() {
            if( !$rootScope.$storage.busName.length || !$rootScope.$storage.stopId.length ) return;
            webSocket.emit('changeParams', {
                stopId: $rootScope.$storage.stopId,
                busName: $rootScope.$storage.busName
            });
        }
        
    }]);

})(angular);