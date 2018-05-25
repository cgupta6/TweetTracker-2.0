var downloadQuery = angular.module('downloadQuery', ['ngRoute', ]);
downloadQuery.config(['$routeProvider','$sceDelegateProvider', function ($routeProvider,$sceDelegateProvider) {
    $routeProvider.when('/', {
        templateUrl: '',
        controller: 'downloadQuery'
    }).otherwise({
        redirectTo: '/'
    });

   
}]);

downloadQuery.controller('downloadQuery',['$http','$scope', function ($http,$scope) {
    $scope.dateWiseStat=function(){
        $('#loading_class').css('display','block');
        var from = moment($scope.fromDate).unix();
        var to = moment($scope.toDate).unix();
        var queryObject = {
            fromDate:from,
            toDate: to
        };
        var youtubePromise = $http.get('/api/getdatewise', {
            params: queryObject
        });
        youtubePromise.success(function(data, status, headers, config){
            tempData = JSON.stringify(data);
            var file = new Blob([tempData], { type: 'json' });
            saveAs(file, 'output.json');
            $("#tableForData").html('<table class="table table-bordered table-responsive"><thead><tr><th>Youtube Video</th><th>Final Count</th></tr></thead><tbody></tbody></table>');
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    $("#tableForData table tbody").append('<tr><td>' + key + '</td><td>' + data[key]['final_count'] + '</td></tr>');
                }
            }
            $('#loading_class').css('display','none');
        });
    }
}]);