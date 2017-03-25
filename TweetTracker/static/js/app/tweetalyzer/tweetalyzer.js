var tweetalyzer = angular.module('tweetalyzer', ['ngRoute', 'ui.bootstrap', 'ttutilities.directives']);
var gdata;
// indexedDB support
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB.")
}



// The routing for this page is extremely simple
tweetalyzer.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: '/static/js/app/tweetalyzer/partials/analysis.html',
            controller: 'AnalysisController'
        }).
        otherwise({
            redirectTo: '/'
        })
}]);

// For sanitizing HTML
tweetalyzer.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

// $('ul.pagination > li').click(function(e) {
//     e.preventDefault();

//     var $previousActive = $('ul.pagination > li.active a');
//     $previousActive.removeClass('active');

//     var $this = $(this);
//     if (!$this.hasClass('active')) {
//         $this.addClass('active');
//     }
// });

    

// hide broken images
tweetalyzer.directive('img', function() {
    return {
        restrict: 'E',        
        link: function (scope, element, attrs) {     
            // show an image-missing image
            element.error(function() {
                var $select = element.closest('div.popup');
                $select.addClass('banished');
                $select.css('display', 'none');
            });
        }
    }
});

// Allowing time to change by dateformatstring
tweetalyzer.directive('datepickerPopup', function (){
  return {
    restrict: 'EAC',
    require: 'ngModel',
    link: function(scope, element, attr, controller) {
      //remove the default formatter from the input directive to prevent conflict
      controller.$formatters.shift();
    }
  }
});

// This directive manages a word cloud
tweetalyzer.directive('wordcloud', function() {
    return {
        restrict: 'A',
        scope: {
            words: '=ngModel'
        },
        link: function (scope, elem) {
            // Set some variables to use to draw the word cloud
            var fill = d3.scale.category20();
            var width = $(".tab-content").width() - 40;
            var height = width * .2; // TODO: Change these to match the screen

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
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
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



// Add the controller for the main analysis page
tweetalyzer.controller('AnalysisController', function ($scope, $filter, $log, $http) {
    
    $scope.currentIndex = 1;
    $scope.previousTab = '';
    $scope.storeIndexValues = [1, 1];

    // Only show image and video sorting radio buttons on the image and video tabs
    $scope.tabSelected = function(tabName) {
        if (tabName === "images" || tabName === "videos") {
            $('#sort-radio-buttons').fadeIn();
            reapplyIndexValue(tabName);
            var pageNum = $scope.currentIndex;
            updateIndex(tabName, pageNum);
            switchMediaTabIndex(tabName);
        } else {
            $('#sort-radio-buttons').fadeOut();
        }
    };

    var switchMediaTabIndex = function (tabName) {
        var pageNum = $scope.currentIndex;
        updateIndex(tabName, pageNum);
        updateImagesOrVideos(tabName);
    }

    var reapplyIndexValue = function (tabName) {
        var mediaTabs = ['images', 'videos'];
        var newTabAddress;
        for (newTabAddress = 0; newTabAddress < mediaTabs.length; newTabAddress++) {
            if (mediaTabs[newTabAddress] === tabName) {
                break;
            }
        }
        var prevTabAddress = (newTabAddress === 0) ? 1 : 0;
        $scope.storeIndexValues[prevTabAddress] = $scope.currentIndex;
        $scope.currentIndex = $scope.storeIndexValues[newTabAddress];
    }

    $scope.moveQuerySelection = function(tabName, type) {
        var pageNum = $scope.currentIndex;
        $scope.previousTab = tabName;

        if (type === "prev")
            pageNum = (pageNum > 1) ? pageNum-1 : pageNum;
        else // next
            pageNum++;

        $scope.currentIndex = pageNum;
        var isIndex1or2 = ($scope.currentIndex <= 2) ? prevDisabledManager(tabName, pageNum) : null;
        updateImagesOrVideos(tabName);
        updateIndex(tabName, pageNum);
    };

    var prevDisabledManager = function(tabName, pageNum) {
        // handles previous disabled
        var $prevDisabled = $('ul.pager.' + tabName + ' > li.previous' );
        if (pageNum > 1 && $prevDisabled.hasClass('disabled')) {
            $prevDisabled.removeClass('disabled');
        } else if (pageNum <= 1 && !$prevDisabled.hasClass('disabled')) {
            $prevDisabled.addClass('disabled');
        }    
    }

    var updateImagesOrVideos = function(tabName) {
        if (tabName === 'images') {
            getImages();
        } else if (tabName === 'videos') {
            getVideos();
        }
    };

    var updateIndex = function(tabName, pageNum) {
        $indexTarget = $('ul.pager.' + tabName + ' > li.index a');
        if (!$indexTarget.length) { //add index if it doesn't exist
            $insertTarget = $('ul.pager.' + tabName + ' > li.previous');
            $insertTarget.after('<li class="index"><a>' + pageNum + '</a></li>');
        } else { // empty and update index to new value
            $indexTarget.empty();
            $indexTarget.text(pageNum);
        }
    }

    // $scope.fire = 0;
    // $scope.pageSelected = function(pageNum, tabName, type) {
    //     // console.log('fire: ' + $scope.fire); $scope.fire++;
    //     var $previousActive = $('ul.pagination.' + tabName + ' > li.active'); //current active
    //     var $nextActive = null;
        
    //     // console.log('pN:' + pageNum + ' tN:' + tabName + ' tY:' + type);
    //     if (type === "num") {                                           
    //         $nextActive = $('li:has(a[page="' + pageNum + '"])');
    //     } else { 

    //         var currentIndex = Number($previousActive.find('a').attr('page'));
    //         var sturdyPageNum = currentIndex;

    //         if (type === "prev") {  

    //             var decrPage = currentIndex-1;  
    //             sturdyPageNum = decrPage >= 1 ? decrPage : sturdyPageNum;
    //             $nextActive = $('li:has(a[page="' + sturdyPageNum + '"])');

    //         } else if (type === "next") {  

    //             var incrPage = currentIndex+1;     
    //             var totalPages = $('ul.pagination.' + tabName + ' > li.num').length;
    //             // console.log(incrPage+'|'+totalPages);
    //             if (incrPage > totalPages) {
    //                 var additionalPage = confirm('Would you like to query for additional ' + tabName + '?')
    //                 if (additionalPage) {
    //                     $previousActive.after('<li class="num active"><a data-ng-click="pageSelected(' + incrPage + 
    //                                         ', \'images\', \'num\')" page="' + incrPage + '">' + incrPage + 
    //                                         '</a></li>');
    //                  } else {
    //                     $nextActive = $('li:has(a[page="' + sturdyPageNum + '"])');
    //                 }
    //             } else {
    //                 sturdyPageNum = incrPage;
    //                 $nextActive = $('li:has(a[page="' + sturdyPageNum + '"])');
    //             }
    //         }
    //     } 

    //     var giveNextActiveClass = $nextActive != null ? $nextActive.addClass('active') : null;
    //     $previousActive.removeClass('active');

    //     updateImagesOrVideos(tabName);
    // };

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
        if($scope.selectedJobs.length != 0)
            checkedJob();
    });
    jobsPromise.error(function(data, status, headers, config) {
        $log.error("Failed to load the job list from the API!");
    });

    // Watch for changes in selected jobs
    $scope.$watch('jobs|filter:{selected:true}', function(newValue, oldValue) {
        if (oldValue === newValue)
            return;
        $scope.selectedJobs = newValue;
        if (oldValue.length === 0 && newValue.length === 1){
            firstSelect();
            }
        if (newValue.length === 0)
            $('#update-button').attr('disabled', 'disabled');
        else
            $('#update-button').attr('disabled', false);
        if(oldValue != newValue && oldValue.length != 0){
            sessionStorage.clear();
            storeSearchResults();
            }
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
		if(oldValue.getTime() != newValue.getTime()){
		    sessionStorage.clear();
		    storeSearchResults();
		    }
    }, true);
	
	$scope.$watch('dtEnd', function(newValue, oldValue) {
        if (newValue.getTime() == oldValue.getTime())
            return;
        if (newValue.getTime() > new Date().getTime() + 6*60*60*1000){
			//console.log("date is in the future!");
			alert("End date shouldn't be in the future");
			$scope.dtEnd = oldValue;
		}
		if(oldValue.getTime() != newValue.getTime()){
		    sessionStorage.clear();
		    storeSearchResults();
		    }
		//if the start time is strictly after the end time, switch them
		if($scope.dtBegin.getTime() > $scope.dtEnd.getTime()){
			var temp = $scope.dtBegin;
			$scope.dtBegin = $scope.dtEnd;
			$scope.dtEnd = temp;
		}
    }, true);

    // Called firstSupon the selection of the first job
    var firstSelect = function () {
        // When one job is selected, we just want to get data up quickly
        console.log("in first select");
        getLocations();
        getTopics();
        getHashtags();
        getLinks();
        getUsers();
        getTweets();
		getImages();
		getVideos();
        getLDA();
        getYaks();
        getBots();
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

    var checkedJob = function() {
        selectedJobIds = $scope.selectedJobs.map(function(job) {return job.id;});
        for(var i=0;i<$scope.jobs.length;i++){
            if(selectedJobIds.includes($scope.jobs[i].id)){
                $scope.jobs[i].selected = true;
            }
        }
     };
    // Each of the tweetalyzer panels requires some common information, which
    // is set up here.
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

    // Set up the actual visualization stuff
    $scope.topics = [];
    $scope.users = [];
    $scope.hashtags = [];
    $scope.links = [];
    $scope.locations = [];
    $scope.tweets = [];
    $scope.images = [];
    $scope.videos = [];
    $scope.mapHide = false;
    $scope.hideMapText = "Hide Map";
    $scope.tabsLength = "col-lg-12";
    $scope.numberofTweets = 0;
    $scope.bots = [];

    // Controls how the tabs display -
    //
    // This may seem complex, but I think it's the easiest way to model the
    // states that Tweetalyzer can be in.
    $scope.tabStates = {
        topicsLoaded: false,
        topicsLoading: false,
        topicsError: false,
        usersLoaded: false,
        usersLoading: false,
        usersError: false,
        hashtagsLoaded: false,
        hashtagsLoading: false,
        hashtagsError: false,
        linksLoaded: false,
        linksLoading: false,
        linksError: false,
        tweetsLoaded: false,
        tweetsLoading: false,
        tweetsError: false,
        imagesLoaded: false,
        imagesLoading: false,
        imagesError: false,
        videosLoaded: false,
        videosLoading: false,
        videosError: false,
        botsLoaded: false,
        botsLoading: false,
        botsError: false
    };

    // When this function is called, a request is sent to the server to get a
    // word cloud for the time period specified by beginDate and endDate
    var getTopics = function () {
        if ($scope.selectedJobs.length == 0)
            return;

        $scope.tabStates.topicsError = false;
        $scope.tabStates.topicsLoaded = false;
        $scope.tabStates.topicsLoading = true;

        var queryObject = {
            job_ids: $scope.selectedJobs.map(function(job) { return job.id; }),
            begin_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000),
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
            sessionStorage.setItem("tw_topics",JSON.stringify($scope.topics));


            $scope.tabStates.topicsLoading = false;
            $scope.tabStates.topicsLoaded = true;
        });
        topicsPromise.error(function(data, status, headers, config) {
            $log.error("Failed to load top keywords from the API!");

            $scope.tabStates.topicsLoading = false;
            $scope.tabStates.topicsError = true;
        });
    };

    // Retrieves the User entities from the server
    var getUsers = function () {
        if ($scope.selectedJobs.length == 0)
            return;

        $scope.tabStates.usersError = false;
        $scope.tabStates.usersLoaded = false;
        $scope.tabStates.usersLoading = true;

        var queryObject = {
            job_ids: $scope.selectedJobs.map(function(job) { return job.id; }),
            begin_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000),
            limit: 30
        };

        var usersPromise = $http.get('/api/entities/users', {
            params: queryObject
        });
        usersPromise.success(function(data, status, headers, config) {
            $scope.users = data['users'];
            sessionStorage.setItem("tw_users",JSON.stringify($scope.users));

            $scope.tabStates.usersLoading = false;
            $scope.tabStates.usersLoaded = true;
        });
        usersPromise.error(function(data, status, headers, config) {
            $scope.tabStates.usersLoading = false;
            $scope.tabStates.usersError = true;
        });
    };

    //Retrieve top bots from the job
    var getBots = function(){

        if ($scope.selectedJobs.length == 0)
            return;

        $scope.tabStates.botsError = false;
        $scope.tabStates.botsLoaded = false;
        $scope.tabStates.botsLoading = true;

        queryObject = {};
        queryObject['job_ids'] = $scope.selectedJobs.map(function(job) { return job.id; });

        var botsPromise = $http.get('/api/entities/bots', {
            params: queryObject
        });

        botsPromise.success(function (data, status, headers, config) {
            $scope.bots = data.bots;
            sessionStorage.setItem("tw_bots",JSON.stringify(data));

            $scope.tabStates.botsLoading = false;
            $scope.tabStates.botsLoaded = true;
        });

        botsPromise.error(function(data, status, headers, config) {
            $scope.tabStates.botsLoading = false;
            $scope.tabStates.botsError = true;
        });

    };

    // Retrieves the Hashtags entities from the server
    var getHashtags = function () {
        if ($scope.selectedJobs.length == 0)
            return;

        $scope.tabStates.hashtagsError = false;
        $scope.tabStates.hashtagsLoaded = false;
        $scope.tabStates.hashtagsLoading = true;

        var queryObject = buildQueryObject();
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
            sessionStorage.setItem("tw_hashtags",JSON.stringify($scope.hashtags));

            $scope.tabStates.hashtagsLoading = false;
            $scope.tabStates.hashtagsLoaded = true;
        });
        hashtagsPromise.error(function(data, status, headers, config) {
            $scope.tabStates.hashtagsLoading = false;
            $scope.tabStates.hashtagsError = true;
        });
    };

    // Retrieves the Links entities from the server
    var getLinks = function () {
        if ($scope.selectedJobs.length == 0)
            return;

        $scope.tabStates.linksError = false;
        $scope.tabStates.linksLoaded = false;
        $scope.tabStates.linksLoading = true;

        var queryObject = buildQueryObject();
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
            sessionStorage.setItem("tw_links",JSON.stringify($scope.links));

            $scope.tabStates.linksLoading = false;
            $scope.tabStates.linksLoaded = true;
        });
        linksPromise.error(function (data, status, headers, config) {
            $scope.tabStates.linksLoading = false;
            $scope.tabStates.linksError = true;
        });
    };

    // Retrieves the locations from the server
    var getLocations = function () {
        if ($scope.selectedJobs.length === 0)
            return;

        $scope.locationsError = false;
        $scope.locationsLoaded = false;
        $scope.locationsLoading = true;

        var queryObject = {
            job_ids: $scope.selectedJobs.map(function(job) { return job.id; }),
            begin_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000)
        };

        var locationsPromise = $http.get('/api/entities/locations', {
            params: queryObject
        });

        locationsPromise.success(function (data, status, headers, config) {
            var tweetlocations = data["tweetlocations"];
            var imagelocations = data["imagelocations"];
            var videolocations = data["videolocations"];
            var locations = [];
            if(document.getElementById("tweetMapFilter").checked){
                locations = locations.concat(tweetlocations);
            } 
            if(document.getElementById("imageMapFilter").checked){
                 locations = locations.concat(imagelocations);
            }
            if(document.getElementById("videoMapFilter").checked) {
                locations = locations.concat(videolocations);
            }
            
            $scope.locations = locations;
            sessionStorage.setItem("tw_locations",JSON.stringify(locations));

            $scope.locationsLoading = false;
            $scope.locationsLoaded = true;
        });
        locationsPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load locations from the API!");

            $scope.locationsLoading = false;
            $scope.locationsError = true;
        });
    };

    var getTweets = function(){
        if ($scope.selectedJobs.length === 0)
            return;

        $scope.tabStates.tweetsError = false;
        $scope.tabStates.tweetsLoaded = false;
        $scope.tabStates.tweetsLoading = true;

        var queryObject = {
            categoryID: $scope.selectedJobs.map(function(job) { return job.id; }),
            start_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000)
        };

        var tweetsPromise = $http.get('/api/gettweets', {
            params: queryObject
        });
        tweetsPromise.success(function (data, status, headers, config) {
            $scope.tweets = data.tweets;
            //sessionStorage.setItem("tweets",JSON.stringify(data.tweets));
            addTweetData(data.tweets);
            $scope.tabStates.tweetsLoading = false;
            $scope.tabStates.tweetsLoaded = true;
            $scope.numberofTweets = data.count;
            sessionStorage.setItem("tw_numberofTweets",(data.count).toString());

        });
        tweetsPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load tweets from the API!");

            $scope.tabStates.tweetsLoading = false;
            $scope.tabStates.tweetsError = true;
        });
    };

    var getYaks = function () {
        // starts query for yikyaks in mongodb, handles state of the tab depending on state of query


        if ($scope.selectedJobs.length === 0)
            return;
        /* TODO: add me later for future efficiency increase
        //save parameters in local storage, if supported
        if (supports_html5_storage()) {
            var storage = window.localStorage;
            storage["begin"] = $scope.dtBegin.getTime() / 1000;
            storage["end"] = $scope.dtEnd.getTime() / 1000;

            var selectedIDs = [];
            for (i = 0; i < $scope.jobs.length; i++) {
                if ($scope.jobs[i].selected)
                    selectedIDs.push($scope.jobs[i].id);
            }
            storage["selectedJobIDs"] = JSON.stringify(selectedIDs);
        }*/

        $scope.tabStates.yaksError = false;
        $scope.tabStates.yaksLoaded = false;
        $scope.tabStates.yaksLoading = true;

        var queryObject = {
            categoryID: $scope.selectedJobs.map(function (job) {
                return job.id;
            }),
            start_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000)
        };

        var yaksPromise = $http.get('/api/getyaks', {
            params: queryObject
        });
        yaksPromise.success(function (data, status, headers, config) {
            console.log("retrieved yaks:")
            console.log(data)
            $scope.yaks = data;
            sessionStorage.setItem("tw_yaks",JSON.stringify(data));

            $scope.tabStates.yaksLoading = false;
            $scope.tabStates.yaksLoaded = true;
        });
        yaksPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load yaks from the API!");

            $scope.tabStates.yaksLoading = false;
            $scope.tabStates.yaksError = true;
        });
    };

	var getLDA = function(){
        if ($scope.selectedJobs.length === 0)
            return;

        var queryObject = {
            categoryID: $scope.selectedJobs.map(function(job) { return job.id; })
        };

        var tweetsPromise = $http.get('/api/gettopics', {
            params: queryObject
        });
        tweetsPromise.success(function (data, status, headers, config) {
			var colors = [ "#99B2FF", "#8AA0E6", "#7C90CF", "#7082BA", "#6575A7", "#5B6996",
						   "#525E87", "#4A557A", "#434C6E", "#3C4463"]
			gdata = data;
			$("#topicTS").html('<center><small>Shown topics are updated hourly.  Last updated: ' + new Date(data.updated *	1000) + '</small></center>');
			$("#graphContainer").html('<div id="divDist"></div>');
			for (var l = 0; l < data.cats.length; l++)
			{
				var chartname = data.cats[l];
				var name = '';
				for (var i = 0; i < $scope.selectedJobs.length; i++)
					if ($scope.selectedJobs[i].id == chartname)
						name = $scope.selectedJobs[i].name;
				$("#graphContainer").append('<div id="' + chartname + '" class="piechart"></div>');
				var obj = gdata.dist[l];
				totals = [];

				// calculate distribution percentages
				for (var i = 0; i < 10; i++)
				{
					totals[i] = 0;
					for (var j = 0; j < 10; j++)
						totals[i] += obj.topics[i].dist[j];
				}


				// sort colors to match the percentages
				colorlist = [];
				var tot = 0;
				for (var i = 0; i < 10; i++)
					if (totals[i] > tot)
						tot = totals[i];
				for (var i = 0; i < 10; i++)
					colorlist[i] = colors[Math.round(totals[i]/tot * 10) - 1];

				$.jqplot(chartname, [totals], {
					seriesColors: colorlist,
					seriesDefaults:{
						renderer:$.jqplot.PieRenderer,
						rendererOptions: {
							showDataLabels: true,
							fill: true,
							sliceMargin: 2,
							lineWidth: 5,
						}
					},
					title: {
						text: name
					},
					grid: {
						drawBorder: false,
						shadow: false
					},
					legend: {
						show: false,
						placement: 'e'
					}
				});

				$("#" + chartname).bind('jqplotDataHighlight', function(ev, seriesIndex, pointIndex, data){
					$("#divDist").html("");
					for (var i = 0; i < 5; i++)
						$("#divDist").append(gdata.dist[gdata.cats.indexOf(this.id)].topics[pointIndex].id[i] + '<br>');
					$("#divDist").css({'left': $("#" + this.id).position().left, 'top': $("#" + this.id).position().top, 'display': 'block'});
				});
				$("#" + chartname).bind('jqplotDataUnhighlight', function(ev, seriesIndex, pointIndex, data){
					$("#divDist").css({'display': 'none'});
				});

				$("#" + chartname).bind('jqplotDataClick', function(ev, seriesIndex, pointIndex, data){
					var selectedJob = this.id;

					var queryObject = {
						categoryID: selectedJob,
						distID: pointIndex,
						max: 50
					};

					var tweetsPromise = $http.get('/api/getreltweets', {
						params: queryObject
					});

					tweetsPromise.success(function (data, status, headers, config) {
						$("#ldaTweets").html('<table class="table table-bordered table-responsive"><thead><tr><th>Tweet</th><th>Relevance</th></tr></thead><tbody></tbody></table>');
						for (var i = 0; i < data.tweets.length; i++)
							$("#ldaTweets table tbody").append('<tr><td>' + data.tweets[i].text + "</td><td>" + parseFloat(data.tweets[i].dist * 100).toFixed(2) + "%</td></tr>");
					});
				})
				$('.jqplot-data-label').css("color","white");
			}
			$("#graphContainer").append('<div id="ldaTweets"></div>');
        });
        tweetsPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load lda from the API!");

        });
    };

	var getImages = function(){
        if ($scope.selectedJobs.length === 0)
            return;

        $scope.tabStates.imagesError = false;
        $scope.tabStates.imagesLoaded = false;
        $scope.tabStates.imagesLoading = true;

        var queryObject = {
            categoryID: $scope.selectedJobs.map(function(job) { return job.id; }),
            start_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000),
            sort_by: $('input[name=sorting]:checked').val(),
            limit: 30,
            skip: (getPageNumber("images") - 1) * 30
        };

        var imagesPromise = $http.get('/api/getimages', {
            params: queryObject
        });
        imagesPromise.success(function (data, status, headers, config) {
    		$scope.images = data;
    		sessionStorage.setItem("tw_images",JSON.stringify(data));
            $scope.tabStates.imagesLoading = false;
            $scope.tabStates.imagesLoaded = true;
        });
        imagesPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load images from the API!");

            $scope.tabStates.imagesLoading = false;
            $scope.tabStates.imagesError = true;
        });
    };

    var getVideos = function(){
        if ($scope.selectedJobs.length === 0)
            return;

        $scope.tabStates.videosError = false;
        $scope.tabStates.videosLoaded = false;
        $scope.tabStates.videosLoading = true;

        var queryObject = {
            categoryID: $scope.selectedJobs.map(function(job) { return job.id; }),
            start_time: Math.round($scope.dtBegin.getTime() / 1000),
            end_time: Math.round($scope.dtEnd.getTime() / 1000),
            sort_by: $('input[name=sorting]:checked').val(),
            limit: 15,
            skip: (getPageNumber("videos") - 1) * 15
        };

        var videosPromise = $http.get('/api/getvideos', {
            params: queryObject
        });
        videosPromise.success(function (data, status, headers, config) {
			$scope.videos = data;
            sessionStorage.setItem("tw_videos",JSON.stringify(data));
            $scope.tabStates.videosLoading = false;
            $scope.tabStates.videosLoaded = true;
        });
        videosPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load videos from the API!");

            $scope.tabStates.videosLoading = false;
            $scope.tabStates.videosError = true;
        });
    };

    // var getPageNumber = function(tabName){
    //     var page = 1;
    //     $selectedPage = $("ul.pagination." + tabName + " > li.active a");
    //     page = ($selectedPage.attr('page') != (null || undefined)) ? $selectedPage.attr('page') : page;
    //     return page;
    // };

    var removeErroneousVideos = function(){
        var $defaultImage = $("img[src*='default']");
        $defaultImage.each(function(){
            var youtubeID = $(this).attr('value'); 
            $.get("http://gdata.youtube.com/feeds/api/videos/"+youtubeID, function(data, status){
                console.log(status);
                if(status == 403){
                    var $this = $(this).closest('div.popup');
                    $this.addClass('banished');
                    $this.css('display', 'none');
                }                
            }); 
        });
    }

    var getPageNumber = function(tabName) {
        var page = $scope.currentIndex;
        return page;
    }

	$scope.drawPlots = getLDA;

    //called when the hide button is clicked
    $scope.hideMap = function() {

        if($scope.mapHide == true){
            $('div#lowerpart').prepend($('#tabs'));
            $('#map').fadeIn();
            $('div#upperpart > div#tabs').hide();
            $scope.mapHide = false;
            $scope.hideMapText = "Hide Map";
            $scope.tabsLength = "col-lg-12";
            $('html, body').animate({ scrollTop: $('div#lowerpart > div#tabs').offset().top }, 'slow');
        }
        else{
            $('#map').fadeOut();
            $('#upperpart').prepend($('#tabs'));
            $('div#lowerpart > div#tabs').hide();
            $scope.mapHide = true;
            $scope.hideMapText = "Show Map";
            $scope.tabsLength="col-lg-9";
            $('html, body').animate({ scrollTop: $('div#upperpart > div#tabs').offset().top }, 'slow');
        }
       return;
    };

     $scope.convTracker = function(rid){
        window.open('/api/crawl?id='+rid,'_blank');
        return;
    };
    
    // When the update button is clicked
    $scope.updateAnalysis = function() {
        if ($scope.selectedJobs.length == 0)
            return; // This button does work if you don't select jobs

		//if the start time is strictly after the end time, switch them
		if($scope.dtBegin.getTime() > $scope.dtEnd.getTime()){
			var temp = $scope.dtBegin;
			$scope.dtBegin = $scope.dtEnd;
			$scope.dtEnd = temp;
		}

		getImages();
        getVideos();

        getLocations();
//        TODO: Make the order of updates depend on currently selected tab
        getTopics();
        getUsers();
        getHashtags();
        getLinks();
        getTweets();
 		getLDA();
        getYaks();
 		getBots();
        //store form data in sessionStorage
 		storeSearchResults();
    };
    // function to store data in sessionStorage
    var storeSearchResults = function() {

        var mapTweets = document.getElementById("tweetMapFilter").checked;
        var mapImages = document.getElementById("imageMapFilter").checked;
        var mapVideos = document.getElementById("videoMapFilter").checked;

        var tw_searchData = {
            filterTweets : mapTweets,
            filterImages : mapImages,
            filterVideos : mapVideos,
            }
        sessionStorage.setItem("dtBegin" , JSON.stringify($scope.dtBegin));
        sessionStorage.setItem("dtEnd" , JSON.stringify($scope.dtEnd));
        sessionStorage.setItem("jobSearch" , JSON.stringify($scope.jobSearch));
        sessionStorage.setItem("selectedJobs" , JSON.stringify($scope.selectedJobs));


        sessionStorage.tw_searchData = JSON.stringify(tw_searchData);
        sessionStorage.setItem("tw_flag", "true");
    }


    var makeTabsVisible = function() {
        $scope.tabStates.imagesLoading = false;
        $scope.tabStates.imagesLoaded = true;
        $scope.tabStates.videosLoading = false;
        $scope.tabStates.videosLoaded = true;
        $scope.locationsLoading = false;
        $scope.locationsLoaded = true;
        $scope.tabStates.tweetsLoading = false;
        $scope.tabStates.tweetsLoaded = true;
        $scope.tabStates.topicsLoading = false;
        $scope.tabStates.topicsLoaded = true;
        $scope.tabStates.usersLoading = false;
        $scope.tabStates.usersLoaded = true;
        $scope.tabStates.hashtagsLoading = false;
        $scope.tabStates.hashtagsLoaded = true;
        $scope.tabStates.linksLoading = false;
        $scope.tabStates.linksLoaded = true;
        $scope.tabStates.yaksLoading = false;
        $scope.tabStates.yaksLoaded = true;
        $scope.tabStates.botsLoading = false;
        $scope.tabStates.botsLoaded = true;
    }

    //add tweet data to IndexedDB
    function addTweetData(tweets)
    {

        var tweetdb;

        var request = window.indexedDB.open("twDatabase", 1);

        request.onerror = function(e) {
             console.log("error: "+ e);
        };
        request.onupgradeneeded = function(e) {
            console.log("running onupgradeneeded");
            var thisDB = e.target.result;

            if(!thisDB.objectStoreNames.contains("tweetStore")) {
                thisDB.createObjectStore("tweetStore");
            }
        }


        request.onsuccess = function(e) {
            tweetdb = e.target.result;
            var transaction = tweetdb.transaction(["tweetStore"],"readwrite");
            var store = transaction.objectStore("tweetStore");

            var tweetData = {"tweets":tweets};
            //Perform the add
            var query = store.put(tweetData,"tweetData");

            query.onerror = function(e) {
                console.log("Error",e.target.error.name);
                //some type of error handler
            }

            query.onsuccess = function(e) {
                console.log("added");
                tweetdb.close();
            }
        };

    }
    //get tweet data from IndexedDB
    function getTweetData(){

        var tweetdb;

        var request = window.indexedDB.open("twDatabase", 1);

        request.onerror = function(e) {
             console.log("error: "+ e);
        };


        request.onsuccess = function(e) {
            tweetdb = e.target.result;
            var transaction = tweetdb.transaction(["tweetStore"], "readonly");
            var store = transaction.objectStore("tweetStore");
            var query =  store.get("tweetData");

            query.onsuccess = function(e) {

                var result = e.target.result;
                $scope.tweets = result.tweets;
                tweetdb.close();
            }
            query.onerror = function(e) {
                console.log("Error",e.target.error.name);
                //some type of error handler
            }

        };

 }

    // Load form data from sessionStorage
     if(sessionStorage.getItem("dtBegin") != null){
        $scope.dtBegin = new Date(JSON.parse(sessionStorage.getItem("dtBegin")));
        $scope.dtEnd = new Date(JSON.parse(sessionStorage.getItem("dtEnd")));
        $scope.jobSearch = JSON.parse(sessionStorage.getItem("jobSearch"));
        $scope.selectedJobs = JSON.parse(sessionStorage.getItem("selectedJobs"));

    }
    // Load search results from sessionStorage
    if(sessionStorage.getItem("tw_flag")=="true"){
        lastSearchResults = JSON.parse(sessionStorage.getItem("tw_searchData"));

        document.getElementById("tweetMapFilter").checked = lastSearchResults.filterTweets;
        document.getElementById("imageMapFilter").checked = lastSearchResults.filterImages;
        document.getElementById("videoMapFilter").checked = lastSearchResults.filterVideos;

        $scope.images = JSON.parse(sessionStorage.getItem("tw_images"));
        $scope.videos =  JSON.parse(sessionStorage.getItem("tw_videos"));
        $scope.locations = JSON.parse(sessionStorage.getItem("tw_locations"));
        $scope.tweets = getTweetData();
        $scope.numberofTweets = Number(sessionStorage.getItem("tw_numberofTweets"));
        $scope.topics =  JSON.parse(sessionStorage.getItem("tw_topics"));
        $scope.users = JSON.parse(sessionStorage.getItem("tw_users"));
        $scope.hashtags = JSON.parse(sessionStorage.getItem("tw_hashtags"));
        $scope.links = JSON.parse(sessionStorage.getItem("tw_links"));
        $scope.yaks = JSON.parse(sessionStorage.getItem("tw_yaks"));
        $scope.bots = JSON.parse(sessionStorage.getItem("tw_bots"));

        makeTabsVisible();
       }


});
tweetalyzer.controller('HDXController', function ($scope, $filter, $log, $http) {
    var map = window.global_map_pointer;
    // Array to keep track of which layers we are displaying on the leaflet map, keyed by their file names
    var layers = window.global_layers_pointer;
    // Checkbox control box for displaying files
    var layer_control = L.control.layers(null, layers).addTo(map);

    // Get country from country select
    $scope.datasets = [];
    var countrySelection = document.getElementById("countrySelect");
    $scope.country = countrySelection.options[countrySelection.selectedIndex].text;
    getDatasetsForCountry($scope, $http, $log);

    // if country selection changes, update table
    $("#countrySelect").on('change', function () {
        countrySelection = document.getElementById("countrySelect");
        $scope.country = countrySelection.options[countrySelection.selectedIndex].text;
        getDatasetsForCountry($scope, $http, $log);
    });

    // Makes an API call to get the datasets for a given country
    function getDatasetsForCountry($scope, $http, $log) {
        // Country datasets promise
        var datasetsPromise = $http.get('/api/hdx/datasets/countries/' + $scope.country);
        datasetsPromise.success(function (data, status, headers, config) {
            var hdx_datasets = data["datasets"];

            $scope.datasets = hdx_datasets;
        });
        datasetsPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load data set from the API!");
        });
    }

    $scope.processFile = function (file) {
        filename = file.filename
        fileurl = file["url"]
        var datasetsPromise = $http.get('/api/hdx/getfileextension/' + filename);
        datasetsPromise.success(function (data, status, headers, config) {
            if (data === "no file") {
                alert("Sorry, this file no longer exists")
            }
            else {
                displayFile(filename, "", file.format, fileurl)
            }
        });
        datasetsPromise.error(function (data, status, headers, config) {
            alert("There was an error obtaining the file. Please try again later.")
        });
    };

    function displayFile(filename, extension, format, fileurl) {

        if (filename.indexOf(".csv") > -1 || extension.indexOf(".csv") > -1){
            console.log("Displaying");
            parseCSV(filename);
        }
        else if (filename.indexOf(".tsv") > -1 || extension.indexOf(".tsv") > -1) {
            console.log("Displaying tsv");
            parseTSV(filename);
        }
        else if (filename.indexOf(".txt") > -1 || extension.indexOf(".txt") > -1)  {
            console.log("Displaying txt");
            parseTxt(filename);
            console.log("Done parsing txt");
        }
        else if (filename.indexOf(".xml") > -1 || extension.indexOf(".xml") > -1)  {
            console.log("Displaying xml");
            parseXML(filename);
            console.log("Done parsing xml");
        }
        else if (filename.indexOf(".pdf") > -1 || extension.indexOf(".pdf") > -1) {
            console.log("Displaying pdf");
            parsePDF(filename, fileurl);
        }
        else if (filename.indexOf(".kml") > -1 || extension.indexOf(".kml") > -1) {
            console.log("Displaying kml");
            displayKML(filename);
        }
        else if (filename.indexOf("shp") > -1 || extension.indexOf(".shp") > -1 || format.indexOf("shape") > -1 || format.indexOf("SHP") > -1 || format.indexOf("shp") > -1 || format.indexOf("SHAPE") > -1) {
            console.log("Displaying shape file" + filename);
            displayShapeFile(filename);
        }
        else if (filename.indexOf("json") > -1 || extension.indexOf(".json") > -1 || extension.indexOf(".geojson") > -1
                 || format.indexOf("GeoJSON") > -1 || format.indexOf("JSON") > -1)
        {
            console.log("Displaying geoJSON file");
            displayGeoJSON(filename);
        }
        /*
        else if (filename.indexOf(".xls") > -1 || extension.indexOf(".xls") > -1 || extension.indexOf(".xlsx") > -1
                 || format.indexOf("Excel") > -1)
        {
            console.log("Displaying Excel file.");
            displayExcel(filename);
        }
        */
        else {
            alert("That file cannot be opened in TweetTracker. Please use the download button to downloaded it and view it on your computer.")
        }
    }

    function parseTxt(filename) {
        $.ajax({
            type: "GET",
            url: "/api/hdx/getfile/" + filename,
            dataType: "text",
            success: function (result) {
                var target = $('#navbarTest');
                $("<div></div>").text(result).dialog({
                    position: {my: "center top", at: "center bottom", of: target},
                    height: 500,
                    title: filename,
                    width: 700,
                    overflow: scroll,
                    show: {
                        effect: "clip",
                        duration: 700
                    },
                    hide: {
                        effect: "clip",
                        duration: 500
                    }
                });
            },
            error: function (result) {
                console.log("ERROR!");
            }
        });
    }

    function parseXML(filename) {
        $.ajax({
            type: "GET",
            url: "/api/hdx/getfile/" + filename,
            dataType: "text",
            success: function (result) {
                var target = $('#navbarTest');
                $("<div></div>").text(result).dialog({
                    position: {my: "center top", at: "center bottom", of: target},
                    height: 500,
                    title: filename,
                    width: 700,
                    overflow: scroll,
                    show: {
                        effect: "clip",
                        duration: 700
                    },
                    hide: {
                        effect: "clip",
                        duration: 500
                    }
                });
            },
            error: function (result) {
                console.log("ERROR!");
            }
        });
    }

    function parsePDF(filename, fileurl) {
        var target = $('#navbarTest');
        var div = document.createElement('div');
        var srcpath = fileurl;
        var embedHTML = ["<iframe src=\"", srcpath, "\" height=\"490px\" width=\"690px\"></iframe>"].join(" ");
        $("<div></div>").html(embedHTML).dialog({
            position: {my: "center top", at: "center bottom", of: target},
            height: 500,
            title: filename,
            width: 700,
            overflow: scroll,
            show: {
                effect: "clip",
                duration: 700
            },
            hide: {
                effect: "clip",
                duration: 500
            }
        });
    }

    function parseCSV(filename) {
        var target = $('#navbarTest');
        var div = document.createElement('div');
        d3.text("/api/hdx/getfile/" + filename, function (data) {
            var parsedCSV = d3.csv.parseRows(data);
            if (parsedCSV == null) {
                alert("Error displaying CSV. Please download it and view it on your computer.")
            }
            var container = d3.select(div)
                .append("table")
                .attr("class","csv-dialog-table table table-striped table-hover table-bordered")
                .append("tbody")

                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")
                .attr("class", "success")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td")
                .text(function (d) {
                    return d.substring(0, 100);
                });
        });

        $("<div></div>").html(div).dialog({
            position: {my: "center top", at: "center bottom", of: target},
            height: 500,
            title: filename,
            width: 700,
            overflow: scroll,
            show: {
                effect: "clip",
                duration: 700
            },
            hide: {
                effect: "clip",
                duration: 500
            }
        });
    }

    function parseTSV(filename) {
        var target = $('#navbarTest');
        var div = document.createElement('div');
        d3.text("/api/hdx/getfile/" + filename, function (data) {
            var parsedCSV = d3.tsv.parseRows(data);
            if (parsedCSV == null) {
                alert("Error displaying TSV. Please download it and view it on your computer.")
            }
            var container = d3.select(div)
                .append("table")
                .attr("class","tsv-dialog-table table table-striped table-hover table-bordered")
                .append("tbody")

                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")
                .attr("class", "success")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td")
                .text(function (d) {
                    return d.substring(0, 100);
                });
        });

        $("<div></div>").html(div).dialog({
            position: {my: "center top", at: "center bottom", of: target},
            height: 500,
            title: filename,
            width: 700,
            overflow: scroll,
            show: {
                effect: "clip",
                duration: 700
            },
            hide: {
                effect: "clip",
                duration: 500
            }
        });

    }

    function displayKML(filename) {
        var kmlLayer = omnivore.kml("/api/hdx/getfile/" + filename)
            .on('ready', function () {
                map.fitBounds(kmlLayer.getBounds());
                kmlLayer.eachLayer(function (marker) {
                    var toDisplay = "<strong>Name:</strong> " + marker.feature.properties.name + "</br><strong>Coordinates:</strong> " + marker.feature.geometry.coordinates + "</br><strong>Description:</strong></br>" + marker.feature.properties.description;
                    marker.bindPopup(toDisplay);
                });
                layers[filename] = kmlLayer;
                layer_control.addOverlay(layers[filename], filename);

            }).addTo(map);

    }

    function displayShapeFile(filename) {
        var shape_as_geo = L.geoJson({features: []}, {
            onEachFeature: function popUp(f, l) {
                var out = [];
                if (f.properties) {
                    for (var key in f.properties) {
                        out.push(key + ": " + f.properties[key]);
                    }
                    l.bindPopup(out.join("<br />"));
                }
            }
        }).addTo(map);

        var base = "/api/hdx/getfile/" + filename;

        var worker = cw(function(base,cb){
            importScripts('/static/js/libs/shp.min.js');
            shp(base).then(cb);
        });
        //worker can be called multiple times
        worker.data(cw.makeUrl(base)).then(function(data){
            shape_as_geo.addData(data);
            layers[filename] = shape_as_geo;
            layer_control.addOverlay(layers[filename], filename);
        });
    }

    function displayGeoJSON(filename) {
        var base = "/api/hdx/getfile/" + filename;
        var geojsonLayer = new L.GeoJSON.AJAX(base, {onEachFeature:popUp}).addTo(map);

        function popUp(f,l){
            var out = [];
            if (f.properties){
                for(key in f.properties){
                    out.push(key+": "+f.properties[key]);
                }
                l.bindPopup(out.join("<br />"));
            }
        }
        layers[filename] = geojsonLayer;
        layer_control.addOverlay(layers[filename], filename);
    }

    $scope.downloadFile = function (file) {
        console.log("downloading file")
        var a = document.createElement('a');
        a.href = "/api/hdx/getfile/" + filename
        a.style.display = 'none';
        a.download = ""
        document.body.appendChild(a);
        a.click();
        delete a;
    };
});

