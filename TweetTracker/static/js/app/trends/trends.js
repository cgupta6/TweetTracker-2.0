var trends = angular.module('trends', ['ngRoute', 'ui.bootstrap', 'ttutilities.directives']);

trends.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: '/static/js/app/trends/partials/trends.html',
        controller: 'TrendController'
    }).otherwise({
        redirectTo: '/'
    })
}]);

// This is to work around a bug where Morris trims off the timezone.
var tzo = new Date().getTimezoneOffset() * 60 * 1000;

// Allowing time to change by dateformatstring
trends.directive('datepickerPopup', function (){
  return {
    restrict: 'EAC',
    require: 'ngModel',
    link: function(scope, element, attr, controller) {
      //remove the default formatter from the input directive to prevent conflict
      controller.$formatters.shift();
    }
  }
});

// This directive encapsulates a trend line for TweetTracker
trends.directive('trendline', function () {
    return {
        restrict: 'A',
        scope: {
            trendData: "=ngModel" // Bind our data from $scope.trendData

        },
        link: function (scope, elem, attrs) {

            scope.drawTrendlines = function(){
                //return if trendData is empty
                console.log(scope);

                var empty = true;

                for(i in scope.trendData["trendData"])
                    empty = false;

                if (empty)
                    return;

                //clear the trendline area
                $('#trendArea > *').remove();

                //determine if the search involved keywords, and get length of the arrays

                var hadKeywords = false;
                var length = 0

                for(i in scope.trendData["trendData"]){
                    for(j in scope.trendData["trendData"][i]){
                        if(scope.trendData["trendData"][i][j].hasOwnProperty("tweetTrends")){
                            hadKeywords = true;
                            length = scope.trendData["trendData"][i][j]["tweetTrends"].length;
                        } else if(scope.trendData["trendData"][i][j].hasOwnProperty("imageTrends")){
                            hadKeywords = true;
                            length = scope.trendData["trendData"][i][j]["imageTrends"].length;
                        } else if(scope.trendData["trendData"][i][j].hasOwnProperty("videoTrends")){
                            hadKeywords = true;
                            length = scope.trendData["trendData"][i][j]["videoTrends"].length;
                        } else {
                            length = scope.trendData["trendData"][i][j].length;
                        }
                        break;
                    }
                    break;
                }

                data = [];
                labels = [];
                ykeys = [];
                lineColors = ['#0000CC', '#CC0000', '#00CC00', '#CCCC00', '#FF6600', '#FF0066', '#00CCCC', '#663300', '#CC0066'];

                if(hadKeywords){
                    labels = [];
                    ykeys = [];

                    for(timeIndex = 0; timeIndex < length; timeIndex++){
                        obj = {};

                        labels = [];
                        ykeys = [];

                        for(id in scope.trendData["trendData"]){
                            for(keyword in scope.trendData["trendData"][id]){
                                if (scope.trendData.tweetTrends) {
                                    ykeys.push(id + " - " + keyword + "tweet");
                                    labels.push(scope.trendData["jobs"][getIndexOfJob(id)]["name"] + " Tweets - " + keyword);
                                    obj[id + " - " + keyword + "tweet"] = scope.trendData["trendData"][id][keyword]["tweetTrends"][timeIndex];
                                }
                                if (scope.trendData.imageTrends) {
                                    ykeys.push(id + " - " + keyword + "image");
                                    labels.push(scope.trendData["jobs"][getIndexOfJob(id)]["name"] + " Images - " + keyword);
                                    obj[id + " - " + keyword + "image"] = scope.trendData["trendData"][id][keyword]["imageTrends"][timeIndex];
                                }
                                if (scope.trendData.videoTrends) {
                                    ykeys.push(id + " - " + keyword + "video");
                                    labels.push(scope.trendData["jobs"][getIndexOfJob(id)]["name"] + " Videos - " + keyword);
                                    obj[id + " - " + keyword + "video"] = scope.trendData["trendData"][id][keyword]["videoTrends"][timeIndex];
                                }

                                // add back in the seconds that Morris will eventually trim off
                                var dts = +new Date(scope.trendData["trendData"][id][keyword]["times"][timeIndex]);
                                var dt = new Date(dts + tzo);

                                obj["time"] = dt.getTime();
                            }
                        }
                        data.push(obj);
                    }

                    Morris.Line({
                        element: elem,
                        data: data,
                        xkey: "time",
                        ykeys: ykeys,
                        labels: labels,
                        hideHover: "auto",
                        lineColors: lineColors
                    });
                }
                else{
                    labels = [];
                    ykeys = [];

                    for(timeIndex = 0; timeIndex < length; timeIndex++){
                        obj = {};

                        labels = [];
                        ykeys = [];

                        for(id in scope.trendData["trendData"]){
                            if (scope.trendData.tweetTrends) {
                                ykeys.push(id + "tweet");
                                labels.push(scope.trendData["jobs"][getIndexOfJob(id)]["name"] + " Tweets");
                                obj[id + "tweet"] = scope.trendData["trendData"][id]["tweetTrends"][timeIndex];
                            }
                            if (scope.trendData.imageTrends) {
                                ykeys.push(id + "image");
                                labels.push(scope.trendData["jobs"][getIndexOfJob(id)]["name"] + " Images");
                                obj[id + "image"] = scope.trendData["trendData"][id]["imageTrends"][timeIndex];
                            }
                            if (scope.trendData.videoTrends) {
                                ykeys.push(id + "video");
                                labels.push(scope.trendData["jobs"][getIndexOfJob(id)]["name"] + " Videos");
                                obj[id + "video"] = scope.trendData["trendData"][id]["videoTrends"][timeIndex];
                            }

                            // add back in the seconds that Morris will eventually trim off
                            var dts = +new Date(scope.trendData["trendData"][id]["times"][timeIndex]);
                            var dt = new Date(dts + tzo);

                            obj["time"] = dt.getTime();
                        }
                        data.push(obj);
                    }

                    Morris.Line({
                        element: elem,
                        data: data,
                        xkey: "time",
                        ykeys: ykeys,
                        labels: labels,
                        hideHover: "auto",
                        lineColors: lineColors
                    });
                }

                ////console.log(scope.trendData);
                //console.log(data);
                //console.log(ykeys);
                //console.log(labels);
                ////console.log(length);
            };

            scope.$watchCollection('trendData', function (oldVal, newVal) {
                if (newVal) {
                    scope.drawTrendlines();
                    ////console.log("changed");
                    ////console.log(newVal);
                }
            });

            function getIndexOfJob(id) {
                for(i = 0; i < scope.trendData["jobs"].length; i++){
                    if(scope.trendData["jobs"][i]["id"] == id)
                        return i;
                }

                return -1;
            }
        }
    }
});

trends.controller('TrendController', function ($scope, $log, $http) {

    // Sidepanel setup (dates/times/jobs)
    $scope.dtBegin = new Date();
    $scope.dtBegin.setHours(0);
    $scope.dtBegin.setMinutes(0);
    $scope.dtBegin.setSeconds(0);
    $scope.dtBegin.setMilliseconds(0);
    $scope.beginOpened = false;
    $scope.dtEnd = new Date(new Date().getTime());
    $scope.endOpened = false;
    $scope.minDate = new Date('December 31, 2009 00:00:00');
    $scope.jobSearch = "";
	
	$scope.loading = false;

    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };
    $scope.dateFormatString = 'MMM dd yyyy HH:mm:ss';

    $scope.beginOpen = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.beginOpened = true;
    };

    $scope.endOpen = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.endOpened = true;
    };

    $scope.jobs = [];
    $scope.selectedJobs = [];

    var jobsPromise = $http.get('/api/job');
    jobsPromise.success(function(data, status, headers, config) {
        $scope.jobs = data.jobs.map(cleanJob);
    });
    jobsPromise.error(function(data, status, headers, config) {
        $log.error("Failed to load the job list from the API!");
    });

    // Watch for changes in selected jobs
    $scope.$watch('jobs|filter:{selected:true}', function(newValue, oldValue) {
        if (oldValue === newValue)
            return;
        $scope.selectedJobs = newValue;
        if (oldValue.length === 0 && newValue.length === 1)
            firstSelect();
        if($scope.keywords.length === 0 && $scope.selectedJobs.length > 0)
            $scope.getTrendlines();
    }, true);
	
	$scope.$watch('dtBegin', function(newValue, oldValue) {
        if (newValue.getTime() == oldValue.getTime())
            return;
        if (newValue.getTime() > new Date().getTime()){
			//console.log("date is in the future!");
			alert("Begin date should be in the past.");
			$scope.dtBegin = oldValue;
		}
		
		//if the start time is strictly after the end time, switch them
		if($scope.dtBegin.getTime() > $scope.dtEnd.getTime()){
			var temp = $scope.dtBegin;
			$scope.dtBegin = $scope.dtEnd;
			$scope.dtEnd = temp;
		}
    }, true);
	
	$scope.$watch('dtEnd', function(newValue, oldValue) {
        if (newValue.getTime() == oldValue.getTime())
            return;
        if (newValue.getTime() > new Date().getTime()){
			//console.log("date is in the future!");
			alert("End date shouldn't be in the future");
			$scope.dtEnd = oldValue;
		}
		
		//if the start time is strictly after the end time, switch them
		if($scope.dtBegin.getTime() > $scope.dtEnd.getTime()){
			var temp = $scope.dtBegin;
			$scope.dtBegin = $scope.dtEnd;
			$scope.dtEnd = temp;
		}
    }, true);

    $scope.$watch('granularity', function(newValue, oldValue) {
            if (oldValue === newValue)
                return;
            if($scope.keywords.length === 0 && $scope.selectedJobs.length > 0)
                $scope.getTrendlines();
        }, true);

    // Called upon the selection of the first job
    var firstSelect = function () {

    };

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

    var buildQueryObject = function() {
        var queryObject = {};
        queryObject['categoryID'] = $scope.selectedJobs.map(function(job) {
            return job.id;
        });
        queryObject['start_time'] = Math.round($scope.dtBegin.getTime() / 1000);
        queryObject['end_time'] = Math.round($scope.dtEnd.getTime() / 1000);
        return queryObject;
    };

    // --- END OF JOB PANEL CONTROL LOGIC ---

    $scope.keywords = [];
    $scope.granularity = 1;
    $scope.trendData = {};
    $scope.tweetTrends = true;
    $scope.imageTrends = true;
    $scope.videoTrends = true;

    $scope.getTrendlines = function() {
        if ($scope.selectedJobs.length == 0){
            window.alert("You must select at least one job for which to get a trendline");
            return;
        }

        //if the start time is strictly after the end time, switch them
		if($scope.dtBegin.getTime() > $scope.dtEnd.getTime()){
			var temp = $scope.dtBegin;
			$scope.dtBegin = $scope.dtEnd;
			$scope.dtEnd = temp;
		}

		$scope.loading = true;
		
		queryObject = buildQueryObject();
        queryObject["keyword"] = $scope.keywords;
        types = []
        if($scope.tweetTrends)
            types[types.length] = "tweet"
        if($scope.imageTrends)
            types[types.length] = "image"
        if($scope.videoTrends)
            types[types.length] = "video"
        queryObject["types"] = types
        if($scope.granularity != 0)
            queryObject["granularity"] = $scope.granularity;

        var trendlinePromise = $http.get('/api/gettrendline', {
            params: queryObject
        });

        trendlinePromise.success(function (data, status, headers, config) {
          console.log(data);
            $scope.trendData = {
                trendData: data,
                jobs: $scope.selectedJobs,
                tweetTrends: $scope.tweetTrends,
                imageTrends: $scope.imageTrends,
                videoTrends: $scope.videoTrends
            };
			
			$scope.loading = false;
            ////console.log(data);
        });
        trendlinePromise.error(function (data, status, headers, config) {
            $log.error("Failed to load trendline from the API!");
			$scope.loading = false;
        });
    };
});
