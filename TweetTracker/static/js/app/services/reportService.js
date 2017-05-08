// Factory to show/hide report view or analysis Tabs
angular.module("services").factory('reportService', function(){
    var reportId;

    return {
        getReportId: function() { return reportId; },
        setReportId: function(report) {
            reportId = report;
        }
    };
});
