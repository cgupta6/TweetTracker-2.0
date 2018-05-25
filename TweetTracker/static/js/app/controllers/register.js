/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('registerCtrl', function ( $scope, $location, $http ,$log, $rootScope,$filter,dynamicHeader) {



    $scope.submitNewUser = function () {


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

        var postPromise = $http.post('/api/register', sendObj);
        $log.info(sendObj);
        //toastr.options.positionClass = 'toast-top-center';
        postPromise.success(function (data, status, headers, config) {
            $log.info("Account created successfully!");
            $scope.currentPath = $location.path('/');
            //toastr.success('Created job successfully!');
        });
        postPromise.error(function (data, status, headers, config) {
            $log.info("Failed to create account!");
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