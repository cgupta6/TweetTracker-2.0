/**
 * Created by anjoy92 on 4/14/17.
 */
app.controller('rawDataCtrl',[ '$scope','$rootScope','$log','$timeout','$location','NgTableParams','dynamicHeader', 'reportService','$http','$state',
                                function($scope ,$rootScope, $log, $timeout, $location, NgTableParams,dynamicHeader,reportService,$http,$state ) {

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



    $scope.exportAll = function(){

        var usedAPI = "tweet";

        $scope.fileName = "tweet_data";


         var queryObject = {
                job_ids: $scope.categoryID,
                begin_time: $scope.reportSpec.start_datetime,
                end_time: $scope.reportSpec.end_datetime,
                query:{box1:[],box2:[],box3:[]}
            };


        var query = queryObject;
        var extension = '.json';
        query["no_limit"] = true;
        query["skip"] = 0;
        query["remove_fields"] = {"cat": "false", "catime": "false", "rand": "false", "inserted_at": "false", "tweet-lang": "false"}

        query["response_type"] = "JSON";
        $scope.fileType = "json"; //default data format



        var exportAllPromise = $http.get('/api/three_search', {
            params: query
        });

        exportAllPromise.success(function (data, status, headers, config) {
            console.log("exported successfully..")
            console.log(data);

            var url = URL || webkitURL;
            var onePerLine = "";
            var blob;

            if("response_type" in query){
                if(query["response_type"] === "XML"){
                  if (usedAPI === "tweet") {
                    blob = new Blob([data.tweets],{type:"text/xml;charset=utf-8"});
                  } else if (usedAPI === "image") {
                    blob = new Blob([data.images],{type:"text/xml;charset=utf-8"});
                  } else {
                    blob = new Blob([data.videos],{type:"text/xml;charset=utf-8"});
                  }
                }
                if(query["response_type"] === "JSON"){
                    if (usedAPI === "tweet") {
                        for(var i = 0; i < data.tweets.length; i++)
                            onePerLine += JSON.stringify(data.tweets[i]) + '\n';
                    } else if (usedAPI === "image") {
                        for(var i = 0; i < data.images.length; i++)
                            onePerLine += JSON.stringify(data.images[i]) + '\n';
                    } else { //video
                        for(var i = 0; i < data.videos.length; i++)
                            onePerLine += JSON.stringify(data.videos[i]) + '\n';
                    }
                    blob = new Blob([onePerLine],{type:"text/json;charset=utf-8"});
                }
            }

            if (navigator.appVersion.toString().indexOf('.NET') > 0)
                window.navigator.msSaveBlob(blob, "tweets" + extension);
            else
            {
                 $scope.exportAddress = url.createObjectURL(blob);
                 $timeout(function(){document.getElementById("invisibleDownloadLink").click();},10,false);
            }
        });

        exportAllPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load export results from the API!");
        });
    };





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

