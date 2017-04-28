/**
 * Created by anjoy92 on 4/14/17.
 */


app.controller('advancedAnalyticsCtrl',[ '$scope','$rootScope','$location','NgTableParams','dynamicHeader', function($scope ,$rootScope, $location, NgTableParams,dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);
    $scope.showPopup=false;




    $scope.go = function ( path ) {
        $location.path( path );
    };
    var data=[];
    $scope.tableParams = new NgTableParams({ count: data.length}, { dataset: data, counts: []});




        var tempUsers = JSON.parse('[{"count":27427,"user":"Dbnmjr"},{"count":16248,"user":"RT_com"},{"count":11732,"user":"Steiner1776"},{"count":11675,"user":"interfaxua"},{"count":10437,"user":"EuromaidanPress"},{"count":9573,"user":"Liveuamap"},{"count":8763,"user":"Conflict_Report"},{"count":8675,"user":"uatodaytv"},{"count":8535,"user":"Sevodnay"},{"count":8444,"user":"EuromaidanPR"},{"count":8299,"user":"RobPulseNews"},{"count":8220,"user":"Novorossiyan"},{"count":7947,"user":"raging545"},{"count":7138,"user":"BungeeWedgie"},{"count":6835,"user":"SpecGhost"},{"count":6785,"user":"ukraina_ru"},{"count":6518,"user":"noclador"},{"count":6230,"user":"homo_viator"},{"count":5897,"user":"GrahamWP_UK"},{"count":5523,"user":"KyivPost"},{"count":5461,"user":"ukrpravda_news"},{"count":5429,"user":"rConflictNews"},{"count":5422,"user":"SputnikInt"},{"count":5190,"user":"ArmedResearch"},{"count":5066,"user":"olex_scherba"},{"count":4710,"user":"OnlineMagazin"},{"count":4484,"user":"MaxRTucker"},{"count":4393,"user":"poroshenko"},{"count":4344,"user":"wavetossed"},{"count":4338,"user":"MarkSleboda1"}]');
        $scope.users = tempUsers;

        $scope.tableParamsUser = new NgTableParams({}, {
            counts: [],
            dataset: $scope.users.slice(0,5)
        });






}])
;

