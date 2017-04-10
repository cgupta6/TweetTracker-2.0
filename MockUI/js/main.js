/**
 * AngularJS Tutorial 1
 * @author Nick Kaye <nick.c.kaye@gmail.com>
 */

/**
 * Main AngularJS Web Application
 */
var app = angular.module('tutorialWebApp', [
    'ngRoute','ngMaterial', 'ngMessages', 'material.svgAssetsCache','ngTable','xeditable'
]).config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('grey')
        .accentPalette('orange');
});
app.run(function(editableOptions) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});
// Factory to show/hide report view or analysis Tabs
app.factory('dynamicHeader', function(){
    var isReportTab;
    var analysisTabs=["/basicstats","/faq","/about","/myReports"];

    return {
        isReportTab: function() { return isReportTab; },
        setReportTab: function(newPath) {
            if(analysisTabs.indexOf(newPath)!=-1)
            {
                isReportTab=true;
            }
            else
            {
                isReportTab=false;
            }
        }
    };
});

/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    // Home
        .when("/", {templateUrl: "demo_partials/original_htmls/home.html", controller: "PageCtrl"})
        // Pages
        .when("/about", {templateUrl: "demo_partials/original_htmls/about.html", controller: "PageCtrl"})
        .when("/faq", {templateUrl: "demo_partials/original_htmls/faq.html", controller: "PageCtrl"})
        .when("/pricing", {templateUrl: "demo_partials/pricing.html", controller: "PageCtrl"})
        .when("/myProfile", {templateUrl: "demo_partials/MyProfile.html", controller: "profileCtrl"})
        .when("/contact", {templateUrl: "demo_partials/contact.html", controller: "PageCtrl"})
        .when("/editReport", {templateUrl: "demo_partials/UpdateReport.html", controller: "PageCtrl"})
        .when("/newReport", {templateUrl: "demo_partials/NewReport.html", controller: "PageCtrl"})
        // Blog
        .when("/blog", {templateUrl: "demo_partials/blog.html", controller: "BlogCtrl"})
        .when("/blog/post", {templateUrl: "demo_partials/blog_item.html", controller: "BlogCtrl"})
        .when("/myJobs", {templateUrl: "demo_partials/MyJobs.html", controller: "AppCtrl"})
        .when("/basicstats", {templateUrl: "partials/basicstats.html", controller: "AppCtrl"})
        // else 404
        .otherwise("/404", {templateUrl: "demo_partials/404.html", controller: "PageCtrl"});
}]);


/**
 * Controls the Blog
 */
app.controller('mainCtrl', function ( $scope, $location, $http,$rootScope ,dynamicHeader) {
    console.log("Header Rendered");
    $scope.isReport=dynamicHeader;
    dynamicHeader.setReportTab($location.$$path);
});

/**
 * Controls the Blog
 */
app.controller('BlogCtrl', function ( $scope, $location, $http ,$rootScope,dynamicHeader) {
    console.log("Blog Controller reporting for duty.");
    dynamicHeader.setReportTab($location.$$path);
});

/**
 * Controls all other Pages
 */
app.controller('PageCtrl', function ( $scope, $location, $http ,$rootScope,dynamicHeader) {
    console.log("Page Controller reporting for duty.");

    dynamicHeader.setReportTab($location.$$path);

    $scope.user = {
        name: 'awesome user'
    };
    console.log($scope.user);
    // Activates the Carousel
    $('.carousel').carousel({
        interval: 5000
    });

    // Activates Tooltips for Social Links
    $('.tooltip-social').tooltip({
        selector: "a[data-toggle=tooltip]"
    })
});

app.controller('profileCtrl', function ( $scope, $location, $http ,$rootScope,$filter,dynamicHeader) {
    console.log("ProfileCtrl Controller reporting for duty.");

    dynamicHeader.setReportTab($location.$$path);

    $scope.basic = {
        first_name: 'Shobhit',
        last_name: 'Sharma',
        email:'shobhitsharma92in@gmail.com',
        account:'Personal',
        password:'******',
        timezone:'US/Mountain'
    };

    $scope.limits= {
        search: 5,
        stream: 3
    };

    $scope.timeZones = moment.tz.names().map(function(e){return {value:e,text:e}});

    $scope.showTimeZones = function() {
        var selected = $filter('filter')($scope.timeZones, {value: $scope.basic.timezone});
        return ($scope.basic.timezone && selected.length) ? selected[0].text : 'Not set';
    };

});

app.controller('AppCtrl',[ '$scope','$rootScope','$location','NgTableParams','dynamicHeader', function($scope ,$rootScope, $location, NgTableParams,dynamicHeader) {

    dynamicHeader.setReportTab($location.$$path);

    $scope.imagePath = 'resources/img/washedout.png';
    var data = [{name: "Moroni", age: 50} ,{name: "Morsoni", age: 30},{name: "Moronasi", age: 80},{name: "Morosni", age: 70}];
    $scope.tableParams = new NgTableParams({}, { dataset: data});
    $scope.tableParams2 = new NgTableParams({}, { dataset: data});
}]);
