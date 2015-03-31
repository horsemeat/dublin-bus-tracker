/**
  * @file        countdown.js
  * @author      Antonino Parisi <tabman83@gmail.com>
  * @date        31/03/2015 13:15
  * @description Countdown directive
  */

(function(angular, undefined) {
    'use strict';
    
    angular.module('DublinBusTrackerApp').directive('countdown', ['$timeout', '$animate', '$compile', '$localStorage', function($timeout, $animate, $compile, $localStorage) {
        var oneSecond = moment.duration(1, 'second');
        return {
            restrict: 'A',
            link: function($scope, $element, $attrs) {
                
                var template = $element.html();
                var timerPromise = null;
                var duration = moment.duration(0);
                
                function applyTemplate(m) {
                    var result = template;
                    result = result.replace('{h}', m.hours());
                    result = result.replace('{m}', m.minutes());
                    result = result.replace('{s}', m.seconds());
                    return result;
                }

                function updateTime() {
                    $element.html(applyTemplate(duration));
                    //$compile($element.contents())($scope);
                    duration.subtract(oneSecond);
                    if( duration.asSeconds() > 1 ) {
                        timerPromise = $timeout(updateTime, 1000);
                    }
                }
                
                $scope.$watch($attrs.countdown, function(val) {
                    $timeout.cancel(timerPromise);
                    if(val) {
                        duration = moment.duration(val);
                        updateTime();
                        /*
                        $animate.addClass($element, 'update').then(function() {
                            $animate.removeClass($element, 'update');
                        });
                        */
                    } else {
                        $element.html('Never');
                    }
                });
            }
        }
    }]);

})(angular);