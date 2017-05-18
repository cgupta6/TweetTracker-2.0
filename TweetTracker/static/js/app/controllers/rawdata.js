/**
 * Created by anjoy92 on 4/14/17.
 */
app.controller('rawDataCtrl',[ '$scope','$rootScope','$location','NgTableParams','dynamicHeader', 'reportService','$http','$state',
                                function($scope ,$rootScope, $location, NgTableParams,dynamicHeader,reportService,$http,$state ) {

    dynamicHeader.setReportTab($location.$$path);

    $scope.go = function ( path ) {
        $location.path( path );
    };
 var cleanJob = function(job) {
        return {
            id: job['categoryID'],
            name: job['catname'],
            selected: false,
            crawling: job['includeincrawl'] === 1
        }
    };

    $scope.report_id=reportService.getReportId();
  setTimeout(function () {
        var reportCheck = $http.get('/api/report?report_id='+$scope.report_id);
        reportCheck.success(function(data, status, headers, config) {
            //$scope.reportSpec = convertDate(data.report);
            $scope.reportSpec = data.report;
            var tempdate=new Date(data.report.createtime);
            $scope.reportSpec.createtime2=tempdate.toUTCString();


            var jobsPromise = $http.get('/api/job');
            jobsPromise.success(function(data, status, headers, config) {
                $scope.jobs = data.jobs.map(cleanJob);
                console.log("jobs:");
                console.log($scope.jobs);
                $scope.categoryID = $scope.reportSpec.selectedJobs.map(function(job) {

                for (item in $scope.jobs)
                {

                    if($scope.jobs[item].name==job)
                        return $scope.jobs[item].id;
                }
             });
            console.log($scope.categoryID);

getTweets();

        });
        reportCheck.error(function(data, status, headers, config) {
            //TODO: Add a backup input for this
            console.log("DB not reachable.")
        });
        });
    },500);



    var getTweets = function () {
            console.log("start date:");
            console.log($scope.reportSpec.start_datetime);
            var queryObject = {
                categoryID: $scope.categoryID,
                start_time: $scope.reportSpec.start_datetime,
                end_time: $scope.reportSpec.end_datetime
            };

            var tweetsPromise = $http.get('/api/gettweets', {
                params: queryObject
            });
            tweetsPromise.success(function (data, status, headers, config) {
                $scope.tweets = data.tweets;
                $scope.tweetCount = data.count;
console.log("NOW");
console.log($scope.tweets);
                    $scope.tableParams = new NgTableParams({ page: 1,
                count: 5}, {  counts: [5,10,15,20],dataset:$scope.tweets});
    $scope.crawlCount=$scope.tweets.length;
            });
            tweetsPromise.error(function (data, status, headers, config) {
                console.log("Failed to load tweets from the API!");
            });
         };


   //
   //
   // var link="https://twitter.com/NASA/status/852652984387371008";
   //  var data=[{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"},{url:link , timeStamp: "11:51 AM - 3 Dec 2012"}];
   //  $scope.tableParams = new NgTableParams({ page: 1,
   //              count: 5}, {  counts: [5,10,15,20],dataset:data});
   //  $scope.crawlCount=data.length;

}]);

