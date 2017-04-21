/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('rawDataCtrl',[ '$scope','$rootScope','$location','$http','$state','NgTableParams','dynamicHeader', function($scope ,$rootScope, $location,$http,$state, NgTableParams,dynamicHeader) {

    dynamicHeader.setReportTab($location.$$path);

    $scope.go = function ( path ) {
        $location.path( path );
    };

    var link="https://twitter.com/NASA/status/852652984387371008";
    var data=[{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"}];
    $scope.tableParams = new NgTableParams({ page: 1,
                count: 5}, {  counts: [5,10,15,20],dataset:data});
    $scope.crawlCount=data.length;
}]);

