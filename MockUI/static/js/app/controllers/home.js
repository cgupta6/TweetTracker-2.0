/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('homeCtrl', function ( $scope, $location, $http, $rootScope, dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);

    $scope.videos = [{
        name:"Job Manager",
        url:"https://www.youtube.com/watch?v=4spwQ3hgmJA"
    },{
        name:"Tweetalyzer",
        url:"https://www.youtube.com/watch?v=_CLXCOVR0i0"
    },{
        name:"Search",
        url:"https://www.youtube.com/watch?v=N0Z-5VsLlIc"
    },{
        name:"Trends",
        url:"https://www.youtube.com/watch?v=7c828hREF7A"
    }];
});

app.filter('trusted', ['$sce', function ($sce) {
    return function(url) {
        var video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);