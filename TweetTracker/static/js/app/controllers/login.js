/**
 * Created by ASUAD\sshar107 on 5/17/17.
 */
/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('loginCtrl', function ( $scope, $location, $http, $rootScope, dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);

});