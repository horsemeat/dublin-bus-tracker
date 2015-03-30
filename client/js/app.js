/**
  * @file        main.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        30/03/2015 12:38
  * @description Main application module
  */

(function(angular, undefined) {
    'use strict';
    
    angular
        .module('DublinBusTrackerApp', [])
        .run(['$window', function($window) {
             angular.element('[data-toggle="offcanvas"]').click(function () {
                angular.element('.row-offcanvas').toggleClass('active')
            });
        }]);
    
})(angular);