/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('profileCtrl', function ( $scope, $location, $http ,$log, $rootScope,$filter,dynamicHeader) {
    console.log("ProfileCtrl Controller reporting for duty.");

    dynamicHeader.setReportTab($location.$$path);

    $scope.user = {}
    var profileCheck = $http.get('/api/profile');
    profileCheck.success(function(data, status, headers, config) {
        console.log(data.firstname)
         $scope.user.firstname = data.firstname;
         $scope.user.lastname = data.lastname;
         $scope.user.email= data.email;
         $scope.user.phone = data.phone;
         $scope.user.account = data.account;
    });
    profileCheck.error(function(data, status, headers, config) {
        console.log(data)
    });

    $scope.updateUser = function () {


         var sendObj = {
            firstname: $scope.user.firstname,
            lastname: $scope.user.lastname,
            email:$scope.user.email,
            phone:$scope.user.phone,
            account:$scope.user.account,
            password:$scope.user.password,
            timezone:$scope.user.timezone
        };


        $log.info('The user agent is: ' + navigator.userAgent);

        var postPromise = $http.put('/api/updateUser', sendObj);
        $log.info(sendObj);
        //toastr.options.positionClass = 'toast-top-center';
        postPromise.success(function (data, status, headers, config) {
            $log.info("Account updated successfully!");
            $scope.currentPath = $location.path('/');
            //toastr.success('Created job successfully!');
        });
        postPromise.error(function (data, status, headers, config) {
            $log.info("Failed to update account!");
            //toastr.error('Failed to create job!');
        });
    };

    $scope.timezone='US/Mountain';

    $scope.timeZones = moment.tz.names().map(function(e){return {value:e,text:e}});

    $scope.showTimeZones = function() {
        var selected = $filter('filter')($scope.timeZones, {value: $scope.timezone});
        return ($scope.timezone && selected.length) ? selected[0].text : 'Not set';
    };

});
