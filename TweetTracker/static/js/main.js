/**
 * Main AngularJS Web Application
 */
var app = angular.module('tweetTrackerApp', [
    'ngMaterial', 'ngMessages', 'material.svgAssetsCache','ngTable','xeditable','ui.router'
]).config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('grey')
        .accentPalette('orange');
});

app.run(function(editableOptions, $location ) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

});

app.config(function ($stateProvider) {
    $stateProvider.state("home",{
        url:"/",
        controller:"homeCtrl",
        templateUrl:"static/templates/home.html"
    }).state("rawData",{
        url:"/rawData",
        controller:"rawDataCtrl",
        templateUrl:"static/templates/RawData.html"
    }).state("advancedAnalytics",{
        url:"/advancedAnalytics",
        controller:"advancedAnalyticsCtrl",
        templateUrl:"static/templates/advancedstats.html"
    }).state("myProfile",{
        url:"/myProfile",
        controller:"profileCtrl",
        templateUrl:"static/templates/MyProfile.html"
    }).state("editReport",{
        url:"/editReport/:reportId",
        controller:"editReportCtrl",
        templateUrl:"static/templates/UpdateReport.html"
    }).state("newReport",{
        url:"/newReport",
        controller:"newReportCtrl",
        templateUrl:"static/templates/NewReport.html"
    }).state("newCrawl",{
        url:"/newCrawl",
        controller:"newCrawlCtrl",
        templateUrl:"static/templates/NewCrawl.html"
    }).state("myJobs",{
        url:"/myJobs",
        controller:"myJobCtrl",
        templateUrl:"static/templates/MyJobs.html"
    }).state("basicstats",{
        url:"/basicstats",
        controller:"basicStatsCtrl",
        templateUrl:"static/templates/basicstats.html"
    });
});

app.controller('mainCtrl', function ( $scope, $location, $http,$rootScope ,dynamicHeader,$state) {
    console.log("Header Rendered");
    $scope.isReport=dynamicHeader;

    dynamicHeader.setReportTab($location.$$path);
    //$state.includes("contacts")

    $scope.$on('$viewContentLoaded', function(){
        $(".nav").find(".active").removeClass("active");
        if($location.$$path!="/")
            $("#"+$location.$$path.substr(1).split('/')[0]).parent().addClass("active");
    });
});

// Factory to show/hide report view or analysis Tabs
app.factory('dynamicHeader', function(){
    var isReportTab;
    var analysisTabs=["/basicstats","/advancedAnalytics","/rawData","/myJobs"];

    return {
        isReportTab: function() { return isReportTab; },
        setReportTab: function(newPath) {
            isReportTab = analysisTabs.indexOf(newPath) != -1;
        }
    };
});
