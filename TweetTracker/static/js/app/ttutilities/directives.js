var ttdirectives = angular.module('ttutilities.directives', []);

// Global variable to keep track of layers that are currently displaying on the leaflet map
var layers = new Array();
window.global_layers_pointer = layers;

// This directive handles a leaflet map that can have editing enabled. It is
// used frequently in TweetTracker, so it has been refactored into the utilities
// module for reuse.
ttdirectives.directive('leafletmap', function ($http, $log) {
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
                console.log("drawstart")
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

// This directive manages a jqtags input. You should add jqtags as an attribute
// to the input you want this directive to manage
ttdirectives.directive('jqtags', function () {
    return {
        restrict: 'A',
        scope: {
            tags: '=ngModel' // Bind the box to ng-model
        },
        link: function (scope, elem) {
            // Whenever the tag box is manipulated, change the bound var
            elem.tagsInput({
                onAddTag: function (tag) {
                    scope.tags.push(tag);
                },
                onRemoveTag: function (tag) {
                    scope.tags.splice(scope.tags.indexOf(tag), 1);
                }
            });

            elem.importTags(scope.tags.join(',')); // Import anything from tags

            function updateTags() {
                elem.importTags(scope.tags.join(','));
            }

            scope.$watchCollection('tags', function (oldVal, newVal) {
                if (newVal) {
                    updateTags();
                }
            });
        }
    }
});


var populateModal = function(type, data) {
        
    var modal = '';

    if(type === 'image')
    {
        modal = 
        '<a data-toggle="modal" data-target="#mapView' + data["id"] + '" data-gallery="multiimages" data-title="" class="link_tile insta">' +
            '<img id="tile_img" src="' + data["images"]["thumbnail"]["url"] + '" class="img-responsive insta tile">' +
        '</a>';

        $('#addModal').append(
            '<div class="modal fade insta" id="mapView' + data["id"] + '" tabindex="100" role="dialog" aria-labelledby="standardViewLabel" aria-hidden="true">' +
                '<div class="modal-dialog insta">' +
                    '<div class="modal-content insta">' +
                        '<div class="modal-header insta">' +
                            '<p class="link-modal text-center insta" href="' + data["link"] + '">- Click Image to Go to Instagram -</p>' +
                            '<button type="button" class="close insta" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>' +
                            '</button>' +
                            '<h4 class="modal-title insta" id="standardViewLabel"></h4>' +
                        '</div>' +
                        '<div class="modal-body insta" >' +
                            '<a href="' + data["link"] + '" target="_blank"><img id="modal_img" src="' + data["images"]["standard_resolution"]["url"] + '" class="img-responsive insta"></a>' +
                        '</div>' +
                        '<div class="modal-footer insta">' +
                            '<p class="desc-modal insta" >' + data["caption"]["text"] + '</p><hr><center>' +
                            '<p class="comments-modal insta" ><i class="glyphicon glyphicon-comment" style"top:2px;"></i>&nbsp;&nbsp;Comments:&nbsp;' + data["comments"]["count"] + '</p>' +
                            '<p class="likes-modal insta" ><i class="glyphicon glyphicon-heart"></i>&nbsp;&nbsp;Likes:&nbsp;' + data["likes"]["count"] + '</p></center>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

    }
    else if(type === 'video')
    {
        modal = 
        '<a data-toggle="modal" data-target="#mapView' + data["id"] + '" data-gallery="multiimages" data-title="" class="link_tile select_tube tube">' +
            '<img id="tile_img" src="' + data["thumbnail"] + '" class="img-responsive tube tile">' +
        '</a>';

        $('#addModal').append(
            '<div class="modal fade tube_view tube" id="mapView' + data["id"] + '" tabindex="100" role="dialog" aria-labelledby="standardViewLabel" aria-hidden="true">' +
                '<div class="modal-dialog tube">' +
                    '<div class="modal-content tube">' +
                        '<div class="modal-header tube">' +
                            '<p class="link-modal text-center tube">' + data["title"] + '</p>' +
                            '<button type="button" class="close tube" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>' +
                            '</button>' +
                            '<h4 class="modal-title tube" id="standardViewLabel"></h4>' +
                        '</div>' +
                        '<div class="modal-body tube">' +
                            data["iFrame"] +
                        '</div>' +
                        '<div class="modal-footer tube">' +
                            '<p class="desc-modal tube" >' + data["description"] + '</p></br><hr><center>' +
                            '<p class="comments-modal tube" ><i class="glyphicon glyphicon-comment" style"top:2px;"></i>&nbsp;&nbsp;Comments:&nbsp;' + data["commentCount"] + '&nbsp;&nbsp;&nbsp;</p>' +
                            '<p class="likes-modal tube" ><i class="glyphicon glyphicon-thumbs-up"></i>&nbsp;&nbsp;Likes:&nbsp;' + data["likeCount"] + '&nbsp;&nbsp;&nbsp;</p>' +
                            '<p class="dislikes-modal tube" ><i class="glyphicon glyphicon-thumbs-down"></i>&nbsp;&nbsp;Dislikes:&nbsp;' + data["dislikeCount"] + '&nbsp;&nbsp;&nbsp;</p>' +
                            '<p class="favorites-modal tube" ><i class="glyphicon glyphicon-star"></i>&nbsp;&nbsp;Favorites:&nbsp;' + data["favoriteCount"] + '&nbsp;&nbsp;&nbsp;</p>' +
                            '<p class="views-modal tube" ><i class="glyphicon glyphicon-eye-open"></i>&nbsp;&nbsp;Views:&nbsp;' + data["viewCount"] + '</p></center>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }

    return modal;            
}


