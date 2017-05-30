/**
 * Main AngularJS Web Application
 */
var app = angular.module('tweetTrackerApp', [
    'ngMaterial', 'ngMessages', 'material.svgAssetsCache','ngTable','xeditable','ui.router', 'selectize',"ngAnimate","services"
]).config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('grey')
        .accentPalette('orange');
});

app.factory("checkAuthentication", function($state) {
    return function () {
        return $.get('/checkAuth')
            .then(function (response) {
                    return response;
                }
                , function (_error) {
                    $state.go('/');
                });
    }
});

app.run(function(editableOptions, $location ) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

});

app.config(function ($stateProvider) {
    $stateProvider.state("home",{
        url:"/",
        controller:"homeCtrl",
        templateUrl:"static/templates/home.html"
    }).state("hm",{
        url:"",
        controller:"homeCtrl",
        templateUrl:"static/templates/home.html"
    }).state("login",{
        url:"/login",
        controller:"loginCtrl",
        templateUrl:"static/templates/login.html"
    }).state("rawData",{
        url:"/rawData/:reportId",
        controller:"rawDataCtrl",
        templateUrl:"static/templates/RawData.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("advancedAnalytics",{
        url:"/advancedAnalytics/:reportId",
        controller:"advancedAnalyticsCtrl",
        templateUrl:"static/templates/advancedanalytics.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("myProfile",{
        url:"/myProfile",
        controller:"profileCtrl",
        templateUrl:"static/templates/MyProfile.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("register",{
        url:"/register",
        controller:"registerCtrl",
        templateUrl:"static/templates/register.html"
    }).state("editReport",{
        url:"/editReport/:reportId",
        controller:"editReportCtrl",
        templateUrl:"static/templates/EditReport.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("newReport",{
        url:"/newReport",
        controller:"newReportCtrl",
        templateUrl:"static/templates/NewReport.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("newCrawl",{
        url:"/newCrawl",
        controller:"newCrawlCtrl",
        templateUrl:"static/templates/NewCrawl.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("editCrawl",{
        url:"/editCrawl/:jobId",
        controller:"editCrawlCtrl",
        templateUrl:"static/templates/EditCrawl.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("myJobs",{
        url:"/myJobs",
        controller:"myJobCtrl",
        templateUrl:"static/templates/MyJobs.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    }).state("basicstats",{
        url:"/basicstats/:reportId",
        controller:"basicStatsCtrl",
        templateUrl:"static/templates/basicstats.html",
        resolve : {
            resolveLogin : function(checkAuthentication){
                return checkAuthentication();
            }
        }
    });
});
app.controller('mainCtrl', function ( $scope, $location, $http,$rootScope ,dynamicHeader,$state) {
    //console.log("Header Rendered");
    $scope.isReport=dynamicHeader;

    dynamicHeader.setReportTab($location.$path);

    $scope.$on('$viewContentLoaded', function(){
        $(".nav").find(".active").removeClass("active");
        if(($location.$$path=="/")||($location.$$path=="/#")){}
        else
        $("#"+$location.$$path.substr(1).split('/')[0]).parent().addClass("active");
    });
});



app.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace-1) === '.' || value.charAt(lastspace-1) === ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});

