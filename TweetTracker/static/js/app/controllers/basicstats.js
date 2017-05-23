/**
 * Created by anjoy92 on 4/14/17.
 */



app.controller('basicStatsCtrl',[ '$scope','$rootScope','$location','NgTableParams','dynamicHeader', 'reportService','$http','$state',
                                function($scope ,$rootScope, $location, NgTableParams,dynamicHeader,reportService,$http,$state ) {

    dynamicHeader.setReportTab('/basicstats');
    $scope.go = function ( path ) {
        $location.path( path );
    };

     $scope.topics = [];
    // This function converts date to string format
    var convertDate=function(report){
        var tempdate=new Date(report.createtime);
        report.createtime=tempdate.toUTCString();

        var dateObj = new Date(report.start_datetime);
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        newdate = year + "/" + month + "/" + day;

        report.start_datetime=newdate;

        var dateObj = new Date(report.end_datetime);
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        newdate = year + "/" + month + "/" + day;

        report.end_datetime=newdate;

        return report;
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

            getUsers();
           getHashtags();
            getLinks();
            getTopics1();
getTweets();

        });
        reportCheck.error(function(data, status, headers, config) {
            //TODO: Add a backup input for this
            console.log("DB not reachable.")
        });
        });
    },500);


    var data=[];
    $scope.tableParams = new NgTableParams({ count: data.length}, { dataset: data, counts: []});




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
            });
            tweetsPromise.error(function (data, status, headers, config) {
                console.log("Failed to load tweets from the API!");
            });
         };


    var getUsers = function () {

        var queryObject = {
            job_ids: $scope.categoryID,
            start_time: $scope.reportSpec.start_datetime,
            end_time: $scope.reportSpec.end_datetime,
            limit: 30
        };

        var usersPromise = $http.get('/api/entities/users', {
            params: queryObject
        });
        usersPromise.success(function(data, status, headers, config) {
            $scope.users = data['users'];
             $scope.tableParamsUser = new NgTableParams({}, {
             counts: [],
             dataset: $scope.users.slice(0,5)
        });
              $scope.tableParamsUser2 = new NgTableParams({}, {
             counts: [],
             dataset: $scope.users
        });

        });
        usersPromise.error(function(data, status, headers, config) {
            console.log("Failed to load users from the API");
        });
    };

        //$scope.report_id
        //var tempUsers = JSON.parse('[{"count":27427,"user":"Dbnmjr"},{"count":16248,"user":"RT_com"},{"count":11732,"user":"Steiner1776"},{"count":11675,"user":"interfaxua"},{"count":10437,"user":"EuromaidanPress"},{"count":9573,"user":"Liveuamap"},{"count":8763,"user":"Conflict_Report"},{"count":8675,"user":"uatodaytv"},{"count":8535,"user":"Sevodnay"},{"count":8444,"user":"EuromaidanPR"},{"count":8299,"user":"RobPulseNews"},{"count":8220,"user":"Novorossiyan"},{"count":7947,"user":"raging545"},{"count":7138,"user":"BungeeWedgie"},{"count":6835,"user":"SpecGhost"},{"count":6785,"user":"ukraina_ru"},{"count":6518,"user":"noclador"},{"count":6230,"user":"homo_viator"},{"count":5897,"user":"GrahamWP_UK"},{"count":5523,"user":"KyivPost"},{"count":5461,"user":"ukrpravda_news"},{"count":5429,"user":"rConflictNews"},{"count":5422,"user":"SputnikInt"},{"count":5190,"user":"ArmedResearch"},{"count":5066,"user":"olex_scherba"},{"count":4710,"user":"OnlineMagazin"},{"count":4484,"user":"MaxRTucker"},{"count":4393,"user":"poroshenko"},{"count":4344,"user":"wavetossed"},{"count":4338,"user":"MarkSleboda1"}]');

        //reportSpec.selectedJobs
        //$scope.users = tempUsers;
        //$scope.users = [{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"}];

        var getHashtags = function () {


             var queryObject = {
                categoryID: $scope.categoryID,
                start_time: $scope.reportSpec.start_datetime,
                end_time: $scope.reportSpec.end_datetime
            };
            queryObject['Types'] = ["TopHashtags"];
            queryObject['limit'] = 30;

            var hashtagsPromise = $http.get('/api/getentities', {
                params: queryObject
            });
            hashtagsPromise.success(function (data, status, headers, config) {
                $scope.hashtags = data['TopHashtags'].map(function(hashtagsArray) {
                    return {
                        hashtag: hashtagsArray[0],
                        count: hashtagsArray[1]
                    };
                });


        $scope.tableParamsHashtags = new NgTableParams({}, {
            counts: [],
            dataset: $scope.hashtags.slice(0,5)
        });
        $scope.tableParamsHashtags2 = new NgTableParams({}, {
            counts: [],
            dataset: $scope.hashtags
        });

            });
            hashtagsPromise.error(function(data, status, headers, config) {
               console.log("Failed to load hashtags from the API!");
            });
    };

    // Retrieves the Links entities from the server
    var getLinks = function () {

         var queryObject = {
                categoryID: $scope.categoryID,
                start_time: $scope.reportSpec.start_datetime,
                end_time: $scope.reportSpec.end_datetime
            };
        queryObject['Types'] = ["TopUrls"];
        queryObject['limit'] = 30;

        var linksPromise = $http.get('/api/getentities', {
            params: queryObject
        });
        linksPromise.success(function (data, status, headers, config) {
            $scope.links = data['TopUrls'].map(function(urlArray) {
                return {
                    link: urlArray[0],
                    count: urlArray[1]
                };
            });
        $scope.tableParamsLinks = new NgTableParams({}, {
            counts: [],
            dataset: $scope.links.slice(0,5)
        });
         $scope.tableParamsLinks2 = new NgTableParams({}, {
            counts: [],
            dataset: $scope.links
        });
        });
        linksPromise.error(function (data, status, headers, config) {
              console.log("Failed to load hashtags from the API!");
        });
    };

  var getTopics1 = function () {


        var queryObject = {
            job_ids: $scope.categoryID,
            start_time: $scope.reportSpec.start_datetime,
            end_time: $scope.reportSpec.end_datetime,
            limit: 50
        };

        var topicsPromise = $http.get('/api/entities/word_cloud', {
            params: queryObject
        });
        topicsPromise.success(function(data, status, headers, config) {
            $scope.topics = data['word_cloud'].map(function(word) {
                return {
                    text: word['text'],
                    size: 100 + 25 * Math.log(word['size'])
                }
            });

        });
        topicsPromise.error(function(data, status, headers, config) {
            console.log("Failed to load top keywords from the API!");

        });
    };


    /*var getTopics = function () {

        var tempData='[{"text":"#ukraie","size":100},{"text":"#russia","size":58.553336238768026},{"text":"#украина","size":39.67627655854088},{"text":"#donetsk","size":32.3880949522467},{"text":"ukraine","size":29.544352440999518},{"text":"#nato","size":22.388247460002702},{"text":"#днр","size":21.653552018188037},{"text":"amp","size":21.397085610917884},{"text":"today","size":19.827464156078307},{"text":"#киев","size":15.618415675033333},{"text":"russian","size":15.529063184738703},{"text":"#россия","size":15.45614465456427},{"text":"kiev","size":14.840989847797019},{"text":"#лнр","size":14.703973021535148},{"text":"putin","size":14.505729822313967},{"text":"#news","size":13.836427940885017},{"text":"#донецк","size":13.086919566823227},{"text":"#putin","size":12.885028244652105},{"text":"war","size":12.780112692665654},{"text":"#україна","size":11.970033788712314},{"text":"airport","size":11.366674496483398},{"text":"#eu","size":9.430747261129895},{"text":"#usa","size":8.757634662501957},{"text":"live","size":8.493501196527035},{"text":"#mariupol","size":8.088395608945504},{"text":"#kiev","size":7.934093626625042},{"text":"#новости","size":7.807051610950111},{"text":"@dbnmjr","size":7.714997331692032},{"text":"russia","size":6.887884933220022},{"text":"killed","size":6.8018491103847225},{"text":"#война","size":6.323768224117288},{"text":"donetsk","size":6.3141127319533865},{"text":"army","size":4.832094275106698},{"text":"#новороссия","size":4.571487477733712},{"text":"#uatoday","size":4.550769816814906},{"text":"eastern","size":3.907299845567323},{"text":"military","size":2.29546720645142},{"text":"ukrainian","size":1.0979325043892771},{"text":"troops","size":0.6537858056899353},{"text":"shelling","size":0.5530599588912963},{"text":"people","size":0.3160334546057868},{"text":"#ато","size":0.027112815013680347},{"text":"#us","size":-0.6194966417223782},{"text":"#poland","size":-0.76007568508372},{"text":"htt","size":-1.2296763077518165},{"text":"#freesavchenko","size":-1.2349004222834026},{"text":"forces","size":-3.3802796855304678},{"text":"civilians","size":-5.299410371779146},{"text":"@rt_com","size":-5.4566532901122855},{"text":"soldiers","size":-6.779225861547317}]';
        $scope.topics = JSON.parse(tempData);
    };
      //getTopics();
    /*var getHashtags = function () {

        var tempData='[{"hashtag":"Ukraine","count":27922},{"hashtag":"Russia","count":8361},{"hashtag":"ukraine","count":5077},{"hashtag":"NATO","count":4403},{"hashtag":"UaToday","count":4164},{"hashtag":"russia","count":2473},{"hashtag":"runews","count":2188},{"hashtag":"fact","count":2188},{"hashtag":"Donetsk","count":1989},{"hashtag":"Украина","count":1322},{"hashtag":"EU","count":952},{"hashtag":"Україна","count":794},{"hashtag":"US","count":759},{"hashtag":"Novorossiya","count":644},{"hashtag":"Kiev","count":638},{"hashtag":"Putin","count":589},{"hashtag":"Lenin","count":567},{"hashtag":"Kharkov","count":565},{"hashtag":"USA","count":436},{"hashtag":"UKROP","count":402},{"hashtag":"Poland","count":377},{"hashtag":"новости","count":369},{"hashtag":"Syria","count":367},{"hashtag":"украина","count":353},{"hashtag":"ISIS","count":347},{"hashtag":"Russian","count":310},{"hashtag":"news","count":307},{"hashtag":"MH17","count":289},{"hashtag":"Slovakia","count":288},{"hashtag":"kiev","count":281}]';
        $scope.hashtags = JSON.parse(tempData);

        //$scope.users = [{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"}];

        $scope.tableParamsHashtags = new NgTableParams({}, {
            counts: [],
            dataset: $scope.hashtags.slice(0,5)
        });
    };

    var getLinks = function () {

        var tempData='[{"link":"http://Novosti.TV/ukraine-today.php","count":1058},{"link":"http://Novosti.CN/ukraine-today.php","count":253},{"link":"http://Novosti.PL/ukraine-today.php","count":250},{"link":"http://Novosti.MX/ukraine-today.php","count":245},{"link":"http://Novosti.US/ukraine-today.php","count":241},{"link":"http://Novosti.BIZ/ukraine-today.php","count":231},{"link":"http://Novosti.CA/ukraine-today.php","count":229},{"link":"http://Novosti.NET/ukraine-today.php","count":228},{"link":"http://Novosti.LT/ukraine-today.php","count":220},{"link":"http://Novosti.be/ukraine-today.php","count":215},{"link":"http://Novosti.ORG/ukraine-today.php","count":212},{"link":"http://Novosti.LV/ukraine-today.php","count":207},{"link":"http://Novosti.EE/ukraine-today.php","count":204},{"link":"http://Novosti.NL/ukraine-today.php","count":191},{"link":"http://Novosti.FM/ukraine-today.php","count":180},{"link":"http://lifenews.ru/news/141670","count":178},{"link":"http://dld.bz/dxeCR","count":156},{"link":"http://ift.tt/1pRDuVc","count":105},{"link":"http://www.tevhidigundem.com/ukraynali-askerlere-saldiri-2191h.htm","count":103},{"link":"http://rt.com/news/czech-president-crimea-eu-881/","count":101},{"link":"http://www.tevhidigundem.com/ukraynada-halk-dev-lenin-heykeli-yikti-2183h.htm","count":99},{"link":"https://www.youtube.com/watch?v=DuTFfePRDvA","count":99},{"link":"https://www.youtube.com/watch?v=0kCgsnn1bj0&feature=youtu.be","count":89},{"link":"http://rt.com/","count":84},{"link":"http://bit.ly/M0JyVL","count":80},{"link":"http://ukraina.ru/analytics/20140930/1010646944.html","count":80},{"link":"http://www.countercurrents.org/kagarlitsky280914.htm","count":77},{"link":"http://youtu.be/0vvxlGUki7U","count":76},{"link":"https://www.youtube.com/watch?v=jSOfQ7tgTLg","count":75},{"link":"http://hd-vipserver.com/online/167386136-80655964/","count":74}]';
        $scope.links = JSON.parse(tempData);

        //$scope.users = [{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"},{'count': 123,'user':"asf"}];

        $scope.tableParamsLinks = new NgTableParams({}, {
            counts: [],
            dataset: $scope.links.slice(0,5)
        });
    };
    */
    //getHashtags();
    //getLinks();

     // This function takes a job from TweetTracker's API and adds some logical
    // structure to it
    var cleanJob = function(job) {
        return {
            id: job['categoryID'],
            name: job['catname'],
            selected: false,
            crawling: job['includeincrawl'] === 1
        }
    };

}]);


// This directive manages a word cloud
app.directive('wordcloud', function() {
    return {
        restrict: 'A',
        scope: {
            words: '=ngModel'
        },
        link: function (scope, elem) {
            // Set some variables to use to draw the word cloud
            var fill = d3.scale.category20();
            var width = jQuery(jQuery(elem[0]).parent()).width();
            //var width = 1500;
            var height = width * .3; // TODO: Change these to match the screen
            // This function drops the old cloud and makes a new one
            var renderCloud = function () {
                d3.select(elem[0]).select("svg").remove();
                d3.layout.cloud().size([width, height])
                    .words(scope.words)
                    .padding(5)
                    .rotate(function() { return 0; })
                    .font("Impact")
                    .fontSize(function(d) { return d.size; })
                    .on("end", draw)
                    .start();
            };

            // This function does the actual cloud drawing
            function draw() {
                d3.select(elem[0]).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + width /2+ "," + height/2+ ")")
                    .selectAll("text")
                    .data(scope.words)
                    .enter().append("text")
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function(d, i) { return '#736D68'; })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; });
            }

            // Whenever the words are updated, we should re-render the word cloud
            scope.$watchCollection('words', function (oldVal, newVal) {
                if (newVal) {
                    renderCloud();
                }
            });
        }
    };
});

