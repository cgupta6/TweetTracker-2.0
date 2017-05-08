// Factory to show/hide report view or analysis Tabs
angular.module("services2",[]).factory('reportService', function(){
    var reportname;

    return {
        getReportName: function() { return reportname; },
        setReportName: function(report) {
            reportname = report;
        }
    };
});
