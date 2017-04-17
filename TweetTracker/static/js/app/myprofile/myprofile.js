/**
 * Created by anjoy92 on 4/14/17.
 */

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