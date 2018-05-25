// Factory to show/hide report view or analysis Tabs
angular.module("services").factory('reportService', function(){

    return {
        getReportId: function() { return localStorage["reportId"]; },
        setReportId: function(report) {
            localStorage["reportId"]=report;
        }
    };
});
