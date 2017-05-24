/**
 * Created by anjoy92 on 4/14/17.
 */


app.controller('advancedAnalyticsCtrl',[ '$http','$scope','$rootScope','$location', '$mdSidenav','NgTableParams',
    'dynamicHeader','reportService', function($http, $scope ,$rootScope, $location,$mdSidenav, NgTableParams,dynamicHeader,reportService) {

    dynamicHeader.setReportTab($location.$$path);
    $scope.showPopup=false;
    $scope.showMainMenu=true;

    $scope.toggleLeftMap = buildTogglerMap('left');

    $scope.toggleLeftUser = buildTogglerUser('left');
    $scope.toggleLeftTweet = buildTogglerTweet('left');

    $scope.toggleLeftMap2 = buildTogglerMap2('left');

    $scope.toggleLeftUser2 = buildTogglerUser2('left');
    $scope.toggleLeftTweet2 = buildTogglerTweet2('left');

    $scope.toggleBack = restoreToggler('left');
    $scope.currentReport="";
    $scope.locations = [];

    $scope.advancedReports=[{name:'Maps',image:'static/images/images.png'}
                            ,{name:'Top Users',image:'static/images/images.png'}];




    function buildTogglerMap(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            $scope.showMainMenu=false;
             $scope.showMapMenu=true;
             $scope.showTweetMenu=false;
             $scope.showUserMenu=false;

        };
    }

    function buildTogglerMap2(componentId) {
        return function() {
            $scope.showMainMenu=false;
             $scope.showMapMenu=true;
             $scope.showTweetMenu=false;
             $scope.showUserMenu=false;

        };
    }

    function buildTogglerUser(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            $scope.showMainMenu=false;
             $scope.showMapMenu=false;
             $scope.showTweetMenu=false;
             $scope.showUserMenu=true;
        };
    }
    function buildTogglerUser2(componentId) {
        return function() {
            $scope.showMainMenu=false;
             $scope.showMapMenu=false;
             $scope.showTweetMenu=false;
             $scope.showUserMenu=true;
        };
    }

    function buildTogglerTweet(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            $scope.showMainMenu=false;
             $scope.showMapMenu=false;
             $scope.showTweetMenu=true;
             $scope.showUserMenu=false;
        };
    }

    function buildTogglerTweet2(componentId) {
        return function() {
            $scope.showMainMenu=false;
             $scope.showMapMenu=false;
             $scope.showTweetMenu=true;
             $scope.showUserMenu=false;
        };
    }

    function restoreToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            $scope.showMainMenu=true;

             $scope.showMapMenu=false;
             $scope.showTweetMenu=false;
             $scope.showUserMenu=false;
        };
    }

    $scope.go = function ( path ) {
        $location.path( path );
    };
    var data=[];
    $scope.tableParams = new NgTableParams({ count: data.length}, { dataset: data, counts: []});


    $scope.htmlString='<table ng-table="tableParamsUser" class="table" >\
        <tr ng-repeat="user in users">\
        <td  align="center"  title="User">\
        <a target="_blank" href="https://www.twitter.com/{{ user.user }}"> {{user.user}}</a></td>\
        <td  align="center" title="Mentions">\
                {{user.count}}</td>\
        </tr>\
        </table>';

        var tempUsers = JSON.parse('[{"count":27427,"user":"Dbnmjr"},{"count":16248,"user":"RT_com"},{"count":11732,"user":"Steiner1776"},{"count":11675,"user":"interfaxua"},{"count":10437,"user":"EuromaidanPress"},{"count":9573,"user":"Liveuamap"},{"count":8763,"user":"Conflict_Report"},{"count":8675,"user":"uatodaytv"},{"count":8535,"user":"Sevodnay"},{"count":8444,"user":"EuromaidanPR"},{"count":8299,"user":"RobPulseNews"},{"count":8220,"user":"Novorossiyan"},{"count":7947,"user":"raging545"},{"count":7138,"user":"BungeeWedgie"},{"count":6835,"user":"SpecGhost"},{"count":6785,"user":"ukraina_ru"},{"count":6518,"user":"noclador"},{"count":6230,"user":"homo_viator"},{"count":5897,"user":"GrahamWP_UK"},{"count":5523,"user":"KyivPost"},{"count":5461,"user":"ukrpravda_news"},{"count":5429,"user":"rConflictNews"},{"count":5422,"user":"SputnikInt"},{"count":5190,"user":"ArmedResearch"},{"count":5066,"user":"olex_scherba"},{"count":4710,"user":"OnlineMagazin"},{"count":4484,"user":"MaxRTucker"},{"count":4393,"user":"poroshenko"},{"count":4344,"user":"wavetossed"},{"count":4338,"user":"MarkSleboda1"}]');
        $scope.users = tempUsers;

        $scope.tableParamsUser = new NgTableParams({}, {
            counts: [],
            dataset: $scope.users.slice(0,5)
        });



    $scope.report_id=reportService.getReportId();
   setTimeout(function () {
        var reportCheck = $http.get('/api/report?report_id='+$scope.report_id);
        reportCheck.success(function(data, status, headers, config) {
            //$scope.reportSpec = convertDate(data.report);
            $scope.reportSpec = data.report;


            var jobsPromise = $http.get('/api/job');
            jobsPromise.success(function(data, status, headers, config) {
                $scope.jobs = data.jobs.map(cleanJob);
                $scope.categoryID = $scope.reportSpec.selectedJobs.map(function(job) {

                for (item in $scope.jobs)
                {

                    if($scope.jobs[item].name==job)
                        return $scope.jobs[item].id;
                }
             });

            getLocations();
            getUsers();
            getTweets();
        });
        reportCheck.error(function(data, status, headers, config) {
            //TODO: Add a backup input for this
            console.log("DB not reachable.")
        });
        });
    },500);




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
              $scope.tableParamsUser2 = new NgTableParams({}, {
             counts: [],
             dataset: $scope.users
        });

        });
        usersPromise.error(function(data, status, headers, config) {
            console.log("Failed to load users from the API");
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

  $scope.tableParamsTweet2 = new NgTableParams({
        page: 1,   // show first page
        count: 5  // count per page
    },{
             counts: [],
             dataset: $scope.tweets
        });
            });
            tweetsPromise.error(function (data, status, headers, config) {
                console.log("Failed to load tweets from the API!");
            });
         };



     var cleanJob = function(job) {
        return {
            id: job['categoryID'],
            name: job['catname'],
            selected: false,
            crawling: job['includeincrawl'] === 1
        }
    };
   // Retrieves the locations from the server
    var getLocations = function () {

        var queryObject = {
            job_ids: $scope.categoryID,
            start_time: $scope.reportSpec.start_datetime,
            end_time: $scope.reportSpec.end_datetime
        };

        var locationsPromise = $http.get('/api/entities/locations', {
            params: queryObject
        });

        locationsPromise.success(function (data, status, headers, config) {
            var tweetlocations = data["tweetlocations"];
            var imagelocations = data["imagelocations"];
            var videolocations = data["videolocations"];
            var locations = [];
            locations = locations.concat(tweetlocations);
            locations = locations.concat(imagelocations);
            locations = locations.concat(videolocations);
            $scope.locations = locations;

       //     $scope.locations = locations;

        });
        locationsPromise.error(function (data, status, headers, config) {
            console.log("Failed to load locations from the API!");
        });
    };

}]);
var layers = new Array();
window.global_layers_pointer = layers;


app.directive('leafletmap', function ($http, $log) {
    return {
        restrict: 'A',
        scope: {
            geoboxes: '=ngModel', // Bind geoboxes to ng-model
            yakmarkers: '=ngModelYaks', //Bind yikyak markers to ng-model-yaks for use in other files
            points: '=points',
            editable: '@editable',
            clusters: '@clusters'
        },
        link: function (scope, elem, attrs) {

            // We need to give the map element an id or it
            if (attrs.id === undefined) {
                attrs.id = ('map' + scope.geoboxes)
            }

            // Set the height of the map
            var height = $(document).height() - (250 + $('.navbar-fixed-top').outerHeight(true) + $('.navbar-fixed-bottom').outerHeight(true));
            height = height < 350 ? 350 : height; // Height at least 350px
            height=650;
            elem.height(height);

            // Create the map
            var map = L.map(attrs.id).setView([0.0, 0.0], 2);

            //Create map pointer
            window.global_map_pointer = map;

            // add local tiles
            var tiles = new L.tileLayer('/static/maptiles/{z}/{x}/{y}.png', {
                minZoom:1,
                maxZoom:4
            }).addTo(map);

            // Add the bing tile layers
            // map.addLayer(new L.BingLayer('AuLwvXawanhcxA4FYbxOzq4ejciLipLnjU5trQ9jE0oufGhGTyUe5r7wJGEuAWlj', {
            //     maxZoom: 18,
            //     type: 'Road'
            // }));

            var markerLayer = new L.MarkerClusterGroup();
            map.addLayer(markerLayer);
            layers["tweet_markers"] = markerLayer;

            // Clears the markers and adds new ones from scope.points
            var updateMarkers = function () {
                markerLayer.clearLayers();
                _.forEach(scope.points, function(point) {
                    var marker = new L.Marker(new L.LatLng(point.lat, point.lng));
                    var popup = new L.Popup()
                        .setLatLng(new L.LatLng(point.lat, point.lng))
                        .setContent(JSON.stringify({ "type": point.type, "index": point.index}));
                    marker.bindPopup(popup);
                    markerLayer.addLayer(marker);
                });
            };

            // We only mess around with the points if scope.clusters is true
            if (scope.clusters === "true") {
                scope.$watchCollection('points', function (oldVal, newVal) {
                    if (newVal) {
                        updateMarkers();
                    }
                });

                map.on('popupopen', function(e) {
                    var content = JSON.parse(e.popup.getContent());
                    var index = content.index;
                    var type = content.type;
                    // You can use the if statements below to add images and videos
                    if (type === "tweet") {
                        var tweetPromise = $http.get("/api/tweet/" + index);
                        tweetPromise.success(function(data, status, headers, config) {
                            // Change this code to display images and videos
                            $log.info(data);
                            if('tweet' in data){
                                data = data['tweet'];
                                var date = new Date(data['created_at']),
                                    HTML =  '<p class="map-popup-date">' + date.toGMTString() + "</p>" +
                                            '<span class="map-popup-screenname">@' + data['user']['screen_name'] + ': </span>' +
                                            '<span class="map-popup-text">' + data['text'] + '</span>';
                                //add the username, date, and text.
                                e.popup.setContent(HTML);
                            }
                            else{
                                e.popup.setContent('<p>Failed to load popup tweet.</p>');
                            }
                        });
                        tweetPromise.error(function(data, status, headers, config) {
                            $log.error("Failed to load popup tweet");
                        });
                    } else if (type === "image") {
                        var imagePromise = $http.get("/api/image/" + index);
                        imagePromise.success(function(data, status, headers, config) {
                            $log.info(data);
                            if('image' in data){
                                data = data['image'];
                                var date = new Date(data['created_at']),
                                    HTML = populateModal('image', data);
                                e.popup.setContent(HTML);
                            }
                            else{
                                e.popup.setContent('<p>Failed to load popup image.</p>');
                            }
                        });
                        imagePromise.error(function(data, status, headers, config) {
                            $log.error("Failed to load popup image");
                        });
                    } else  if (type === "video") {
                        var videoPromise = $http.get("/api/video/" + index);
                        videoPromise.success(function(data, status, headers, config) {
                            $log.info(data);
                            if('video' in data){
                                data = data['video'];
                                var date = new Date(data['created_at']),
                                    HTML = populateModal('video', data);
                                e.popup.setContent(HTML);
                            }
                            else{
                                e.popup.setContent('<p>Failed to load popup video.</p>');
                            }
                        });
                        videoPromise.error(function(data, status, headers, config) {
                            $log.error("Failed to load popup video");
                        });                            }
                    // Change this API call to /api/image/ for images and /api/video/ for videos

                });
            }

            // Create a geobox layer accessible to the outside
            var geoboxLayer = new L.FeatureGroup();
            map.addLayer(geoboxLayer);
            layers["tweet_geobox"] = geoboxLayer;

            // create yikyaklayer which stores yaks
            var yakLayer = new L.FeatureGroup();
            map.addLayer(yakLayer);
            layers["yak_markers"] = yakLayer;


            // Only if we set it to be editable will there be editing controls
            if (scope.editable === 'true') {

                // Set the draw controls to allow boxes and markers
                var options = new L.Control.Draw({
                    draw: {
                        polyline: false,
                        polygon: false,
                        circle: false,
                        marker: true
                    },
                    edit: {  //allows editting of both geoboxes and yikyak pins
                        featureGroup: geoboxLayer,
                        featureGroup: yakLayer
                    }
                });

                map.addControl(options);

                map.on('draw:created', function (e) {
                    //checks if markers are being added
                    if (e.layerType === 'marker') {

                          if(scope.yakmarkers === undefined){
                            scope.yakmarkers = [];
                          }

                          //adds new marker to layer
                          scope.yakmarkers.push({
                          yaklat: e.layer._latlng.lat,
                          yaklong: e.layer._latlng.lng
                          });

                    }
                    else
                    {

                    var bounds = e.layer.getBounds();
                    scope.geoboxes.push({
                        nwLat: bounds.getNorthWest().lat,
                        nwLng: bounds.getNorthWest().lng,
                        neLat: bounds.getNorthEast().lat,
                        neLng: bounds.getNorthEast().lng,
                        seLat: bounds.getSouthEast().lat,
                        seLng: bounds.getSouthEast().lng,
                        swLat: bounds.getSouthWest().lat,
                        swLng: bounds.getSouthWest().lng
                    });

					}
                    updateLayer();

                });

                map.on('draw:edited', function () {
                    //updates scope variables for yikyak markers and geoboxes
                    updateGeoboxes();
                    updateyaks();
                });

                map.on('draw:deleted', function () {
                    //updates scope variables
                    updateGeoboxes();
                    updateyaks();
                });
            }

            // When this function is called, clear all layers and add them from
            // the current scope
            var updateLayer = function () {
                geoboxLayer.clearLayers();
                _.forEach(scope.geoboxes, function (geobox) {
                    geoboxLayer.addLayer(
                        L.rectangle(
                            [
                                [geobox.swLat, geobox.swLng],
                                [geobox.neLat, geobox.neLng]
                            ]
                        )
                    );
                });


                yakLayer.clearLayers();
                _.forEach(scope.yakmarkers, function (yak) {
                    var marker = new L.Marker(new L.LatLng(yak.yaklat, yak.yaklong),{icon: yikyakIcon});

                    var popup = new L.Popup()
                        .setLatLng(new L.LatLng(yak.yaklat, yak.yaklong))
                        .setContent(JSON.stringify({ "type": "yikyak"}));
                    marker.bindPopup(popup);
                    yakLayer.addLayer(marker);

                    // TODO: HACKY BUT WE COULD WRITE TO THE DATABASE SEPARATELY AND STORE YIKYAKS THAT WAY

                });
            };

            // This function is called when the scope needs to be updated
            var updateGeoboxes = function () {
                scope.geoboxes.length = 0; // This clears the array in place
                _.forEach(geoboxLayer.getLayers(), function (layer) {
                    var bounds = layer.getBounds();
                    scope.geoboxes.push({
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
            };

            var updateyaks = function () {
                // This function is called when the scope needs to be updated
                //updates layers based on created pins
                scope.yakmarkers.length = 0; // This clears the array in place
                _.forEach(yakLayer.getLayers(), function (layer) {
                    scope.yakmarkers.push({

                          yaklat: layer._latlng.lat,
                          yaklong: layer._latlng.lng

                    });
                });
            };


            // Whenever geoboxes is modified, change the map to reflect it
            scope.$watchCollection('geoboxes', function (oldVal, newVal) {
                updateLayer();
            });

            scope.$watchCollection('yakmarkers', function (oldVal, newVal) {
                updateLayer();
            });
        }
    }
});
