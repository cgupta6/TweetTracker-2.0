var overview = angular.module('overview', ['ngRoute', ]);

overview.config(['$routeProvider','$sceDelegateProvider', function ($routeProvider,$sceDelegateProvider) {
    $routeProvider.when('/', {
        templateUrl: '/static/js/app/overview/partials/overview.html',
        controller: 'OverviewController'
    }).otherwise({
        redirectTo: '/'
    });

    $sceDelegateProvider.resourceUrlWhitelist(['self','*://www.youtube.com/**']);
}]);

overview.controller('OverviewController', function ($scope, $log, $sce) {

    //$scope.videoURLs = ["https://www.youtube.com/embed/4spwQ3hgmJA","https://www.youtube.com/embed/_CLXCOVR0i0","https://www.youtube.com/embed/N0Z-5VsLlIc","https://www.youtube.com/embed/yU_RBu7xsE8","https://www.youtube.com/embed/7c828hREF7A"];
    //$scope.videoNumber = 0;
	
	$( "#tabs" ).tabs();
});