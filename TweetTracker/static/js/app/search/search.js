var search = angular.module('search', ['ngRoute', 'ui.bootstrap', 'ttutilities.directives', ]);

// Routing
search.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
    $routeProvider.
        when('/search', {
            templateUrl: '/static/js/app/search/partials/search.html',
            controller: 'SearchController'
        }).
        when('/searchResults/:queryString', {
            templateUrl: '/static/js/app/search/partials/searchResults.html',
            controller: 'SearchResultsController'
        }).
        otherwise({
            redirectTo: '/search'
        });

    // "/^\s*(https?|ftp|mailto|tel|file|blob):/" is the default regex for angular's whitelisting of url's. adding blob allows for data exporting
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);

search.directive('img', function () {
    return {
        restrict: 'E',        
        link: function (scope, element, attrs) {     
            // show an image-missing image
            if (element.hasClass('insta')) {
                element.error(function () {
                    var url = 'http://cdn.macrumors.com/article-new/2012/04/instagram-150x1501.png';
                    element.prop('src', url);
                });
                element.css({'height': '100px', 'width': '100px'});
            }
        }
    }
});

// Allowing time to change by dateformatstring
search.directive('datepickerPopup', function (){
  return {
    restrict: 'EAC',
    require: 'ngModel',
    link: function(scope, element, attr, controller) {
      //remove the default formatter from the input directive to prevent conflict
      controller.$formatters.shift();
    }
  }
});

// This is the main controller for search
search.controller('SearchController', function ($scope, $location, $log, $http) {

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
        if (oldValue.length === 0 && newValue.length === 1)
            firstSelect();
        if(oldValue != newValue && oldValue.length != 0){
            sessionStorage.clear();
            storeSearchForm();
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
		    storeSearchForm();
		    }
    }, true);
	
	$scope.$watch('dtEnd', function(newValue, oldValue) {
        if (newValue.getTime() == oldValue.getTime())
            return;
        if (newValue.getTime() > new Date().getTime() + 24*60*60*1000){
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
		if(oldValue.getTime() != newValue.getTime()){
		    sessionStorage.clear();
		    storeSearchForm();
		    }
    }, true);

    // Called upon the selection of the first job
    var firstSelect = function () {};

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
        queryObject['job_ids'] = $scope.selectedJobs.map(function(job) {
            return job.id;
        });
        queryObject['begin_time'] = Math.round($scope.dtBegin.getTime() / 1000);
        queryObject['end_time'] = Math.round($scope.dtEnd.getTime() / 1000);
        return queryObject;
    };

    // --- END OF JOB PANEL CONTROL LOGIC ---

    $scope.tags = [];
    $scope.tagsAND = [];
    $scope.tagsANDNOT = [];

    $scope.geoboxes = [{
       dummy: true,
       nwLat: 0,
       nwLng: 0,
       neLat: 0,
       neLng: 0,
       seLat: 0,
       seLng: 0,
       swLat: 0,
       swLng: 0
    }];

    $scope.geoboxTable = {};
    $scope.unnamedCount = 1;

    $scope.queryObj = {};

    $scope.getSearchResults = function() {
        if($scope.selectedJobs.length == 0){
            window.alert("You must select at least one job before searching");
            return;
        }

        //if the start time is strictly after the end time, switch them
        if($scope.dtBegin.getTime() > $scope.dtEnd.getTime()){
            var temp = $scope.dtBegin;
            $scope.dtBegin = $scope.dtEnd;
            $scope.dtEnd = temp;
        }


        $scope.queryObj = buildQueryObject();

        box1 = getParamArrayFromTags($scope.tags);
        box2 = getParamArrayFromTags($scope.tagsAND);
        box3 = getParamArrayFromTags($scope.tagsANDNOT)

        boxObj = {
            box1: box1,
            box2: box2,
            box3: box3
        };

        $scope.queryObj.query = boxObj;
        $scope.queryObj.skip = 0;

        console.log($scope.queryObj);
        //Store form data in sessionStorage
        storeSearchForm();
        $location.path('/searchResults/' + JSON.stringify($scope.queryObj));
    };

    // Store form data in sessionStorage
     var storeSearchForm = function() {
        var se_searchData = {
            tags:$scope.tags,
            tagsAND: $scope.tagsAND,
            tagsANDNOT: $scope.tagsANDNOT,
            geoboxes: $scope.geoboxes,
            geoboxTable: $scope.geoboxTable
            }

        sessionStorage.setItem("dtBegin" , JSON.stringify($scope.dtBegin));
        sessionStorage.setItem("dtEnd" , JSON.stringify($scope.dtEnd));
        sessionStorage.setItem("jobSearch" , JSON.stringify($scope.jobSearch));
        sessionStorage.setItem("selectedJobs" , JSON.stringify($scope.selectedJobs));

        sessionStorage.se_searchData = JSON.stringify(se_searchData);
        sessionStorage.setItem("se_flag", "true");
    };




    $scope.sendName = function(){
        var name = window.prompt("Please enter a name for this geobox - ","");

        if(name == null){
            $scope.geoboxes = [{
               dummy: true,
               nwLat: 0,
               nwLng: 0,
               neLat: 0,
               neLng: 0,
               seLat: 0,
               seLng: 0,
               swLat: 0,
               swLng: 0
            }];

            return;
        }

        while(name in $scope.geoboxTable){
            name = window.prompt("A geobox with this name already exists. Please enter a unique name","");

            if(name == null){
                $scope.geoboxes = [{
                   dummy: true,
                   nwLat: 0,
                   nwLng: 0,
                   neLat: 0,
                   neLng: 0,
                   seLat: 0,
                   seLng: 0,
                   swLat: 0,
                   swLng: 0
                }];

                return;
            }
        }

        if(name == ""){
            name = "unnamed " + $scope.unnamedCount;
            $scope.unnamedCount += 1;
        }

        $scope.geoboxTable[name] = $scope.geoboxes[$scope.geoboxes.length - 1];
        ////console.log($scope.geoboxes);
        ////console.log($scope.geoboxTable);

        //$scope.tags.push("geobox: " + name);
        $("#searchKeywords").addTag("geobox: " + name);
        //console.log(name);
        //console.log($scope.tags);

        $('.tag').draggable({
            helper:"clone"
        });

        $scope.geoboxes = [{
           dummy: true,
           nwLat: 0,
           nwLng: 0,
           neLat: 0,
           neLng: 0,
           seLat: 0,
           seLng: 0,
           swLat: 0,
           swLng: 0
        }];
    };

    $scope.deleteTagName = function(tag){
        //console.log($scope.tags);
        //console.log($scope.tagsAND);
        //console.log($scope.tagsANDNOT);
        if($scope.tags.indexOf("geobox: " + tag) > -1 || $scope.tagsAND.indexOf("geobox: " + tag) > -1 || $scope.tagsANDNOT.indexOf("geobox: " + tag) > -1){
            //console.log("not deleting name");
            return; //if the tag exists in one of the boxes because deleteTagName was called when a tag was dragged from one box to another, don't delete the tag from the table
        }
        delete $scope.geoboxTable[tag];
    }

    var getParamArrayFromTags = function(arr){
        box = [];

        for(var i = 0; i < arr.length; i++){
            if (arr[i].indexOf('geobox: ') == 0){
                obj = {
                    type: 'geo',
                    data: $scope.geoboxTable[arr[i].slice(8)]
                };

                box.push(obj);
            }
            else{
                arr[i] = arr[i].trim();
                if (arr[i][0] == '@')
                {
                    obj = {
                        type: 'user',
                        data: arr[i].substr(1)
                    };
                    box.push(obj);
                }
 //               else
 //               {
                // Not an optimal solution, this makes user searches also search for the user as a keyword.
                // Uncomment else to make it only do one or the other.
                obj = {
                    type: 'key',
                    data: arr[i].toLowerCase()
                };
                box.push(obj);
 //               }

                
            }
        }

        return box;
    };

    //Load form data from sessionStorage
    if(sessionStorage.getItem("dtBegin") != null){
        $scope.dtBegin = new Date(JSON.parse(sessionStorage.getItem("dtBegin")));
        $scope.dtEnd = new Date(JSON.parse(sessionStorage.getItem("dtEnd")));
        $scope.jobSearch = JSON.parse(sessionStorage.getItem("jobSearch"))
        $scope.selectedJobs = JSON.parse(sessionStorage.getItem("selectedJobs"))

    }

   //Load form data from sessionStorage
    if(sessionStorage.getItem("se_flag")=="true"){
        lastSearchResults = JSON.parse(sessionStorage.getItem("se_searchData"));
        $scope.tags = lastSearchResults.tags;
        $scope.tagsAND = lastSearchResults.tagsAND;
        $scope.tagsANDNOT = lastSearchResults.tagsANDNOT;
        $scope.geoboxes = lastSearchResults.geoboxes;
        $scope.geoboxTable = lastSearchResults.geoboxTable;
    }

});

search.controller('SearchResultsController', function ($scope, $http, $location, $log, $routeParams, $timeout){
    $scope.numberDisplayed = 0;
    $scope.numberDisplayedImages = 0;
    $scope.numberDisplayedVideos = 0;
    $scope.totalNumber = 0;
    $scope.totalNumberImages = 0;
    $scope.totalNumberVideos = 0;
    $scope.queryObj = JSON.parse($routeParams['queryString']);
    $scope.queryObj.skip = 0;
    $scope.searchResults = [];
    $scope.imageSearchResults = [];
    $scope.videoSearchResults = [];
    $scope.exportTable = {};
    $scope.exportTableImages = {};
    $scope.exportTableVideos = {};
    $scope.totalDisplay = "none";
    $scope.exportAddress = "";
    $scope.fileName = "data";
    $scope.fileType = "json";
    $scope.predicate = "timestamp"; //controls the sorting of the results table, initially sort by timestamp
	$scope.loading = true;

    //this section handles displaying the results when the page is first loaded

    var searchPromise = $http.get('/api/three_search', {
        params: $scope.queryObj
    });
    
    searchPromise.success(function (data, status, headers, confcg) {
        $scope.searchResults = data.tweets;
        $scope.imageSearchResults = addFieldsForDisplayForImagesAndVideos(data.images);
        $scope.videoSearchResults = addFieldsForDisplayForImagesAndVideos(data.videos);
        $scope.totalNumber =  data.count;
        $scope.totalNumberImages =  data.image_count;
        $scope.totalNumberVideos =  data.video_count;
        $scope.numberDisplayed = data.tweets.length;
        $scope.numberDisplayedImages = data.images.length;
        $scope.numberDisplayedVideos = data.videos.length;
        $scope.searchResults = addFieldsForDisplay($scope.searchResults);

        console.log(data);
        for(i = 0; i < data.tweets.length; i++){
            $scope.exportTable[data.tweets[i]["id"]] = {
                searchString: data.tweets[i]["id_str"] + '-' + data.tweets[i]["catime"],
                export: false
            };
        }
        for(i = 0; i < data.images.length; i++){
            $scope.exportTableImages[data.images[i]["id"]] = {
                searchString: data.images[i]["id"] + '-' + data.images[i]["catime"],
                export: false
            };

            var time = data.images[i]["created_time"];
            var date = new Date(time);
            data.images[i]["created_time"] = date.toLocaleDateString();
        }
        for(i = 0; i < data.videos.length; i++){
            $scope.exportTableVideos[data.videos[i]["id"]] = {
                searchString: data.videos[i]["id"] + '*' + data.videos[i]["catime"],
                export: false
            };

            var date = new Date(data.videos[i]["date"]);
            data.videos[i]["date"] = date.toLocaleDateString();

            data.videos[i]["url"] = "https://www.youtube.com/watch?v=" + data.videos[i]["id"];
        }

        if($scope.numberDisplayed == $scope.totalNumber)
            disableGetMoreTweetsButtons();
        if($scope.numberDisplayedImages == $scope.totalNumberImages)
            disableGetMoreImagesButtons();
        if($scope.numberDisplayedVideos == $scope.totalNumberVideos)
            disableGetMoreVideosButtons();

        $scope.totalDisplay = "inherit";
		$scope.loading = false;
    });

    searchPromise.error(function (data, status, headers, config) {
        $log.error("Failed to load search results from the API!");
		$scope.loading = false;
    });
    
    
    //this part handles maintaining the page as the user uses it

    $scope.loadMoreResults = function(){
		$scope.loading = true;
        var usedAPI = getTabStringValue();
        if (usedAPI === "tweet") {
            $scope.queryObj.skip = $scope.numberDisplayed;
        } else if (usedAPI === "image") {
            $scope.queryObj.skip = $scope.numberDisplayedImages;
        } else if (usedAPI === "video") {
            $scope.queryObj.skip = $scope.numberDisplayedVideos;
        }

        var searchAndAppendPromise = $http.get('/api/three_search', {
            params: $scope.queryObj
        });

        searchAndAppendPromise.success(function (data, status, headers, config) {
            //console.log(data);

            if (usedAPI === "tweet") {

                $scope.searchResults = $scope.searchResults.concat(data.tweets);
                $scope.numberDisplayed = $scope.searchResults.length;
                $scope.searchResults = addFieldsForDisplay($scope.searchResults);

                for(i = 0; i < data.tweets.length; i++){
                    $scope.exportTable[data.tweets[i]["id"]] = {
                        searchString: data.tweets[i]["id_str"] + '-' + data.tweets[i]["catime"],
                        export: false
                    };
                }

                if($scope.numberDisplayed == $scope.totalNumber)
                    disableGetMoreTweetsButtons();

            } else if (usedAPI === "image") {

                $scope.imageSearchResults = $scope.imageSearchResults.concat(
                    addFieldsForDisplayForImagesAndVideos(data.images));
                $scope.numberDisplayedImages = $scope.imageSearchResults.length;

                for(i = 0; i < data.images.length; i++){
                    $scope.exportTableImages[data.images[i]["id"]] = {
                        searchString: data.images[i]["id"] + '-' + data.images[i]["catime"],
                        export: false
                    };

                    var time = data.images[i]["created_time"];
                    var date = new Date(time);
                    data.images[i]["created_time"] = date.toLocaleDateString();
                }

                if($scope.numberDisplayedImages == $scope.totalNumberImages)
                    disableGetMoreImagesButtons();


            } else { //video

                $scope.videoSearchResults = $scope.videoSearchResults.concat(
                    addFieldsForDisplayForImagesAndVideos(data.videos));
                $scope.numberDisplayedVideos = $scope.videoSearchResults.length;

                for(i = 0; i < data.videos.length; i++){
                    $scope.exportTableVideos[data.videos[i]["id"]] = {
                        searchString: data.videos[i]["id"] + '*' + data.tweets[i]["catime"],
                        export: false
                    };
                    var date = new Date(data.videos[i]["date"]);
                    data.videos[i]["date"] = date.toLocaleDateString();

                    data.videos[i]["url"] = "https://www.youtube.com/watch?v=" + data.videos[i]["id"];
                }

                 if($scope.numberDisplayedVideos == $scope.totalNumberVideos)
                    disableGetMoreVideosButtons();
            }
			
			$scope.loading = false;
        });

        searchAndAppendPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load search results from the API!");
			$scope.loading = false;
        });
    };

    $scope.loadAllResults = function(){
        //console.log("loading all results...");
    };

    $scope.exportSelected = function(){

        var usedAPI = getTabStringValue();

        $scope.fileName = determineOutputFileName(usedAPI);

        mediaIndices = [];
        var query = {};
        if (usedAPI === "tweet") {
            for(j in $scope.exportTable){
                if($scope.exportTable[j]["export"])
                    mediaIndices.push($scope.exportTable[j]["searchString"]);
            }
            query = {tweet_indices:mediaIndices};
        } else if (usedAPI === "image") {
            for(j in $scope.exportTableImages){
                if($scope.exportTableImages[j]["export"])
                    mediaIndices.push($scope.exportTableImages[j]["searchString"]);
            }
            query = {image_indices:mediaIndices};
        } else { //video
            for(j in $scope.exportTableVideos){
                if($scope.exportTableVideos[j]["export"])
                    mediaIndices.push($scope.exportTableVideos[j]["searchString"]);
            }
            query = {video_indices:mediaIndices};
        }

        $scope.fileType = "json"; //default data format

        if($('#' + usedAPI + '-xml').is(':checked')) {
            query["response_type"] = "XML";
            $scope.fileType = "xml";
        }

        query["remove_fields"] = {"cat": "false", "catime": "false", "rand": "false", "inserted_at": "false", "tweet-lang": "false"};

        //console.log($scope.exportTable);
        // console.log(query);

        var exportSelectedPromise = $http.post('/api/'+usedAPI, query);
		console.log(query);
        

        exportSelectedPromise.success(function (data, status, headers, config) {
            console.log(data);

            var url = URL || webkitURL;
            var onePerLine = "";
            var blob;
            var extension = '.json';

            if("response_type" in query){
                if(query["response_type"] === "XML"){
                  blob = new Blob([data],{type:"text/xml;charset=utf-8"});
                  extension = '.xml'
                }
            }
            else{
                if(usedAPI === "tweet"){
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

            
            if (navigator.appVersion.toString().indexOf('.NET') > 0)
                window.navigator.msSaveBlob(blob, "tweets" + extension);
            else
            {
                 $scope.exportAddress = url.createObjectURL(blob);
                 $timeout(function(){document.getElementById("invisibleDownloadLink").click();},10,false);
            }
            
        });

        exportSelectedPromise.error(function (data, status, headers, config) {
            $log.error("Failed to load export results from the API!");
        });

    };

    $scope.exportAll = function(){

        var usedAPI = getTabStringValue();

        $scope.fileName = determineOutputFileName(usedAPI);

        var query = $scope.queryObj;
        var extension = '.json';
        query["no_limit"] = true;
        query["skip"] = 0;
        query["remove_fields"] = {"cat": "false", "catime": "false", "rand": "false", "inserted_at": "false", "tweet-lang": "false"}

        query["response_type"] = "JSON";
        $scope.fileType = "json"; //default data format

        if($('#' + usedAPI + '-xml').is(':checked')) {
            query["response_type"] = "XML";
            $scope.fileType = "xml";
            extension = '.xml'
        }

        var exportAllPromise = $http.get('/api/three_search', {
            params: query
        });

        exportAllPromise.success(function (data, status, headers, config) {
            //console.log(data);

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

    $scope.selectAllToggle = function(){

        var usedAPI = getTabStringValue();
        if(usedAPI === "tweet") {
            if(allChecksSelected()){
                for(j in $scope.exportTable)
                    $scope.exportTable[j]['export'] = false;
            } else {
                for(j in $scope.exportTable)
                    $scope.exportTable[j]['export'] = true;
            }
        } else if (usedAPI === "image") {
            if(allChecksSelected()){
                for(j in $scope.exportTableImages)
                    $scope.exportTableImages[j]['export'] = false;
            } else {
                for(j in $scope.exportTableImages)
                    $scope.exportTableImages[j]['export'] = true;
            }
        } else { //video
            if(allChecksSelected()){
                for(j in $scope.exportTableVideos)
                    $scope.exportTableVideos[j]['export'] = false;
            } else {
                for(j in $scope.exportTableVideos)
                    $scope.exportTableVideos[j]['export'] = true;
            }
        }

    };

    $scope.translateTweetToEnglish = function(scope){
        var query = {};
        query["text"] = scope.tweet.text;

        var translatePromise = $http.get('/api/translate', {
            params: query
        });

        translatePromise.success(function (data, status, headers, config) {
            scope.tweet.text = data;
        });

        translatePromise.error(function (data, status, headers, config) {
            $log.error("Failed to translate tweet!");
        });
    }
	
	$scope.translateImageCaptionToEnglish = function(scope){
        var query = {};
        query["text"] = scope.image.caption.text;

        var translatePromise = $http.get('/api/translate', {
            params: query
        });

        translatePromise.success(function (data, status, headers, config) {
            scope.image.caption.text = data;
        });

        translatePromise.error(function (data, status, headers, config) {
            $log.error("Failed to translate tweet!");
        });
    }
	
	$scope.translateVideoDescriptionToEnglish = function(scope){
        var query = {};
        query["text"] = scope.video.description;

        var translatePromise = $http.get('/api/translate', {
            params: query
        });

        translatePromise.success(function (data, status, headers, config) {
            scope.video.description = data;
        });

        translatePromise.error(function (data, status, headers, config) {
            $log.error("Failed to translate tweet!");
        });
    }

    function addFieldsForDisplayForImagesAndVideos(media) {
      media.forEach(function(medium) {
        if (medium.location) {
          var lat = medium.location.latitude;
          var lng = medium.location.longitude;
          medium.latlngDisplay = lat.toPrecision(5) + '/' + lng.toPrecision(5);
        } else {
          medium.latlngDisplay = 'N/A';
        }
      });

      return media;
    }

    function addFieldsForDisplay(tweets){
        for(var i = 0; i < tweets.length; i++){
            date = new Date(tweets[i]["timestamp"]);
            tweets[i]["dateString"] = date.toUTCString();

            if(tweets[i].location.lat != 0 || tweets[i].location.lng != 0)
                tweets[i]["latlngDisplay"] = tweets[i].location.lat.toPrecision(5) + '/' + tweets[i].location.lng.toPrecision(5);
            else
                tweets[i]["latlngDisplay"] = 'N/A';
        }

        return tweets;
    };

    function disableGetMoreTweetsButtons(){
        $('#loadMoreTweetsTop').attr("disabled", "true");
        $('#loadMoreTweetsBottom').attr("disabled", "true");
    };

    function disableGetMoreImagesButtons(){
        $('#loadMoreImagesTop').attr("disabled", "true");
        $('#loadMoreImagesBottom').attr("disabled", "true");
    };

    function disableGetMoreVideosButtons(){
        $('#loadMoreVideosTop').attr("disabled", "true");
        $('#loadMoreVideosBottom').attr("disabled", "true");
    };

    function getTweetWithId(id){
        var usedAPI = getTabStringValue();
        if(usedAPI === "tweet") {
            for(i = 0; i < $scope.searchResults.length; i++){
                if($scope.searchResults[i].id == id)
                    return $scope.searchResults[i];
            }
        } else if (usedAPI === "image") {
            for(i = 0; i < $scope.imageSearchResults.length; i++){
                if($scope.imageSearchResults[i].id == id)
                    return $scope.imageSearchResults[i];
            }
        } else { //video
            for(i = 0; i < $scope.videoSearchResults.length; i++){
                if($scope.videoSearchResults[i].id == id)
                    return $scope.videoSearchResults[i];
            }
        }

        return null;
    };

    function allChecksSelected(){
        var usedAPI = getTabStringValue();

        if(usedAPI === "tweet") {
            for(j in $scope.exportTable){
                if(!$scope.exportTable[j]['export'])
                    return false;
            }
        }
        else if (usedAPI === "image") {
            for(j in $scope.exportTableImages){
                if(!$scope.exportTableImages[j]['export'])
                    return false;
            }
        } else { //video
            for(j in $scope.exportTableVideos){
                if(!$scope.exportTableVideos[j]['export'])
                    return false;
            }
        }
        return true;
    };

    function getTabStringValue(){
        var value = ["Tweets", "Images", "Videos"];
        var usedAPI = "";

        for (var i = 0; i < 3; i ++)
            if ($("li[heading="+value[i]+"]").hasClass("active"))
                usedAPI = value[i].substr(0,value[i].length-1).toLowerCase();

        return usedAPI;
    };

    function determineOutputFileName(usedAPI) {
      if (usedAPI === "tweet") {
        return "tweet_data";
      } else if (usedAPI === "image") {
        return "image_data";
      } else {
        return "video_data";
      }
    }
});

// Like the rest of the jqtags inputs, but customized for the box into which geobox tags will go.
search.directive('jqtagsdragdrop', function () {
    return {
        restrict: 'A',
        scope: {
            tags: '=ngModel', // Bind the box to ng-model
            droppable: '@droppable',
            deletetagname: '&'
        },
        link: function (scope, elem, attrs) {
            // Whenever the tag box is manipulated, change the bound var
            elem.tagsInput({
                interactive: (scope.droppable === 'true'),
                onAddTag: function (tag) {
                    scope.tags.push(tag);

                    $(".tag").draggable({
                        helper:"clone"
                    });
                },
                onRemoveTag: function (tag) {
                    scope.tags.splice(scope.tags.indexOf(tag), 1);
                    $('.tag').draggable({
                        helper: "clone"
                    });

                    if(tag.indexOf("geobox: ") == 0)
                        scope.deletetagname({tag:tag.slice(8,tag.length)});
                }
            });

            if(scope.droppable === 'true'){
                $('#' + attrs.id + '_tagsinput').droppable({
                    drop: function(event, ui){
                            var text = ui.draggable[0].children[0].childNodes[0].data; //gets just the text of the tag
                            $('#' + ui.draggable[0].parentElement.previousElementSibling.id).removeTag(text); //removes the tag from its old tagsinput (possibly the same one if the user picks up and immediately drops)
                            if(scope.tags.indexOf(text) < 0)
                                elem.addTag(text);
                          }
                });
            }

            elem.importTags(scope.tags.join(',')); // Import anything from tags

            function updateTags() {
                elem.importTags(scope.tags.join(','));
                $('.tag').draggable({
                            helper: "clone"
                });
                ////console.log("updating tags");
                ////console.log(scope.tags);
            };

            scope.$watchCollection('tags', function (oldVal, newVal) {
                if (newVal) {
                    updateTags();
                    //console.log("inside watch");
                }
            });
        }
    }
});

// This directive handles the leaflet map on the search page. It works almost exactly like the regular leafletmap directive, but
//with a few modifications, mostly to get around the odd behavior of the watch function operating on the geoboxes array
search.directive('leafletsearchmap', function () {
    return {
        restrict: 'A',
        scope: {
            geoboxes: '=ngModel', // Bind geoboxes to ng-model
            markers: '=markers',
            editable: '@editable',
            clusters: '@clusters',
            getgeoboxname: '&'
        },
        link: function (scope, elem, attrs) {
            // We need to give the map element an id or it
            if (attrs.id === undefined) {
                attrs.id = ('map' + scope.geoboxes);
            }

            // Set the height of the map
            elem.height($(document).height() - (250 + $('.navbar-fixed-top').outerHeight(true) + $('.navbar-fixed-bottom').outerHeight(true)));

            // Create the map
            var map = L.map(attrs.id).setView([0.0, 0.0], 2);

            // Add the bing tile layers
            map.addLayer(new L.BingLayer('AuLwvXawanhcxA4FYbxOzq4ejciLipLnjU5trQ9jE0oufGhGTyUe5r7wJGEuAWlj', {
                maxZoom: 18,
                type: 'Road'
            }));

            // Create a geobox layer accessible to the outside
            var geoboxLayer = new L.FeatureGroup();
            map.addLayer(geoboxLayer);

            // Only if we set it to be editable will there be editing controls
            if (scope.editable === 'true') {
                // Set the draw controls to only allow boxes
                var options = new L.Control.Draw({
                    draw: {
                        polyline: false,
                        polygon: false,
                        circle: false,
                        marker: false
                    },
                    edit: {
                        featureGroup: geoboxLayer
                    }
                });

                map.addControl(options);

                map.on('draw:created', function (e) {
                    var bounds = e.layer.getBounds();
                    scope.geoboxes.push({
                        dummy: false,
                        nwLat: bounds.getNorthWest().lat,
                        nwLng: bounds.getNorthWest().lng,
                        neLat: bounds.getNorthEast().lat,
                        neLng: bounds.getNorthEast().lng,
                        seLat: bounds.getSouthEast().lat,
                        seLng: bounds.getSouthEast().lng,
                        swLat: bounds.getSouthWest().lat,
                        swLng: bounds.getSouthWest().lng
                    });

                    //updateLayer();

                    scope.getgeoboxname();
                });

                /*map.on('draw:edited', function () {
                    updateGeoboxes();
                });

                map.on('draw:deleted', function () {
                    //testing
                    //scope.geoboxes = [];
                    //updateLayer();
                    //testing
                    updateGeoboxes();
                });*/
            }

            // When this function is called, clear all layers and add them from
            // the current scope
            var updateLayer = function () {
                geoboxLayer.clearLayers();
                _.forEach(scope.geoboxes, function (geobox) {
                    //console.log("looping over geoboxes")
                    if(!geobox.dummy){
                        geoboxLayer.addLayer(
                            L.rectangle(
                                [
                                    [geobox.swLat, geobox.swLng],
                                    [geobox.neLat, geobox.neLng]
                                ]
                            )
                        );
                    }
                });
            };

            // This function is called when the scope needs to be updated
            /*var updateGeoboxes = function () {
                scope.geoboxes.length = 0; // This clears the array in place
                _.forEach(geoboxLayer.getLayers(), function (layer) {
                    var bounds = layer.getBounds();
                    scope.geoboxes.push({
                        dummy: false,
                        nwLat: bounds.getNorthWest().lat,
                        nwLng: bounds.getNorthWest().lng,
                        neLat: bounds.getNorthEast().lat,
                        neLng: bounds.getNorthEast().lng,
                        seLat: bounds.getSouthEast().lat,
                        seLng: bounds.getSouthEast().lng,
                        swLat: bounds.getSouthWest().lat,
                        swLng: bounds.getSouthWest().lng
                    });
                });
            };*/

            // Whenever geoboxes is modified, change the map to reflect it
            scope.$watchCollection('geoboxes', function (oldVal, newVal) {
                if (true) {
                    updateLayer();
                }
            });
        }
    }
});
