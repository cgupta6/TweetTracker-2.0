app.factory('State', function(){
  $http.get(/* init once per app */);

  return {
    formData:{},
  };
});

app.config(function($routeProvider){
 $routeProvider.when('/', {
   controller: 'MainCtrl'
 }).when('/another', {
   controller: 'SideCtrl'
 });
});

app.controller('MainCtrl', function($scope, State){
  $scope.formData = State.formData;   

 // $scope./* other scope stuff that deal with with your current page*/
});

app.controller('SideCtrl', function($scope, State){
  $scope.formData = State.formData; // same state from MainCtrl

});

app.directive('myDirective', function(State){
  return {
    controller: function(){
      State.formData; // same state!
    }
  };
});