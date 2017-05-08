/**
 * Created by Kunal on 5/6/2017.
 */

// Factory to show/hide report view or analysis Tabs
angular.module("services",[]).factory('dynamicHeader', function(){
    var isReportTab;
    var analysisTabs=["/basicstats","/advancedAnalytics","/rawData"];

    return {
        isReportTab: function() { return isReportTab; },
        setReportTab: function(newPath) {
            isReportTab = analysisTabs.indexOf(newPath) != -1;
        }
    };
});