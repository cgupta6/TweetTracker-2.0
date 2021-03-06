/**
 * Created by anjoy92 on 4/14/17.
 */


app.controller('basicStatsCtrl', ['$scope', '$rootScope', '$location', 'NgTableParams', 'dynamicHeader', 'reportService', '$http', '$state',
	function ($scope, $rootScope, $location, NgTableParams, dynamicHeader, reportService, $http, $state) {

		dynamicHeader.setReportTab('/basicstats');
		$scope.go = function (path) {
			$location.path(path);
		};
		$scope.report_id = $state.params.reportId;
		jQuery('#basic_head').attr('href', '/#/basicstats/' + $scope.report_id);
		jQuery('#advanced_head').attr('href', '/#/advancedAnalytics/' + $scope.report_id);
		jQuery('#raw_head').attr('href', '/#/rawData/' + $scope.report_id);
		$scope.topics = [];
		// This function converts date to string format
		var convertDate = function (report) {
			report.createtime = moment(report.createtime).format("M/D/YYYY H:mm");

			var dateObj = new Date(report.start_datetime);

			report.start_datetime_disp = moment(report.start_datetime).format("M/D/YYYY H:mm");
			var dateObj;
			if (report.end_datetime == -1)
				dateObj = moment();
			else
				dateObj = moment(report.end_datetime);

			return report;
		};


		$scope.report_id = reportService.getReportId();
		setTimeout(reportDetails = function () {
			jQuery(".nav").find(".active").removeClass("active");
			jQuery("#basic_head").parent().addClass("active");
			var reportCheck = $http.get('/api/report?report_id=' + $scope.report_id);
			reportCheck.success(function (data, status, headers, config) {
				jQuery('#loaderJob').hide();
				$scope.reportSpec = data.report;
				console.log($scope.reportSpec);
				$scope.entities = $scope.reportSpec.data;

				$scope.reportSpec.createtime_disp = moment($scope.reportSpec.createtime).format("M/D/YYYY H:mm");

				$scope.reportSpec.start_datetime_disp = moment($scope.reportSpec.start_datetime * 1000).format("M/D/YYYY H:mm");

				var dateObj;
				if ($scope.reportSpec.end_datetime == -1)
					dateObj = moment();
				else
					dateObj = moment($scope.reportSpec.end_datetime * 1000);

				$scope.reportSpec.end_datetime_disp = dateObj.format("M/D/YYYY H:mm");


				var jobsPromise = $http.get('/api/job');
				jobsPromise.success(function (data, status, headers, config) {
					$scope.jobs = data.jobs.map(cleanJob);
					//console.log($scope.jobs);
					$scope.categoryID = $scope.reportSpec.selectedJobs.map(function (job) {

						for (item in $scope.jobs) {

							if ($scope.jobs[item].name == job)
								return $scope.jobs[item].id;
						}
					});
					if ($scope.reportSpec.data == "" || $scope.reportSpec.data == null) {
						saveReport();
					} else if ($scope.reportSpec.data == "haha") {} else {
						jQuery('.loader-walk').hide();
						$scope.totalTweets = $scope.entities['totalTweets'];
						getUsers1();
						getHashtags1();
						getLinks1();
						getTopics1();
						getTweets1();
					}

				});
				reportCheck.error(function (data, status, headers, config) {
					//TODO: Add a backup input for this
					console.log("DB not reachable.")
				});
			});
		}, 100);


		var data = [];
		$scope.tableParams = new NgTableParams({
			count: data.length
		}, {
			dataset: data,
			counts: []
		});

		var saveReport = function () {
			var reportCheck = $http.get('/api/savereport?report_id=' + $scope.report_id);
			reportCheck.success(function (data, status, headers, config) {
				reportDetails();
			});
			reportCheck.error(function (data, status, headers, config) {
				//TODO: Add a backup input for this
				console.log("DB not reachable.")
			});
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
			usersPromise.success(function (data, status, headers, config) {
				$scope.users = data['users'];
				$scope.tableParamsUser = new NgTableParams({}, {
					counts: [],
					dataset: $scope.users.slice(0, 5)
				});
				$scope.tableParamsUser2 = new NgTableParams({}, {
					counts: [],
					dataset: $scope.users
				});

			});
			usersPromise.error(function (data, status, headers, config) {
				console.log("Failed to load users from the API");
			});
		};

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
				$scope.hashtags = data['TopHashtags'].map(function (hashtagsArray) {
					return {
						hashtag: hashtagsArray[0],
						count: hashtagsArray[1]
					};
				});

				$scope.tableParamsHashtags = new NgTableParams({}, {
					counts: [],
					dataset: $scope.hashtags.slice(0, 5)
				});
				$scope.tableParamsHashtags2 = new NgTableParams({}, {
					counts: [],
					dataset: $scope.hashtags
				});

			});
			hashtagsPromise.error(function (data, status, headers, config) {
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
				$scope.links = data['TopUrls'].map(function (urlArray) {
					return {
						link: urlArray[0],
						count: urlArray[1]
					};
				});
				$scope.tableParamsLinks = new NgTableParams({}, {
					counts: [],
					dataset: $scope.links.slice(0, 5)
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

		var getTopics = function () {


			var queryObject = {
				job_ids: $scope.categoryID,
				start_time: $scope.reportSpec.start_datetime,
				end_time: $scope.reportSpec.end_datetime,
				limit: 50
			};

			var topicsPromise = $http.get('/api/entities/word_cloud', {
				params: queryObject
			});
			topicsPromise.success(function (data, status, headers, config) {
				$scope.topics = data['word_cloud'].map(function (word) {
					return {
						text: word['text'],
						size: 100 + 25 * Math.log(word['size'])
					}
				});

			});
			topicsPromise.error(function (data, status, headers, config) {
				console.log("Failed to load top keywords from the API!");

			});
		};


		var getUsers1 = function () {
			$scope.users = $scope.entities['TopUsers']['users']



            if($scope.users.length==0)
            {
                $('#topusersTable').attr('style','display:none;');
                $('#topusersNone').attr('style','display:block;');
                return;
            }

			$scope.tableParamsUser = new NgTableParams({}, {
				counts: [],
				dataset: $scope.users.slice(0, 5)
			});
			$scope.tableParamsUser2 = new NgTableParams({}, {
				counts: [],
				dataset: $scope.users
			});

		};
		var getHashtags1 = function () {

			$scope.hashtags = $scope.entities['TopHashtags'].map(function (hashtagsArray) {
				return {
					hashtag: "#"+hashtagsArray[0],
					count: hashtagsArray[1]
				};
			});

            if($scope.hashtags.length==0)
            {
                $('#hashtagPie').attr('style','display:none;');
                $('#tophashtagNone').attr('style','display:block;');
                return;
            }
			$scope.hashtagsPieData = $scope.entities['TopHashtags'].map(function (hashtagsArray) {
				return {
					label: "#"+hashtagsArray[0],
					value: hashtagsArray[1]
				};
			}).slice(0, 5);
			nv.addGraph(function () {
				var chart = nv.models.pieChart()
					.x(function (d) {
						return d.label
					})
					.y(function (d) {
						return d.value
					})
					.showLabels(false)
                    .width($('#hashtagPie').parent().width()+50)
                    .height(260)
                    .legendPosition("right");

				d3.select("#hashtagPie svg")
					.datum($scope.hashtagsPieData)
					.transition().duration(350)
					.call(chart);

				return chart;
			});


			$scope.tableParamsHashtags = new NgTableParams({}, {
				counts: [],
				dataset: $scope.hashtags.slice(0, 5)
			});
			$scope.tableParamsHashtags2 = new NgTableParams({}, {
				counts: [],
				dataset: $scope.hashtags
			});

		};

		var getLinks1 = function () {

			$scope.links = $scope.entities['TopLinks'].map(function (urlArray) {return {
                        link: urlArray[0],
                        count: urlArray[1]
                    };
			});
			if($scope.links.length!=0)
            {
                if($scope.links[0].link==null)
                {
                    $scope.links=$scope.links.splice(1,$scope.links.length);
                }
                $scope.tableParamsLinks = new NgTableParams({}, {
                    counts: [],
                    dataset: $scope.links.slice(0, 5)
                });
                $scope.tableParamsLinks2 = new NgTableParams({}, {
                    counts: [],
                    dataset: $scope.links
                });
            }
            else
            {
                $('#toplinkTable').attr('style','display:none;');
                $('#toplinkNone').attr('style','display:block;');
            }
		};


		var getTopics1 = function () {

			$scope.topics = $scope.entities['word_cloud']['word_cloud'].map(function (word) {
				return {
					text: word['text'],
					size: 100 + 25 * Math.log(word['size'])
				}
			});

            if($scope.topics.length==0)
            {
                $('#topkeywordsCloud').attr('style','display:none;');
                $('#topkeywordsNone').attr('style','display:block;');
                return;
            }
		};

		var getTweets1 = function () {
			$scope.tweets = $scope.entities.Tweets['tweets'];
			$scope.tableParamsTweet2 = new NgTableParams({
				page: 1, // show first page
				count: 5 // count per page
			}, {
				counts: [],
				dataset: $scope.tweets
			});

		};


		// This function takes a job from TweetTracker's API and adds some logical
		// structure to it
		var cleanJob = function (job) {
			return {
				id: job['categoryID'],
				name: job['catname'],
				selected: false,
				crawling: job['includeincrawl'] === 1
			}
		};

	}
]);


// This directive manages a word cloud
app.directive('wordcloud', function () {
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
					.rotate(function () {
						return 0;
					})
					.font("Impact")
					.fontSize(function (d) {
						return d.size;
					})
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
					.style("font-size", function (d) {
						return d.size + "px";
					})
					.style("font-family", "Impact")
					.style("fill", function (d, i) {
						return '#736D68';
					})
					.attr("text-anchor", "middle")
					.attr("transform", function (d) {
						return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
					})
					.text(function (d) {
						return d.text;
					});
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