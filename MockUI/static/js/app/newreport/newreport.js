/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('newReportCtrl', function ( $scope, $location, $http ,$rootScope,dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);

    $scope.jobs = ['22Mar17LondonAttack', "Agne's Job", ' Anakonda16 - Full - VK', 'Anakondasd16 - Twitter','22Mar17LosdndonAttack', "Agnesd's Job", ' Anakonda16 sdds- Full - VK', 'Anaksdsdonda16 - Twitter'];

    // Selected fruits
    $scope.selection = ['22Mar17LondonAttack', 'Anakonda16 - Full - VK'];

    // Toggle selection for a given fruit by name
    $scope.toggleSelection = function toggleSelection(fruitName) {
        var idx = $scope.selection.indexOf(fruitName);

        // Is currently selected
        if (idx > -1) {
            $scope.selection.splice(idx, 1);
        }

        // Is newly selected
        else {
            $scope.selection.push(fruitName);
        }
    };
});