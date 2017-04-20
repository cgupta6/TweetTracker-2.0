/**
 * Created by anjoy92 on 4/14/17.
 */



app.controller('basicStatsCtrl',[ '$scope','$rootScope','$location','NgTableParams','dynamicHeader', function($scope ,$rootScope, $location, NgTableParams,dynamicHeader) {

    dynamicHeader.setReportTab($location.$$path);

    $scope.go = function ( path ) {
        $location.path( path );
    };
    var data=[];
    $scope.tableParams = new NgTableParams({ count: data.length}, { dataset: data, counts: []});
}]);
