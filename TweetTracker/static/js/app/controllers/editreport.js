/**
 * Created by anjoy92 on 4/14/17.
 */
app.controller('editReportCtrl', function ( $scope, $location, $http ,$rootScope,$state,$log,dynamicHeader) {
    console.log($state.params.reportId);
    report_id= $state.params.reportId;
    $scope.showDetails=false;
    $scope.selectedJobs=[];
    $scope.user ={};
    $scope.parameterError = false;
    $scope.nameValidationError = true;
    $scope.edit = false;

    $scope.report = {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        selectedJobs: [],
        sources: {tw:true,yt:false,'in':false,vk:false},
        allWords: [],
        anyWords: "", //this is keywords
        excludedWords: [],

        exactPhrase: "",
        hashtags: "", // also keywords?
        language: "",
        sourceAccounts: [],
        destAccounts: [],
        mentionedAccounts: [],
        geoboxesString: "", // this will need to be converted to geoboxes before submission
        'existingTweets': false

    };

    $scope.report.startDate = new Date();
    $scope.report.endDate = new Date();

    // This function converts date to string format
    var mapReport=function(reportDb){


        var report = $scope.report;

        var tempdate=new Date(reportDb.createtime);
        report.createtime=tempdate.toUTCString();
        report.id= reportDb.report_id;
        report.name= reportDb.reportname;
        if(reportDb.start_datetime!=undefined)
            report.startDate=new Date(reportDb.start_datetime*1000.0);
        if(reportDb.end_datetime!=undefined)
            report.endDate=new Date(reportDb.end_datetime*1000.0);
        if(reportDb.selectedJobs!=undefined) {
            report.selectedJobs = reportDb.selectedJobs;
            for(var ii in report.selectedJobs){
                $scope.selo.addItem(report.selectedJobs[ii]);
            }
        }

        if(reportDb.filter_by!=undefined)
        {
            if(reportDb.filter_by.indexOf("filterTweets")!=-1)
                document.getElementById("tweetMapFilter").checked = true;
            else
                document.getElementById("tweetMapFilter").checked = false;
            if(reportDb.filter_by.indexOf("filterImages")!=-1)
                document.getElementById("imageMapFilter").checked=true;
            else
                document.getElementById("imageMapFilter").checked=false;
            if(reportDb.filter_by.indexOf("filterVideos")!=-1)
                document.getElementById("videoMapFilter").checked=true;
            else
                document.getElementById("videoMapFilter").checked=false;
        }

        if(reportDb.allWords!=undefined) {
            report.allWords = reportDb.allWords;
            splitRes=report.allWords.split(',');
            for ( i in splitRes)
                $scope.input2.createItem(splitRes[i]);
        }
        if(reportDb.anyWords!=undefined) {
            report.anyWords = reportDb.anyWords;
            splitRes=report.anyWords.split(',');
            for ( i in splitRes)
                $scope.input3.createItem(splitRes[i]);
        }
        if(reportDb.noneWords!=undefined){
            report.excludedWords=reportDb.noneWords;
            splitRes=report.excludedWords.split(',');
            for ( i in splitRes)
                $scope.input4.createItem(splitRes[i]);
        }
        if(reportDb.exactPhrase!=undefined)
            report.exactPhrase=reportDb.exactPhrase;
        if(reportDb.hashtags!=undefined)
            report.hashtags=reportDb.hashtags;
        if(reportDb.language!=undefined)
            report.language=reportDb.language;
        if(reportDb.sourceAccounts!=undefined)
            report.sourceAccounts=reportDb.sourceAccounts;
        if(reportDb.destAccounts!=undefined)
            report.destAccounts=reportDb.destAccounts;
        if(reportDb.mentionedAccounts!=undefined)
            report.mentionedAccounts=reportDb.mentionedAccounts;
        if(reportDb.geoboxesString!=undefined)
            report.geoboxesString=reportDb.geoboxesString;
        if(reportDb.existingTweets!=undefined)
            report.existingTweets=reportDb.existingTweets;

        return report;
    };


    var getJobName = function(job) {
        return job.catname
    };
    var jobsPromise = $http.get('/api/job');
    jobsPromise.success(function(data, status, headers, config) {
        $scope.jobs = data.jobs.map(getJobName);
        setTimeout(function () {
            $scope.selo=    $('#selo').selectize({
                plugins: ['remove_button'],
                onChange: function(jobname) {
                    $scope.selectedJobs=jobname;
                }});

            $scope.selo=$scope.selo[0].selectize;
        } ,1);

        $scope.input2=$('#input2').selectize({
            plugins: ['remove_button'],
            delimiter: ',',
            persist: false,
            create: function(input) {
                return {
                    value: input,
                    text: input
                }
            }
        });
        $scope.input3=$('#input3').selectize({
            plugins: ['remove_button'],
            delimiter: ',',
            persist: false,
            create: function(input) {
                return {
                    value: input,
                    text: input
                }
            }
        });
        $scope.input4=$('#input4').selectize({
            plugins: ['remove_button'],
            delimiter: ',',
            persist: false,
            create: function(input) {
                return {
                    value: input,
                    text: input
                }
            }
        });
        $scope.input2=$scope.input2[0].selectize;
        $scope.input3=$scope.input3[0].selectize;
        $scope.input4=$scope.input4[0].selectize;

    });
    jobsPromise.error(function(data, status, headers, config) {
        data={"jobs":[{"categoryID":1,"catname":"Historical - EuroMaidan2","createtime":1485466436924,"creator":1,"crisisflag":1,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["#ukraine"," ukraine"," protest"," #kyiv"," #євромайдан"," #EuroMajdan"," crimea"," евромайдан"," euromaidan"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":2,"catname":"Historical - Crimean Invasion","createtime":1485466467569,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Sevastapol"," crimea"," воды"," води"," бензин"," паливо"," топливо"," свобода"," солдати"," солдаты"," Simferopol"," Kerch"," Tatars"," Feodosiya"," Yalta"," Yevpatoriya"," Krasnohvardiyske"," Крим"," Крым"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":3,"catname":"Historical - SW Ukrainian Unrest","createtime":1485466533412,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["euromaidan"," sosmaydan"," Rozlucka"," KRYMSOS"," Andriy_Kovalov"," Automaidan"," avtomaidanlviv"," kishka_ivan"," anatolpikul"," bilozerska"," Vitaliy_Klychko"," lissashch"," 5channel"," MariiaDomanska"," civicua"," HromadskeTV"," portnikov"," insider_ua"," OPORA"," avramchuk_katya"," Ivanna_Kozichko"," stopcensorship"," radiosvoboda"," medianext_ua"," EuromaidanPR"," KyivPost"," StopFakingNews"," uacrisis"," Yollika"," OMaydan"," andersostlund"," MGongadze"," natasedletska"," KyivPost_photo"," MVS_UA_en"," MVS_UA"," UaGov"," LiveUAMap"," Tggrove"," michaeldweiss"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":4,"catname":"Historical - General Ukrainian Material","createtime":1485466569347,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Ukraine"," #ukraine"," #Ukraine"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":5,"catname":"Historical - NATO","createtime":1485466599115,"creator":1,"crisisflag":1,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["BrilliantJump"," nato"," otan"," hato"," Отан"," НАТО"," #formin"," #vjtf"," #nrf16"," #NATO"," #TRJE 15"," Trident Juncture"," #stopNATO"," #HATO"," #TRJE15"," #TJ15"," TJ15"," TRJE"," Trident Juncture"," Hans-Lothar Domröse"," Richard Roßmanith"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]},{"categoryID":6,"catname":"Historical - Trump","createtime":1485466652862,"creator":1,"crisisflag":0,"desc":"","geoboxes":[],"includeincrawl":1,"keywords":["Trump"," electionday"," election2016"," donaldtrump"," hillaryclinton"," imwither"," makeamericagreatagain"," votetrump"," votehillary"],"last_tweet_time":0,"publicflag":1,"sources":["tw"],"userids":[],"yakmarkers":[]}]};
        $scope.jobs = data.jobs.map(getJobName);

        setTimeout(function () {
            $('#selo').selectize({
                plugins: ['remove_button'],
                onChange: function(jobname) {
                    console.log(jobname);
                    $scope.selectedJobs=jobname;
                }});
        } ,1);
    });

    setTimeout(function () {
        var reportCheck = $http.get('/api/report?report_id='+report_id);
         reportCheck.success(function(data, status, headers, config) {
        $scope.report = mapReport(data.report);
    });
    reportCheck.error(function(data, status, headers, config) {
        //TODO: Add a backup input for this
        console.log("DB not reachable.")
    });
    },500);




    // Post the new report, then redirect to the job listings
    $scope.updateReport = function () {

        var jobSources = [];
        //$scope.selectedJobs = [];

        var mapTweets = document.getElementById("tweetMapFilter").checked;
        var mapImages = document.getElementById("imageMapFilter").checked;
        var mapVideos = document.getElementById("videoMapFilter").checked;

        var tw_searchData = {
            filterTweets : mapTweets,
            filterImages : mapImages,
            filterVideos : mapVideos
        };
        for (k in tw_searchData){
            if(tw_searchData[k]){
                jobSources.push(k);
            }
        }

        console.log(report_id)
        var sendObj = {
            report_id:report_id,
            name: $scope.report.name,
            start_datetime: Math.floor($scope.report.startDate.getTime()/1000.0),
            end_datetime: Math.floor($scope.report.endDate.getTime()/1000.0),
            selectedJobs :$scope.selectedJobs,
            filter_by: jobSources,
            allWords: $scope.report.allWords,
            anyWords: $scope.report.anyWords,
            noneWords: $scope.report.excludedWords,
        };

        $log.info('Attempt to update report with name ' + $scope.report.name);

        var postPromise = $http.post('/api/updateReport', sendObj);
        $log.info(sendObj);
        //toastr.options.positionClass = 'toast-top-center';
        postPromise.success(function (data, status, headers, config) {
            $log.info("Created report successfully!");
            $scope.currentPath = $location.path('/myJobs');
            //toastr.success('Created job successfully!');
        });
        postPromise.error(function (data, status, headers, config) {
            $log.info("Failed to create report!");
            //toastr.error('Failed to create job!');
        });
    };



});