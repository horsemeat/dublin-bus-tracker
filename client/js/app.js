/**
  * @file        main.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 12:38
  * @description Main application module
  */

(function(angular, undefined) {
    'use strict';
    
    angular
        .module('DublinBusTrackerApp', ['ngStorage', 'ngAnimate', 'btford.socket-io'])
        .factory('webSocket', function (socketFactory) {
            var webSocket = socketFactory();
            webSocket.forward('connect')
            webSocket.forward('disconnect')
            webSocket.forward('bus')
            webSocket.on('error', console.error);
            return webSocket;
        })
        .run(['$window', '$rootScope', function($window, $rootScope) {
            $rootScope.isConnected = false;
            $rootScope.isRunningOutOfTime = false;
            
            $rootScope.$on('socket:connect', function () {
              $rootScope.isConnected = true;
            });
            
            $rootScope.$on('socket:disconnect', function () {
              $rootScope.isConnected = false;
            });
            
            angular.element('[data-toggle="offcanvas"]').click(function () {
                angular.element('.row-offcanvas').toggleClass('active')
            });
            
        }]);
    
})(angular);