/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('editReportCtrl', function ( $scope, $location, $http ,$rootScope,$state,dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);
    console.log($state.params.reportId);



});