/**
 * Created by anjoy92 on 4/14/17.
 */


app.controller('advancedAnalyticsCtrl', function ( $scope, $location, $http ,$rootScope,dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);
});