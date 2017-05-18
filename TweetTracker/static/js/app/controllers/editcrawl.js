/**
 * Created by anjoy92 on 4/14/17.
 */
app.controller('editCrawlCtrl', function ( $scope, $location, $http ,$rootScope,$state,$log,dynamicHeader) {


     var jobSources = [];



    console.log($state.params.jobId);
    job_id= $state.params.jobId;
    $scope.parameterError = false;
    $scope.nameValidationError = true;
    $scope.edit = false;


    $scope.job = {
        id: 0,
        name: "",
        users: [],
        keywords: [],
        geoboxes: [],
        yakmarkers: [],
        'public': false,
        'crisisflag':false,
        sources: {tw:true,yt:false,'in':false,vk:false},

        // extra flags added by Christophe, not yet used in the back-end
        exactPhrase: "",
        allWords: [],
        anyWords: "", //this is keywords
        excludedWords: [],
        hashtags: "", // also keywords?
        language: "",
        sourceAccounts: [],
        mentionedAccounts: [],
        endDate: "",
        geoboxesString: "", // this will need to be converted to geoboxes before submission
        'existingTweets': false

    };

    $scope.username = 'Justin';
    $scope.numOfTweets = 1234;
    $scope.userLoaded = true;




    // This function converts date to string format
    var mapJob=function(jobDb){

        console.log(jobDb)
        var job = $scope.job;

        var tempdate=new Date(jobDb.createtime);
        job.createtime=tempdate.toUTCString();
        job.id= jobDb.job_id ;
        job.name= jobDb.catname;

        if(jobDb.sources!=undefined)
        {
            if(jobDb.sources.indexOf("tw")!=-1)
               $scope.job.sources[0] = true;
            else
               $scope.job.sources[0] = false;
            if(jobDb.sources.indexOf("yt")!=-1)
               $scope.job.sources[1]=true;
            else
               $scope.job.sources[1]=false;
            if(jobDb.sources.indexOf("vk")!=-1)
               $scope.job.sources[2]=true;
            else
               $scope.job.sources[2]=false;
        }

        if(jobDb.keywords!=undefined) {
            job.allWords = jobDb.keywords;
            console.log(job.allWords)
            splitRes= job.allWords;
            //splitRes=job.allWords.split(',');
            for ( i in splitRes) {
               $scope.input2.createItem(splitRes[i]);
            }
            //for ( i in splitRes)
            //    $scope.input2.createItem(splitRes[i]);
        }


        if(jobDb.anyWords!=undefined) {
            job.anyWords = jobDb.anyWords;
            splitRes=job.anyWords.split(',');
            for ( i in splitRes)
                $scope.input3.createItem(splitRes[i]);
        }
        if(jobDb.exactPhrase!=undefined)
            job.exactPhrase=jobDb.exactPhrase;
        if(jobDb.hashtags!=undefined)
            job.hashtags=jobDb.hashtags;
        if(jobDb.users!=undefined)
            job.sourceAccounts=jobDb.users;
      /*  if(reportDb.destAccounts!=undefined)
            report.destAccounts=reportDb.destAccounts;
        if(reportDb.mentionedAccounts!=undefined)
            report.mentionedAccounts=reportDb.mentionedAccounts;
        if(reportDb.geoboxesString!=undefined)
            report.geoboxesString=reportDb.geoboxesString;
        if(reportDb.existingTweets!=undefined)
            report.existingTweets=reportDb.existingTweets;
    */
        if(jobDb.publicflag==1)
            job.public =true;
        if(jobDb.crisisflag==1)
            job.crisisflag =true;

        return job;
    };


    var getJobName = function(job) {
        return job.catname
    };

    var jobsPromise = $http.get('/api/job');
    jobsPromise.success(function(data, status, headers, config) {
        $scope.jobs = data.jobs.map(getJobName);


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

        $scope.input2=$scope.input2[0].selectize;
        $scope.input3=$scope.input3[0].selectize;
        //$scope.input5=$scope.input5[0].selectize;

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
                }});report
        } ,1);
    });

    setTimeout(function () {
        var jobCheck = $http.get('/api/job/'+job_id);
         jobCheck.success(function(data, status, headers, config) {
        $scope.job = mapJob(data.job);
    });
    jobCheck.error(function(data, status, headers, config) {
        console.log("DB not reachable.")
    });
    },500);




    // Post the new report, then redirect to the job listings
    $scope.updateJob = function () {

       var jobSources = [];

        for (k in $scope.job.sources){
            if($scope.job.sources[k]){
                jobSources.push(k);
            }
        }

        var sendObj = {
            name: $scope.job.name,
            users: $scope.job.sourceAccounts,
            keywords: $scope.job.allWords.split(","),
            geoboxes: [],
            yakmarkers: [],
            'public': $scope.job.public,
            'crisisflag': $scope.job.crisisflag,
            sources: jobSources
        };

        $log.info('The user agent is: ' + navigator.userAgent);

        $log.info('Attempt to update job with name ' + $scope.job.name);

        var postPromise = $http.put('/api/job/'+ job_id, sendObj);
        $log.info(sendObj);
        //toastr.options.positionClass = 'toast-top-center';
        postPromise.success(function (data, status, headers, config) {
            $log.info("Created job successfully!");
            $scope.currentPath = $location.path('/myJobs');

           // toastr.success('Created job successfully!');
        });
        postPromise.error(function (data, status, headers, config) {
            $log.info("Failed to update job!");
           // toastr.error('Failed to create job!');
        });

    };


    $scope.deleteJob = function () {
        console.log("in delete job");
    };



});



