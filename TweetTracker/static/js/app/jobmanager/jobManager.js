var jobManager = angular.module('jobManager', ['ngRoute', 'ui.bootstrap', 'ttutilities.directives']);

// Set up the routes
jobManager.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/listJobs', {
            templateUrl: '/static/js/app/jobmanager/partials/listJobs.html',
            controller: 'JobListController'
        }).
        when('/createJob', {
            templateUrl: '/static/js/app/jobmanager/partials/editJob.html',
            controller: 'CreateJobController'
        }).
        when('/editJob/:jobId', {
            templateUrl: '/static/js/app/jobmanager/partials/editJob.html',
            controller: 'EditJobController'
        }).
        otherwise({
            redirectTo: '/listJobs'
        });
}]);

// Add the controller that displays the list of Jobs
jobManager.controller('JobListController', function ($scope, $http, $log) {

    // Control the display of public jobs
    $scope.showPublic = true;
	$scope.predicate = 'name';

    $scope.$watch('showPublic', function(newValue) {
        if (newValue) {
            $scope.jobs = $scope.allJobs;
        } else {
            $scope.jobs = $scope.allJobs.filter(function (job) {
                return !job.pub;
            })
        }
    }, true);

    // Load the current user's jobs from the server
    $scope.jobs = [];
    $scope.allJobs = [];
    $scope.selectedJob = {};

    var jobsPromise = $http.get('/api/job');
    jobsPromise.success(function(data, status, headers, config) {
        $scope.jobs = data.jobs.map(cleanJob);
        $scope.allJobs = data.jobs.map(cleanJob);
    });
    jobsPromise.error(function(data, status, headers, config) {
        $log.error("Failed to load the job list from the API!");
    });

    $scope.selectJob = function(job) {
        $scope.selectedJob = job;
    };

    // Set up the function that is called when the delete button is pressed
    $scope.deleteJob = function(id) {
        var really_delete = confirm("Are you really sure you want to delete this job?");
        if (really_delete === false) { return; }
        $log.info('Attempt to delete job with id ' + id);
        var deletePromise = $http({method: 'DELETE', url: '/api/job/' + id});
        deletePromise.success(function(data, status, headers, config) {
            $log.info("Job successfully deleted.");
            var index = -1;
            for (var i = 0; i < $scope.jobs.length; i++)
                if ($scope.jobs[i].id === parseInt(id))
                    index = i;
            $scope.jobs.splice(index, 1);
        });
        deletePromise.error(function(data, status, headers, config) {
            $log.error("Failed to delete job.");
        });
    };



    $scope.downloadJob = function(id) {
        var really_delete = confirm("Are you really sure you want to download this job?");
        if (really_delete === false) { return; }
        $log.info('Attempt to delete job with id ' + id);
        var deletePromise = $http({method: 'Download', url: '/api/job/' + id});
        deletePromise.success(function(data, status, headers, config) {
            $log.info("Job successfully deleted.");
            var index = -1;
            for (var i = 0; i < $scope.jobs.length; i++)
                if ($scope.jobs[i].id === parseInt(id))
                    index = i;
            $scope.jobs.splice(index, 1);
        });
        deletePromise.error(function(data, status, headers, config) {
            $log.error("Failed to download job.");
        });
    };






    $scope.setCrawl = function(id, crawl) {
        $log.info('Setting the crawling of job ' + id + ' to ' + crawl);
        var setPromise = $http({method: 'PUT', url: '/api/job/' + id + '/set_crawl', data: {crawl: crawl}});
        setPromise.success(function(data, status, headers, config) {
            $log.info("Changed crawl status");
            for (var i = 0; i < $scope.jobs.length; i++) {
                if ($scope.jobs[i].id === parseInt(id))
                    $scope.jobs[i].crawl = !($scope.jobs[i].crawl);
            }
        });
        setPromise.error(function(data, status, headers, config) {
            $log.error("Failed to change crawl status");
        });
    };

    function loadLimit()
    {   
        //Call the user api
        var userPromise = $http.get('/api/get_user_info')
        userPromise.success(function (data, status, headers, config) {
            if (data != null)
            {
                var username = data['username']

                var limitPromise = $http.get('/api/query_user_limit', {
                });
                limitPromise.success(function (data, status, headers, config) {
                    $("#ulimit").html("Your daily tweet collection limit is <span style='color:#ff0000'>" + data.limit + "</span>. So far today, you have collected <span style='color:#ff0000'>" + data.current + "</span> tweets.");
                });
                limitPromise.error(function (data, status, headers, config) {

                });
            }
        });
        userPromise.error(function (data, status, headers, config) {
            $log.info("Failed to get user information!");
        });
    }

    loadLimit();

    // This function takes a job from TweetTracker's API and adds some logical
    // structure to it
    var cleanJob = function(job) {
        var sourceObj = {yt:false,tw:false,vk:false,'in':false};
		
		for (var i = 0; i < job.sources.length; i++){
			sourceObj[job.sources[i]] = true;
		}
		
		return {
            id: job.categoryID,
            name: job.catname,
            keywords: job.keywords,
            users: job.userids.map(function(uid) { return uid['screen_name']; }),
            geoboxes: job.geoboxes,
            yakmarkers: job.yakmarkers,
            pub: job.publicflag,
            crisisflag : job.crisisflag,
            crawl: job.includeincrawl == 1,
			createtime: job.createtime,
			createstring: (new Date(job.createtime)).toUTCString(),
			sources: sourceObj
        }
    }

});

// Add the controller that facilitates the creation of new jobs
jobManager.controller('CreateJobController', function ($scope, $http, $location, $log, $routeParams, $timeout) {

    var map = window.global_map_pointer;
    var layers = window.global_layers_pointer;

    var jobId = $routeParams['jobId'];

    $scope.parameterError = false;
    $scope.nameValidationError = true;

    $scope.edit = false;

    $scope.job = {
        id: 0,
        name: "",
        users: [],
        keywords: [],
        geoboxes: [],
        yakmarkers: [],
        'public': false,
        'crisisflag':false,
		sources: {tw:true,yt:false,'in':false,vk:false}
    };

    $scope.username = null;
    $scope.numOfTweets = null;
    $scope.userLoaded = false;

    //Call the user api
    var userPromise = $http.get('/api/get_user_info')
    userPromise.success(function (data, status, headers, config) {
        $log.info(data);
        $scope.username = data['username']
        $scope.numOfTweets = data['numoftweets']
        $scope.userLoaded = true;
    });
    
    userPromise.error(function (data, status, headers, config) {
        $log.info("Failed to get user information!");
    });

    // Post the new Job, then redirect to the job listings
    $scope.submitJob = function () {
        if ($scope.job.users.length + $scope.job.keywords.length +
            $scope.job.geoboxes.length === 0) {
            $scope.parameterError = true;
            return;
        }

        if ($scope.nameValidationError)
            return;

        var jobSources = [];
		
		for (k in $scope.job.sources){
			if($scope.job.sources[k]){
				jobSources.push(k);
			}
		}
		
        var sendObj = {
            name: $scope.job.name,
            users: $scope.job.users,
            keywords: $scope.job.keywords,
            geoboxes: $scope.job.geoboxes,
            yakmarkers: $scope.job.yakmarkers,
            'public': $scope.job.public,
            'crisisflag': $scope.job.crisisflag,
            sources: jobSources
        };

        $log.info('The user agent is: ' + navigator.userAgent);

        $log.info('Attempt to create job with name ' + $scope.job.name);

        var postPromise = $http.post('/api/job', sendObj);
        $log.info(sendObj);
        toastr.options.positionClass = 'toast-top-center';
        postPromise.success(function (data, status, headers, config) {
            $log.info("Created job successfully!");
            toastr.success('Created job successfully!');
        });
        postPromise.error(function (data, status, headers, config) {
            $log.info("Failed to create job!");
            toastr.error('Failed to create job!');
        });
        setTimeout(function(){
            document.location.href = "/app/jobmanager";
        }, 2000);
    };

    // Watch the job name and validate it if left after a cutoff
    $scope.$watch('job.name', function (name) {
        if (!name) {
            $scope.nameValidationError = true;
            return;
        }
        var validationPromise = $http.get('/api/job/validate_name/' + name);
        validationPromise.success(function (data) {
            if (data[name] === 'valid') {
                $log.info("Valid job name: " + name);
                $scope.nameValidationError = false;
            } else {
                $log.info("Invalid job name: " + name);
                $scope.nameValidationError = true;
            }
        });
        validationPromise.error(function (data) {
            $log.error("Unexpected error while validating job name");
        })
    });

});

// Add the controller that allows the user to modify a job
jobManager.controller('EditJobController', function ($scope, $http, $location, $log, $routeParams) {

    // Get the job id from the route params
    var jobId = $routeParams['jobId'];
    var originalName;

    // Keeps track of whether the user has attempted to submit an empty job
    $scope.parameterError = false;
    $scope.nameValidationError = false;

    // Variable to tell the view if it's in create or edit mode
    $scope.edit = true;

    // Start with an empty Job
    $scope.job = {
        id: 0,
        name: "",
        users: [],
        keywords: [],
        geoboxes: [],
        yakmarkers: [],
        'public': false,
        'crisisflag':false,
		sources: {tw:false,fb:false,yt:false,'in':false,vk:false}
    };

    var jobPromise = $http.get('/api/job/' + jobId);
    jobPromise.success(function(data, status, headers, config) {
        $scope.job = cleanJob(data.job);
        originalName = $scope.job.name;
        $log.info("Retrieved job successfully.");
        $log.info(data.job);
    });

    // When the submit button is pressed, PUT the whole object to the server
    // and redirect to the job listings
    $scope.submitJob = function() {
        if ($scope.job.users.length + $scope.job.keywords.length +
            $scope.job.geoboxes.length === 0) {
            $scope.parameterError = true;
            return;
        }

        if ($scope.nameValidationError)
            return;
		
		var jobSources = [];
		
		for (k in $scope.job.sources){
			if($scope.job.sources[k]){
				jobSources.push(k);
			}
		}

        var sendObj = {
            name: $scope.job.name,
            users: $scope.job.users,
            keywords: $scope.job.keywords,
            geoboxes: $scope.job.geoboxes,
            yakmarkers: $scope.job.yakmarkers,
            'public': $scope.job.public,
            'crisisflag':$scope.job.crisisflag,
			sources: jobSources
        };
        $log.info("Putting job with id " + jobId);
        $log.info(sendObj);
        var putPromise = $http.put('/api/job/' + jobId, sendObj);
        toastr.options.positionClass = 'toast-top-center';
        putPromise.success(function(data, status, headers, config) {
            $log.info("Modified job successfully!");
            toastr.success('Modified job successfully!');
            setTimeout(function(){
                document.location.href = "/app/jobmanager";
                    }, 1000);  
        });
        putPromise.error(function(data, status, headers, config) {
            $log.info("Failed to modify job!");
            toastr.error('Failed to modify job!');
        });
        $log.info('Attempt to edit job with name ' + name);

        
    };

    // This function takes a job from TweetTracker's API and adds some logical
    // structure to it
    var cleanJob = function(job) {
        var sourceObj = {yt:false,tw:false,vk:false,'in':false};
		
		for (var i = 0; i < job.sources.length; i++){
			sourceObj[job.sources[i]] = true;
		}
		
		return {
            id: job['categoryID'],
            name: job['catname'],
            keywords: job['keywords'],
            users: job['userids'].map(function(job) { return job['screen_name']; }),
            geoboxes: job['geoboxes'],
            yakmarkers: job['yakmarkers'],
            'public': job['publicflag'] === 1,
            'crisisflag': job['crisisflag'] === 1,
			sources: sourceObj
        }
    }

    // Watch the job name and validate it if left after a cutoff
    $scope.$watch('job.name', function (name) {
        if (!name) {
            $scope.nameValidationError = true;
            return;
        }
        // If the name is changed back to what it started as, allow it.
        if (name === originalName) {
            $scope.nameValidationError = false;
            return;
        }
        var validationPromise = $http.get('/api/job/validate_name/' + name);
        validationPromise.success(function (data) {
            if (data[name] === 'valid') {
                $log.info("Valid job name: " + name);
                $scope.nameValidationError = false;
            } else {
                $log.info("Invalid job name: " + name);
                $scope.nameValidationError = true;
            }
        });
        validationPromise.error(function (data) {
            $log.error("Unexpected error while validating job name");
        })
    });

});
