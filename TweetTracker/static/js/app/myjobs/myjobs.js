/**
 * Created by anjoy92 on 4/14/17.
 */

app.controller('myJobCtrl',[ '$scope','$rootScope','$location','$http','$state','NgTableParams','dynamicHeader', function($scope ,$rootScope, $location,$http,$state, NgTableParams,dynamicHeader) {

    dynamicHeader.setReportTab($location.$$path);

    $scope.go = function ( path ) {
        $location.path( path );
    };



    // Load the current user's jobs from the server
    $scope.jobs = [];
    $scope.allJobs = [];
    $scope.selectedJob = {};

    // This function takes a job from TweetTracker's API and adds some logical
    // structure to it
    var cleanJob = function(job) {
        var sourceObj = {yt:false,tw:false,vk:false,'in':false};

        for (var i = 0; i < job.sources.length; i++){
            sourceObj[job.sources[i]] = true;
        }

        return {
            id: job.categoryID,
            name: job.catname,
            keywords: job.keywords,
            users: job.userids.map(function(uid) { return uid['screen_name']; }),
            geoboxes: job.geoboxes,
            yakmarkers: job.yakmarkers,
            pub: job.publicflag,
            crisisflag : job.crisisflag,
            crawl: job.includeincrawl == 1,
            createtime: job.createtime,
            createstring: (new Date(job.createtime)).toUTCString(),
            sources: sourceObj
        }
    };
 $scope.reportCount=0;
    var jobsPromise = $http.get('/api/job');
    jobsPromise.success(function(data, status, headers, config) {
       $scope.jobs = data.jobs.map(cleanJob);
        console.log($scope.jobs);
        $scope.tableParams = new NgTableParams({ count: $scope.jobs.length}, { dataset: $scope.jobs, counts: []});
        $scope.reportCount = $scope.jobs.length;
    });
    jobsPromise.error(function(data, status, headers, config) {
        data={"jobs":[{"categoryID":1,"catname":"Historical - EuroMaidan","createtime":1485466436924,"creator":1,"crisisflag":1,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["#ukraine"," ukraine"," protest"," #kyiv"," #євромайдан"," #EuroMajdan"," crimea"," евромайдан"," euromaidan"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":2,"catname":"Historical - Crimean Invasion","createtime":1485466467569,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Sevastapol"," crimea"," воды"," води"," бензин"," паливо"," топливо"," свобода"," солдати"," солдаты"," Simferopol"," Kerch"," Tatars"," Feodosiya"," Yalta"," Yevpatoriya"," Krasnohvardiyske"," Крим"," Крым"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":3,"catname":"Historical - SW Ukrainian Unrest","createtime":1485466533412,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["euromaidan"," sosmaydan"," Rozlucka"," KRYMSOS"," Andriy_Kovalov"," Automaidan"," avtomaidanlviv"," kishka_ivan"," anatolpikul"," bilozerska"," Vitaliy_Klychko"," lissashch"," 5channel"," MariiaDomanska"," civicua"," HromadskeTV"," portnikov"," insider_ua"," OPORA"," avramchuk_katya"," Ivanna_Kozichko"," stopcensorship"," radiosvoboda"," medianext_ua"," EuromaidanPR"," KyivPost"," StopFakingNews"," uacrisis"," Yollika"," OMaydan"," andersostlund"," MGongadze"," natasedletska"," KyivPost_photo"," MVS_UA_en"," MVS_UA"," UaGov"," LiveUAMap"," Tggrove"," michaeldweiss"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":4,"catname":"Historical - General Ukrainian Material","createtime":1485466569347,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Ukraine"," #ukraine"," #Ukraine"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":5,"catname":"Historical - NATO","createtime":1485466599115,"creator":1,"crisisflag":1,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["BrilliantJump"," nato"," otan"," hato"," Отан"," НАТО"," #formin"," #vjtf"," #nrf16"," #NATO"," #TRJE 15"," Trident Juncture"," #stopNATO"," #HATO"," #TRJE15"," #TJ15"," TJ15"," TRJE"," Trident Juncture"," Hans-Lothar Domröse"," Richard Roßmanith"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":6,"catname":"Historical - Trump","createtime":1485466652862,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Trump"," electionday"," election2016"," donaldtrump"," hillaryclinton"," imwither"," makeamericagreatagain"," votetrump"," votehillary"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]}]};
       $scope.jobs = data.jobs.map(cleanJob);
        $scope.tableParams = new NgTableParams({ count: $scope.jobs.length}, { dataset: $scope.jobs, counts: []});
        $scope.reportCount = $scope.jobs.length;
    });

    $scope.imagePath = 'resources/img/washedout.png';

}]);


app.directive("actionButton", function() {
    return {
        template : '<div class="btn-group pull-right">\
                    <md-button class="md-raised md-small md-warn"  data-toggle="dropdown" ><i class="fa fa-cog"></i>Action</md-button>\
                    </button>\
                    <ul class="dropdown-menu">\
                        <li><a href=""><i class="fa fa-copy" style="padding-right: 5px;"></i>Clone Search</a></li>\
                            <li><a href=""><i class="fa fa-pencil-square-o" style="padding-right: 5px;"></i>Edit Report</a></li>\
                        <li role="separator" class="divider"></li>\
                        <li class="disabled" ><a href="""><i class="fa fa-undo" style="padding-right: 5px;"></i>Undo All Edits</a></li>\
                        <li role="separator" class="divider"></li>\
                        <li class="disabled" ><a href="""><i class="fa fa-bookmark" style="padding-right: 5px;"></i>Export Bookmarked</a></li>\
                        <li role="separator" class="divider"></li>\
                        <li><a href=""><i class="fa fa-share-alt" style="padding-right: 5px;"></i>Share/Unshare</a></li>\
                        <li><a href=""><i class="fa fa-archive" style="padding-right: 5px;"></i>Archive Report</a></li>\
                        <li class="disabled" ><a href="""><i class="fa fa-bell" style="padding-right: 5px;"></i>Alerts</a></li>\
                        <li role="separator" class="divider"></li>\
                        <li><a href=""><i class="fa fa-trash-o" style="padding-right: 5px;"></i>Delete Report</a></li>\
                    </ul>\
                    </div>'
    };
});