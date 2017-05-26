/**
 * Created by anjoy92 on 4/14/17.
 */
app.controller('rawDataCtrl',[ '$scope','$rootScope','$location','NgTableParams','dynamicHeader', 'reportService','$http','$state',
                                function($scope ,$rootScope, $location, NgTableParams,dynamicHeader,reportService,$http,$state ) {

 dynamicHeader.setReportTab('/rawData');
    $scope.go = function ( path ) {
        $location.path( path );
    };
    $scope.report_id= $state.params.reportId;
jQuery('#basic_head').attr('href','/#/basicstats/'+$scope.report_id);
jQuery('#advanced_head').attr('href','/#/advancedAnalytics/'+$scope.report_id);
jQuery('#raw_head').attr('href','/#/rawData/'+$scope.report_id);

 var cleanJob = function(job) {
        return {
            id: job['categoryID'],
            name: job['catname'],
            selected: false,
            crawling: job['includeincrawl'] === 1
        }
    };

  setTimeout(function () {
        jQuery(".nav").find(".active").removeClass("active");
        jQuery("#raw_head").parent().addClass("active");
        var reportCheck = $http.get('/api/report?report_id='+$scope.report_id);
        reportCheck.success(function(data, status, headers, config) {
            //$scope.reportSpec = convertDate(data.report);
            $scope.reportSpec = data.report;
            $scope.entities = $scope.reportSpec.data;


            var tempdate=new Date(data.report.createtime);
            $scope.reportSpec.createtime2=tempdate.toUTCString();


            var jobsPromise = $http.get('/api/job');
            jobsPromise.success(function(data, status, headers, config) {
                $scope.jobs = data.jobs.map(cleanJob);
               // console.log("jobs:");
                //console.log($scope.jobs);
                $scope.categoryID = $scope.reportSpec.selectedJobs.map(function(job) {

                for (item in $scope.jobs)
                {

                    if($scope.jobs[item].name==job)
                        return $scope.jobs[item].id;
                }
             });
            //console.log($scope.categoryID);

              if($scope.reportSpec.data=="" || $scope.reportSpec.data== null){

                    getTweets();
            }
            else{
                    getTweets1();
             }

        });
        reportCheck.error(function(data, status, headers, config) {
            //TODO: Add a backup input for this
            console.log("DB not reachable.")
        });
        });
    },500);



    var getTweets1 = function () {
            /*console.log("start date:");
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
              */
                $scope.tweets = $scope.entities.Tweets['tweets'];
                $scope.tweetCount = $scope.entities.Tweets['count'];
                    $scope.tableParams = new NgTableParams({ page: 1,
                count: 5}, {  counts: [5,10,15,20],dataset:$scope.tweets});
    $scope.crawlCount=$scope.tweets.length;

         };


    var getTweets = function () {
            var queryObject = {
                categoryID: $scope.categoryID,
                start_time: $scope.reportSpec.start_datetime,
                end_time: $scope.reportSpec.end_datetime
            };

            var tweetsPromise = $http.get('/api/gettweets', {
                params: queryObject
            });
            tweetsPromise.success(function (data, status, headers, config) {

                $scope.tweets = data['tweets'];
                $scope.tweetCount = data['count'];
                    $scope.tableParams = new NgTableParams({ page: 1,
                count: 5}, {  counts: [5,10,15,20],dataset:$scope.tweets});
                $scope.crawlCount=$scope.tweets.length;

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

