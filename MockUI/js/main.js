/**
 * AngularJS Tutorial 1
 * @author Nick Kaye <nick.c.kaye@gmail.com>
 */

/**
 * Main AngularJS Web Application
 */
var app = angular.module('tutorialWebApp', [
    'ngRoute','ngMaterial', 'ngMessages', 'material.svgAssetsCache','ngTable'
]).config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('grey')
        .accentPalette('orange');
});


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    // Home
        .when("/", {templateUrl: "demo_partials/home.html", controller: "PageCtrl"})
        // Pages
        .when("/about", {templateUrl: "demo_partials/about.html", controller: "PageCtrl"})
        .when("/faq", {templateUrl: "demo_partials/faq.html", controller: "PageCtrl"})
        .when("/pricing", {templateUrl: "demo_partials/pricing.html", controller: "PageCtrl"})
        .when("/services", {templateUrl: "demo_partials/services.html", controller: "PageCtrl"})
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
app.controller('BlogCtrl', function (/* $scope, $location, $http */) {
    console.log("Blog Controller reporting for duty.");
});

/**
 * Controls all other Pages
 */
app.controller('PageCtrl', function (/* $scope, $location, $http */) {
    console.log("Page Controller reporting for duty.");

    // Activates the Carousel
    $('.carousel').carousel({
        interval: 5000
    });

    // Activates Tooltips for Social Links
    $('.tooltip-social').tooltip({
        selector: "a[data-toggle=tooltip]"
    })
});

app.controller('AppCtrl',[ '$scope','NgTableParams', function($scope, NgTableParams) {
    $scope.imagePath = 'resources/img/washedout.png';
    var data = [{name: "Moroni", age: 50} ,{name: "Morsoni", age: 30},{name: "Moronasi", age: 80},{name: "Morosni", age: 70}];
    $scope.tableParams = new NgTableParams({}, { dataset: data});
    $scope.tableParams2 = new NgTableParams({}, { dataset: data});
}]);