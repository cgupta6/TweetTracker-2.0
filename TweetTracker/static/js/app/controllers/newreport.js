/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('newReportCtrl', function ( $scope, $location, $http ,$rootScope,dynamicHeader) {
    dynamicHeader.setReportTab($location.$$path);


    $scope.showDetails=false;
    $scope.startDate = new Date();
    $scope.endDate = new Date();


    var getJobName = function(job) {
        return job.catname
    };


    var jobsPromise = $http.get('/api/job');
    jobsPromise.success(function(data, status, headers, config) {
        $scope.jobs = data.jobs.map(getJobName);

    });
    jobsPromise.error(function(data, status, headers, config) {
        data={"jobs":[{"categoryID":1,"catname":"Historical - EuroMaidan2","createtime":1485466436924,"creator":1,"crisisflag":1,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["#ukraine"," ukraine"," protest"," #kyiv"," #євромайдан"," #EuroMajdan"," crimea"," евромайдан"," euromaidan"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":2,"catname":"Historical - Crimean Invasion","createtime":1485466467569,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Sevastapol"," crimea"," воды"," води"," бензин"," паливо"," топливо"," свобода"," солдати"," солдаты"," Simferopol"," Kerch"," Tatars"," Feodosiya"," Yalta"," Yevpatoriya"," Krasnohvardiyske"," Крим"," Крым"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":3,"catname":"Historical - SW Ukrainian Unrest","createtime":1485466533412,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["euromaidan"," sosmaydan"," Rozlucka"," KRYMSOS"," Andriy_Kovalov"," Automaidan"," avtomaidanlviv"," kishka_ivan"," anatolpikul"," bilozerska"," Vitaliy_Klychko"," lissashch"," 5channel"," MariiaDomanska"," civicua"," HromadskeTV"," portnikov"," insider_ua"," OPORA"," avramchuk_katya"," Ivanna_Kozichko"," stopcensorship"," radiosvoboda"," medianext_ua"," EuromaidanPR"," KyivPost"," StopFakingNews"," uacrisis"," Yollika"," OMaydan"," andersostlund"," MGongadze"," natasedletska"," KyivPost_photo"," MVS_UA_en"," MVS_UA"," UaGov"," LiveUAMap"," Tggrove"," michaeldweiss"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":4,"catname":"Historical - General Ukrainian Material","createtime":1485466569347,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Ukraine"," #ukraine"," #Ukraine"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":5,"catname":"Historical - NATO","createtime":1485466599115,"creator":1,"crisisflag":1,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["BrilliantJump"," nato"," otan"," hato"," Отан"," НАТО"," #formin"," #vjtf"," #nrf16"," #NATO"," #TRJE 15"," Trident Juncture"," #stopNATO"," #HATO"," #TRJE15"," #TJ15"," TJ15"," TRJE"," Trident Juncture"," Hans-Lothar Domröse"," Richard Roßmanith"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":6,"catname":"Historical - Trump","createtime":1485466652862,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Trump"," electionday"," election2016"," donaldtrump"," hillaryclinton"," imwither"," makeamericagreatagain"," votetrump"," votehillary"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]}]};
        $scope.jobs = data.jobs.map(getJobName);

    });

    //TODO: JS modification on form submission
    $scope.submit = function() {
        if ($scope.jobname) {
            $scope.list.push(this.text);
            $scope.text = '';
        }
    };








});