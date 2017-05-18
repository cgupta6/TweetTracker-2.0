/**
 * Created by anjoy92 on 4/14/17.
 */


app.controller('advancedAnalyticsCtrl',[ '$http','$scope','$rootScope','$location', '$mdSidenav','NgTableParams',
    'dynamicHeader','reportService', function($http, $scope ,$rootScope, $location,$mdSidenav, NgTableParams,dynamicHeader,reportService) {

    dynamicHeader.setReportTab($location.$$path);
    $scope.showPopup=false;
    $scope.showMainMenu=true;

    $scope.toggleLeft = buildToggler('left');
    $scope.toggleBack = restoreToggler('left');
    $scope.currentReport="";


    $scope.advancedReports=[{name:'Maps',image:'static/images/images.png'}
                            ,{name:'Top Users',image:'static/images/images.png'}];




    function buildToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            $scope.showMainMenu=false;
        };
    }

    function restoreToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            $scope.showMainMenu=true;
        };
    }

    $scope.go = function ( path ) {
        $location.path( path );
    };
    var data=[];
    $scope.tableParams = new NgTableParams({ count: data.length}, { dataset: data, counts: []});


    $scope.htmlString='<table ng-table="tableParamsUser" class="table" >\
        <tr ng-repeat="user in users">\
        <td  align="center"  title="User">\
        <a target="_blank" href="https://www.twitter.com/{{ user.user }}"> {{user.user}}</a></td>\
        <td  align="center" title="Mentions">\
                {{user.count}}</td>\
        </tr>\
        </table>';

        var tempUsers = JSON.parse('[{"count":27427,"user":"Dbnmjr"},{"count":16248,"user":"RT_com"},{"count":11732,"user":"Steiner1776"},{"count":11675,"user":"interfaxua"},{"count":10437,"user":"EuromaidanPress"},{"count":9573,"user":"Liveuamap"},{"count":8763,"user":"Conflict_Report"},{"count":8675,"user":"uatodaytv"},{"count":8535,"user":"Sevodnay"},{"count":8444,"user":"EuromaidanPR"},{"count":8299,"user":"RobPulseNews"},{"count":8220,"user":"Novorossiyan"},{"count":7947,"user":"raging545"},{"count":7138,"user":"BungeeWedgie"},{"count":6835,"user":"SpecGhost"},{"count":6785,"user":"ukraina_ru"},{"count":6518,"user":"noclador"},{"count":6230,"user":"homo_viator"},{"count":5897,"user":"GrahamWP_UK"},{"count":5523,"user":"KyivPost"},{"count":5461,"user":"ukrpravda_news"},{"count":5429,"user":"rConflictNews"},{"count":5422,"user":"SputnikInt"},{"count":5190,"user":"ArmedResearch"},{"count":5066,"user":"olex_scherba"},{"count":4710,"user":"OnlineMagazin"},{"count":4484,"user":"MaxRTucker"},{"count":4393,"user":"poroshenko"},{"count":4344,"user":"wavetossed"},{"count":4338,"user":"MarkSleboda1"}]');
        $scope.users = tempUsers;

        $scope.tableParamsUser = new NgTableParams({}, {
            counts: [],
            dataset: $scope.users.slice(0,5)
        });



    $scope.report_id=reportService.getReportId();
   setTimeout(function () {
        var reportCheck = $http.get('/api/report?report_id='+$scope.report_id);
        reportCheck.success(function(data, status, headers, config) {
            //$scope.reportSpec = convertDate(data.report);
            $scope.reportSpec = data.report;

            console.log(data);

            var jobsPromise = $http.get('/api/job');
            jobsPromise.success(function(data, status, headers, config) {
                $scope.jobs = data.jobs.map(cleanJob);
                console.log("jobs:");
                console.log($scope.jobs);
                $scope.categoryID = $scope.reportSpec.selectedJobs.map(function(job) {

                for (item in $scope.jobs)
                {

                    if($scope.jobs[item].name==job)
                        return $scope.jobs[item].id;
                }
             });
            console.log($scope.categoryID);

            getLocations();
            getTweets();
        });
        reportCheck.error(function(data, status, headers, config) {
            //TODO: Add a backup input for this
            console.log("DB not reachable.")
        });
        });
    },500);



    var getTweets = function () {
            console.log("start date:");
            console.log($scope.reportSpec.start_datetime);
            var queryObject = {
                categoryID: $scope.categoryID,
                start_time: $scope.reportSpec.start_datetime,
                end_time: $scope.reportSpec.end_datetime
            };

            var tweetsPromise = $http.get('/api/gettweets', {
                params: queryObject
            });
            tweetsPromise.success(function (data, status, headers, config) {
                $scope.tweets = data.tweets;

            });
            tweetsPromise.error(function (data, status, headers, config) {
                console.log("Failed to load tweets from the API!");
            });
         };


     var cleanJob = function(job) {
        return {
            id: job['categoryID'],
            name: job['catname'],
            selected: false,
            crawling: job['includeincrawl'] === 1
        }
    };
   // Retrieves the locations from the server
    var getLocations = function () {

        var queryObject = {
            job_ids: $scope.categoryID,
            start_time: $scope.reportSpec.start_datetime,
            end_time: $scope.reportSpec.end_datetime
        };

        var locationsPromise = $http.get('/api/entities/locations', {
            params: queryObject
        });

        locationsPromise.success(function (data, status, headers, config) {
            var tweetlocations = data["tweetlocations"];
            var imagelocations = data["imagelocations"];
            var videolocations = data["videolocations"];
            var locations = [];
            locations = locations.concat(tweetlocations);
            locations = locations.concat(imagelocations);
            locations = locations.concat(videolocations);

            $scope.locations = locations;

        });
        locationsPromise.error(function (data, status, headers, config) {
            console.log("Failed to load locations from the API!");
        });
    };


  var getLocations1 = function () {
        // if ($scope.selectedJobs.length === 0)
        //     return;
        //
        // $scope.locationsError = false;
        // $scope.locationsLoaded = false;
        // $scope.locationsLoading = true;
        //
        // var queryObject = {
        //     job_ids: $scope.selectedJobs.map(function(job) { return job.id; }),
        //     begin_time: Math.round($scope.dtBegin.getTime() / 1000),
        //     end_time: Math.round($scope.dtEnd.getTime() / 1000)
        // };
        //
        // var locationsPromise = $http.get('/api/entities/locations', {
        //     params: queryObject
        // });
        //
        // locationsPromise.success(function (data, status, headers, config) {
        //     var tweetlocations = data["tweetlocations"];
        //     var imagelocations = data["imagelocations"];
        //     var videolocations = data["videolocations"];
        //     var locations = [];
        //     if(document.getElementById("tweetMapFilter").checked){
        //         locations = locations.concat(tweetlocations);
        //     }
        //     if(document.getElementById("imageMapFilter").checked){
        //          locations = locations.concat(imagelocations);
        //     }
        //     if(document.getElementById("videoMapFilter").checked) {
        //         locations = locations.concat(videolocations);
        //     }
        //
        //     $scope.locations = locations;
        //     sessionStorage.setItem("tw_locations",JSON.stringify(locations));
        //
        //     $scope.locationsLoading = false;
        //     $scope.locationsLoaded = true;
        // });
        // locationsPromise.error(function (data, status, headers, config) {
        //    var tempData = '[{"index":"196-3338581476558656","lat":55.777684432226,"lng":37.647125756032,"type":"tweet"},{"index":"844715247726477312-10241490230783","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"7871-6668581491421255","lat":56.95331295885,"lng":24.054685223871,"type":"tweet"},{"index":"2896-3338581476774796","lat":57.968606889734,"lng":56.260960343802,"type":"tweet"},{"index":"844719537299767296-10241490231806","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"7136-6668581492071992","lat":55.016698569399,"lng":82.933309924083,"type":"tweet"},{"index":"27373-3338581491985149","lat":50.44565278756,"lng":30.51766939867,"type":"tweet"},{"index":"844817648219111424-10241490255197","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"11441-6668581492186931","lat":45.046313549531,"lng":41.976287367234,"type":"tweet"},{"index":"3121-3338581492091353","lat":51.233298476112,"lng":51.366706879856,"type":"tweet"},{"index":"844821426779537409-10241490256098","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"2882-6668581492350571","lat":52.967683126078,"lng":36.075080837996,"type":"tweet"},{"index":"8962-3338581492356957","lat":58.128199596309,"lng":24.509254826052,"type":"tweet"},{"index":"844825951846354944-10241490257177","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"770-6668581492514597","lat":59.425744379997,"lng":24.647173529825,"type":"tweet"},{"index":"4894-3338581492499110","lat":44.820603927196,"lng":20.462179926495,"type":"tweet"},{"index":"844830978656747520-10241490258376","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"206-6668581494512731","lat":40.395309849311,"lng":49.882206925346,"type":"tweet"},{"index":"4444-3338581494624017","lat":61.783297205535,"lng":34.333284830477,"type":"tweet"},{"index":"844836040686809088-10241490259583","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"1606-3338581494861588","lat":42.404724351545,"lng":18.72331106545,"type":"tweet"},{"index":"844841044285931520-10241490260776","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844713333420896257-3340241490230327","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844841070429069312-10241490260782","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844714207392206848-3340241490230535","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844846063139733504-10241490261972","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844714447801384960-3340241490230593","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"844846377066639360-10241490262047","lat":51.4743956,"lng":-0.3438765,"type":"tweet"},{"index":"844715204717903872-3340241490230773","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"844851116462432256-10241490263177","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844735371145469953-3340241490235581","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"844851153846202368-10241490263186","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844810854654631936-3340241490253578","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844851350106091521-10241490263233","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844815886720499713-3340241490254777","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844852575157436418-10241490263525","lat":51.5036017,"lng":-0.1308044,"type":"tweet"},{"index":"844820949841076224-3340241490255985","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844856130874486785-10241490264372","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844825948939739137-3340241490257176","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844856151841812480-10241490264377","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844831005143818240-3340241490258382","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844861187695161345-10241490265578","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844836014359117825-3340241490259576","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844861210977681411-10241490265584","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844836055362654208-3340241490259586","lat":45.48,"lng":9.23,"type":"tweet"},{"index":"844863137790668802-10241490266043","lat":51.50711486,"lng":-0.12731805,"type":"tweet"},{"index":"844841047398137857-3340241490260776","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844866411176509440-10241490266823","lat":55.9319884,"lng":-4.0195134,"type":"tweet"},{"index":"844845312158027776-3340241490261793","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844871246575644675-10241490267976","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844846080835502080-3340241490261976","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844875521083281408-10241490268995","lat":51.50711486,"lng":-0.12731805,"type":"tweet"},{"index":"844851142949453824-3340241490263183","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844876260031414272-10241490269172","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844856148708646912-3340241490264377","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844876276980563970-10241490269176","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844856174277099520-3340241490264383","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844881294496415745-10241490270372","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844856185312337920-3340241490264385","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844881347206262784-10241490270384","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844861167218581504-3340241490265573","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844891543647375360-10241490272815","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844866212920094722-3340241490266776","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844896556167815169-10241490274011","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844871226971471872-3340241490267972","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844896573943296006-10241490274015","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844871284014014464-3340241490267985","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844901581384404993-10241490275209","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844876310421786625-3340241490269184","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844909789339680768-10241490277166","lat":51.5396,"lng":-0.1608,"type":"tweet"},{"index":"844882647457386496-3340241490270694","lat":51.46318889,"lng":-0.30061944,"type":"tweet"},{"index":"844916682988519425-10241490278809","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844886489553027073-3340241490271610","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844941870480293889-10241490284814","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844886505898164229-3340241490271614","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844946901187252224-10241490286014","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844886540958380032-3340241490271623","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844953260733575169-10241490287530","lat":52.4778,"lng":-1.89429,"type":"tweet"},{"index":"844891586609631232-3340241490272826","lat":38.8991,"lng":-77.029,"type":"tweet"},{"index":"844956474379948032-10241490288296","lat":-0.0244,"lng":37.9039,"type":"tweet"},{"index":"844901598350393344-3340241490275213","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844971551120347137-10241490291891","lat":52.51625426,"lng":13.37847114,"type":"tweet"},{"index":"844911655259561986-3340241490277610","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845060620974264321-10241490313127","lat":-35.30963878,"lng":149.1086647,"type":"tweet"},{"index":"844915932279570436-3340241490278630","lat":52.3425599,"lng":9.7537009,"type":"tweet"},{"index":"845065022187474945-10241490314176","lat":53.81,"lng":-1.49,"type":"tweet"},{"index":"844916701854511108-3340241490278814","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845128733522472960-10241490329366","lat":13.69300042,"lng":101.08814936,"type":"tweet"},{"index":"844921711531208704-3340241490280008","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845180338624114689-10241490341670","lat":51.5011719,"lng":-0.108488,"type":"tweet"},{"index":"844926752342196229-3340241490281210","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845240886833414145-10241490356105","lat":36.7455812,"lng":7.6661755,"type":"tweet"},{"index":"844931781555978241-3340241490282409","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845374256984788992-10241490387903","lat":-33.89839204,"lng":151.13811085,"type":"tweet"},{"index":"844936828192866304-3340241490283612","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845401748231671809-10241490394458","lat":51.50055556,"lng":-0.12666667,"type":"tweet"},{"index":"844958948734099456-3340241490288886","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"845460850529980416-10241490408549","lat":53.42919167,"lng":-2.129155,"type":"tweet"},{"index":"845037653007437824-3340241490307651","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"846054948777463809-10241490550193","lat":-6.26679,"lng":106.72625,"type":"tweet"},{"index":"845080716899762176-3340241490317918","lat":-2.79845,"lng":108.23053,"type":"tweet"},{"index":"846629422144917504-10241490687158","lat":51.4804363,"lng":-3.1988749,"type":"tweet"},{"index":"845087809434148864-3340241490319609","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"857222000304992256-10241493212625","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"845141389272801280-3340241490332383","lat":30.4419,"lng":69.3597,"type":"tweet"},{"index":"844712210651906048-6670241490230059","lat":38.8991,"lng":-77.029,"type":"tweet"},{"index":"845143145859837952-3340241490332802","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"844720274700316673-6670241490231982","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"845289129445285888-3340241490367607","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844729823968686080-6670241490234259","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"845360213486190592-3340241490384555","lat":36.7473911,"lng":7.7321538,"type":"tweet"},{"index":"844737122674257920-6670241490235999","lat":25.7594063,"lng":82.4996712,"type":"tweet"},{"index":"845369812423446529-3340241490386844","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"844805820730658816-6670241490252378","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"845370575275085824-3340241490387026","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"844820947110551555-6670241490255984","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845379248722370560-3340241490389093","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844820973572403200-6670241490255990","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"845450890668470272-3340241490406174","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"844825973497315328-6670241490257182","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"845466106923925504-3340241490409802","lat":53.3831,"lng":-1.4645,"type":"tweet"},{"index":"844836017181929477-6670241490259577","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"852468154546532353-3340241492079220","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844837762314334208-6670241490259993","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844839253196492801-6670241490260348","lat":-28.4832,"lng":24.677,"type":"tweet"},{"index":"844841027567403008-6670241490260772","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844843393666625537-6670241490261336","lat":51.50711486,"lng":-0.12731805,"type":"tweet"},{"index":"844846105233842177-6670241490261982","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844846127908216832-6670241490261988","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844851093980930048-6670241490263172","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844851113387933696-6670241490263176","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844861184939479043-6670241490265577","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844861221744525314-6670241490265586","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844866194809118720-6670241490266772","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844866218523713537-6670241490266778","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844866254766665732-6670241490266786","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844871249327108096-6670241490267977","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844880247875141633-6670241490270122","lat":55.9319997,"lng":-4.0191688,"type":"tweet"},{"index":"844881311999258624-6670241490270376","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844889572341235712-6670241490272345","lat":38.8991,"lng":-77.029,"type":"tweet"},{"index":"844891525423104002-6670241490272811","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844891579030528001-6670241490272824","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844906616398893056-6670241490276409","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844906634447011844-6670241490276413","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844908656269414400-6670241490276895","lat":53.8529888,"lng":-2.1824175,"type":"tweet"},{"index":"844911673660006400-6670241490277615","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844921728119693312-6670241490280012","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844922913287557124-6670241490280295","lat":51.6532077,"lng":-0.2014648,"type":"tweet"},{"index":"844926769320779777-6670241490281214","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844931797947342848-6670241490282413","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844934897336705024-6670241490283152","lat":22.19606219,"lng":84.58528146,"type":"tweet"},{"index":"844954376276000768-6670241490287796","lat":50.81989633,"lng":4.43044134,"type":"tweet"},{"index":"845006998714277888-6670241490300342","lat":-36.7881664,"lng":174.7536789,"type":"tweet"},{"index":"845040699141734402-6670241490308377","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"845148177325948928-6670241490334002","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"845153236625481728-6670241490335208","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"845272264085942273-6670241490363586","lat":46.813,"lng":8.4445,"type":"tweet"},{"index":"845284090328760320-6670241490366406","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845298582446096384-6670241490369861","lat":51.50055556,"lng":-0.12666667,"type":"tweet"},{"index":"845432114359156736-6670241490401698","lat":53.3831,"lng":-1.4645,"type":"tweet"},{"index":"845462834855235584-6670241490409022","lat":53.429238,"lng":-2.128977,"type":"tweet"},{"index":"845601871569956864-6670241490442171","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"846039896619794432-6670241490546604","lat":53.3831,"lng":-1.4645,"type":"tweet"},{"index":"75-8581476610317","lat":42.899873457036,"lng":71.368666356403,"type":"tweet"},{"index":"882-8581476681829","lat":40.383366391523,"lng":49.877679830332,"type":"tweet"},{"index":"3246-8581491371651","lat":57.968578929141,"lng":56.261052782818,"type":"tweet"},{"index":"3294-8581491835470","lat":59.935265759528,"lng":30.302898021657,"type":"tweet"},{"index":"207-8581491895202","lat":42.987244126932,"lng":47.501172772595,"type":"tweet"},{"index":"4071-8581491906420","lat":41.61892131697,"lng":45.921702056815,"type":"tweet"},{"index":"3261-8581492071687","lat":57.993157725304,"lng":56.215862033047,"type":"tweet"},{"index":"2703-8581492074469","lat":42.255002495439,"lng":18.896117826367,"type":"tweet"},{"index":"3120-8581492074517","lat":51.233298476112,"lng":51.366706879856,"type":"tweet"},{"index":"6282-8581494412305","lat":40.185758428615,"lng":44.524261936792,"type":"tweet"},{"index":"9087-8581494875885","lat":51.207311266817,"lng":3.2269694621865,"type":"tweet"},{"index":"699-8581494925982","lat":49.995983881118,"lng":36.237038095552,"type":"tweet"},{"index":"4056-8581494934818","lat":50.960838938352,"lng":6.0424858922948,"type":"tweet"}]'
        //
        //     $scope.locations = JSON.parse(tempData); //locations
        //
        //     $log.error("Failed to load locations from the API!");
        //
        //     // $scope.locationsLoading = false;
        //     // $scope.locationsError = true;
        // });
         var tempData = '[{"index":"196-3338581476558656","lat":55.777684432226,"lng":37.647125756032,"type":"tweet"},{"index":"844715247726477312-10241490230783","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"7871-6668581491421255","lat":56.95331295885,"lng":24.054685223871,"type":"tweet"},{"index":"2896-3338581476774796","lat":57.968606889734,"lng":56.260960343802,"type":"tweet"},{"index":"844719537299767296-10241490231806","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"7136-6668581492071992","lat":55.016698569399,"lng":82.933309924083,"type":"tweet"},{"index":"27373-3338581491985149","lat":50.44565278756,"lng":30.51766939867,"type":"tweet"},{"index":"844817648219111424-10241490255197","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"11441-6668581492186931","lat":45.046313549531,"lng":41.976287367234,"type":"tweet"},{"index":"3121-3338581492091353","lat":51.233298476112,"lng":51.366706879856,"type":"tweet"},{"index":"844821426779537409-10241490256098","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"2882-6668581492350571","lat":52.967683126078,"lng":36.075080837996,"type":"tweet"},{"index":"8962-3338581492356957","lat":58.128199596309,"lng":24.509254826052,"type":"tweet"},{"index":"844825951846354944-10241490257177","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"770-6668581492514597","lat":59.425744379997,"lng":24.647173529825,"type":"tweet"},{"index":"4894-3338581492499110","lat":44.820603927196,"lng":20.462179926495,"type":"tweet"},{"index":"844830978656747520-10241490258376","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"206-6668581494512731","lat":40.395309849311,"lng":49.882206925346,"type":"tweet"},{"index":"4444-3338581494624017","lat":61.783297205535,"lng":34.333284830477,"type":"tweet"},{"index":"844836040686809088-10241490259583","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"1606-3338581494861588","lat":42.404724351545,"lng":18.72331106545,"type":"tweet"},{"index":"844841044285931520-10241490260776","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844713333420896257-3340241490230327","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844841070429069312-10241490260782","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844714207392206848-3340241490230535","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844846063139733504-10241490261972","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844714447801384960-3340241490230593","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"844846377066639360-10241490262047","lat":51.4743956,"lng":-0.3438765,"type":"tweet"},{"index":"844715204717903872-3340241490230773","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"844851116462432256-10241490263177","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844735371145469953-3340241490235581","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"844851153846202368-10241490263186","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844810854654631936-3340241490253578","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844851350106091521-10241490263233","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844815886720499713-3340241490254777","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844852575157436418-10241490263525","lat":51.5036017,"lng":-0.1308044,"type":"tweet"},{"index":"844820949841076224-3340241490255985","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844856130874486785-10241490264372","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844825948939739137-3340241490257176","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844856151841812480-10241490264377","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844831005143818240-3340241490258382","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844861187695161345-10241490265578","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844836014359117825-3340241490259576","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844861210977681411-10241490265584","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844836055362654208-3340241490259586","lat":45.48,"lng":9.23,"type":"tweet"},{"index":"844863137790668802-10241490266043","lat":51.50711486,"lng":-0.12731805,"type":"tweet"},{"index":"844841047398137857-3340241490260776","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844866411176509440-10241490266823","lat":55.9319884,"lng":-4.0195134,"type":"tweet"},{"index":"844845312158027776-3340241490261793","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844871246575644675-10241490267976","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844846080835502080-3340241490261976","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844875521083281408-10241490268995","lat":51.50711486,"lng":-0.12731805,"type":"tweet"},{"index":"844851142949453824-3340241490263183","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844876260031414272-10241490269172","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844856148708646912-3340241490264377","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844876276980563970-10241490269176","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844856174277099520-3340241490264383","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844881294496415745-10241490270372","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844856185312337920-3340241490264385","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844881347206262784-10241490270384","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844861167218581504-3340241490265573","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844891543647375360-10241490272815","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844866212920094722-3340241490266776","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844896556167815169-10241490274011","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844871226971471872-3340241490267972","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844896573943296006-10241490274015","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844871284014014464-3340241490267985","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844901581384404993-10241490275209","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844876310421786625-3340241490269184","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844909789339680768-10241490277166","lat":51.5396,"lng":-0.1608,"type":"tweet"},{"index":"844882647457386496-3340241490270694","lat":51.46318889,"lng":-0.30061944,"type":"tweet"},{"index":"844916682988519425-10241490278809","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844886489553027073-3340241490271610","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844941870480293889-10241490284814","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844886505898164229-3340241490271614","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844946901187252224-10241490286014","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844886540958380032-3340241490271623","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844953260733575169-10241490287530","lat":52.4778,"lng":-1.89429,"type":"tweet"},{"index":"844891586609631232-3340241490272826","lat":38.8991,"lng":-77.029,"type":"tweet"},{"index":"844956474379948032-10241490288296","lat":-0.0244,"lng":37.9039,"type":"tweet"},{"index":"844901598350393344-3340241490275213","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844971551120347137-10241490291891","lat":52.51625426,"lng":13.37847114,"type":"tweet"},{"index":"844911655259561986-3340241490277610","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845060620974264321-10241490313127","lat":-35.30963878,"lng":149.1086647,"type":"tweet"},{"index":"844915932279570436-3340241490278630","lat":52.3425599,"lng":9.7537009,"type":"tweet"},{"index":"845065022187474945-10241490314176","lat":53.81,"lng":-1.49,"type":"tweet"},{"index":"844916701854511108-3340241490278814","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845128733522472960-10241490329366","lat":13.69300042,"lng":101.08814936,"type":"tweet"},{"index":"844921711531208704-3340241490280008","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845180338624114689-10241490341670","lat":51.5011719,"lng":-0.108488,"type":"tweet"},{"index":"844926752342196229-3340241490281210","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845240886833414145-10241490356105","lat":36.7455812,"lng":7.6661755,"type":"tweet"},{"index":"844931781555978241-3340241490282409","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"845374256984788992-10241490387903","lat":-33.89839204,"lng":151.13811085,"type":"tweet"},{"index":"844936828192866304-3340241490283612","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845401748231671809-10241490394458","lat":51.50055556,"lng":-0.12666667,"type":"tweet"},{"index":"844958948734099456-3340241490288886","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"845460850529980416-10241490408549","lat":53.42919167,"lng":-2.129155,"type":"tweet"},{"index":"845037653007437824-3340241490307651","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"846054948777463809-10241490550193","lat":-6.26679,"lng":106.72625,"type":"tweet"},{"index":"845080716899762176-3340241490317918","lat":-2.79845,"lng":108.23053,"type":"tweet"},{"index":"846629422144917504-10241490687158","lat":51.4804363,"lng":-3.1988749,"type":"tweet"},{"index":"845087809434148864-3340241490319609","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"857222000304992256-10241493212625","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"845141389272801280-3340241490332383","lat":30.4419,"lng":69.3597,"type":"tweet"},{"index":"844712210651906048-6670241490230059","lat":38.8991,"lng":-77.029,"type":"tweet"},{"index":"845143145859837952-3340241490332802","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"844720274700316673-6670241490231982","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"845289129445285888-3340241490367607","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844729823968686080-6670241490234259","lat":0.1097,"lng":113.9174,"type":"tweet"},{"index":"845360213486190592-3340241490384555","lat":36.7473911,"lng":7.7321538,"type":"tweet"},{"index":"844737122674257920-6670241490235999","lat":25.7594063,"lng":82.4996712,"type":"tweet"},{"index":"845369812423446529-3340241490386844","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"844805820730658816-6670241490252378","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"845370575275085824-3340241490387026","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"844820947110551555-6670241490255984","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845379248722370560-3340241490389093","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844820973572403200-6670241490255990","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"845450890668470272-3340241490406174","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"844825973497315328-6670241490257182","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"845466106923925504-3340241490409802","lat":53.3831,"lng":-1.4645,"type":"tweet"},{"index":"844836017181929477-6670241490259577","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"852468154546532353-3340241492079220","lat":51.50083333,"lng":-0.12194444,"type":"tweet"},{"index":"844837762314334208-6670241490259993","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844839253196492801-6670241490260348","lat":-28.4832,"lng":24.677,"type":"tweet"},{"index":"844841027567403008-6670241490260772","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844843393666625537-6670241490261336","lat":51.50711486,"lng":-0.12731805,"type":"tweet"},{"index":"844846105233842177-6670241490261982","lat":47.6965,"lng":14.7545,"type":"tweet"},{"index":"844846127908216832-6670241490261988","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844851093980930048-6670241490263172","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844851113387933696-6670241490263176","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844861184939479043-6670241490265577","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844861221744525314-6670241490265586","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844866194809118720-6670241490266772","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844866218523713537-6670241490266778","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844866254766665732-6670241490266786","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844871249327108096-6670241490267977","lat":51.9189,"lng":19.1343,"type":"tweet"},{"index":"844880247875141633-6670241490270122","lat":55.9319997,"lng":-4.0191688,"type":"tweet"},{"index":"844881311999258624-6670241490270376","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844889572341235712-6670241490272345","lat":38.8991,"lng":-77.029,"type":"tweet"},{"index":"844891525423104002-6670241490272811","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844891579030528001-6670241490272824","lat":3.9451,"lng":114.4017,"type":"tweet"},{"index":"844906616398893056-6670241490276409","lat":41.9031,"lng":12.4958,"type":"tweet"},{"index":"844906634447011844-6670241490276413","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844908656269414400-6670241490276895","lat":53.8529888,"lng":-2.1824175,"type":"tweet"},{"index":"844911673660006400-6670241490277615","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844921728119693312-6670241490280012","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844922913287557124-6670241490280295","lat":51.6532077,"lng":-0.2014648,"type":"tweet"},{"index":"844926769320779777-6670241490281214","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844931797947342848-6670241490282413","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"844934897336705024-6670241490283152","lat":22.19606219,"lng":84.58528146,"type":"tweet"},{"index":"844954376276000768-6670241490287796","lat":50.81989633,"lng":4.43044134,"type":"tweet"},{"index":"845006998714277888-6670241490300342","lat":-36.7881664,"lng":174.7536789,"type":"tweet"},{"index":"845040699141734402-6670241490308377","lat":51.50805556,"lng":-0.12805556,"type":"tweet"},{"index":"845148177325948928-6670241490334002","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"845153236625481728-6670241490335208","lat":52.5161,"lng":13.377,"type":"tweet"},{"index":"845272264085942273-6670241490363586","lat":46.813,"lng":8.4445,"type":"tweet"},{"index":"845284090328760320-6670241490366406","lat":31.3893,"lng":35.3612,"type":"tweet"},{"index":"845298582446096384-6670241490369861","lat":51.50055556,"lng":-0.12666667,"type":"tweet"},{"index":"845432114359156736-6670241490401698","lat":53.3831,"lng":-1.4645,"type":"tweet"},{"index":"845462834855235584-6670241490409022","lat":53.429238,"lng":-2.128977,"type":"tweet"},{"index":"845601871569956864-6670241490442171","lat":21.7866,"lng":82.7948,"type":"tweet"},{"index":"846039896619794432-6670241490546604","lat":53.3831,"lng":-1.4645,"type":"tweet"},{"index":"75-8581476610317","lat":42.899873457036,"lng":71.368666356403,"type":"tweet"},{"index":"882-8581476681829","lat":40.383366391523,"lng":49.877679830332,"type":"tweet"},{"index":"3246-8581491371651","lat":57.968578929141,"lng":56.261052782818,"type":"tweet"},{"index":"3294-8581491835470","lat":59.935265759528,"lng":30.302898021657,"type":"tweet"},{"index":"207-8581491895202","lat":42.987244126932,"lng":47.501172772595,"type":"tweet"},{"index":"4071-8581491906420","lat":41.61892131697,"lng":45.921702056815,"type":"tweet"},{"index":"3261-8581492071687","lat":57.993157725304,"lng":56.215862033047,"type":"tweet"},{"index":"2703-8581492074469","lat":42.255002495439,"lng":18.896117826367,"type":"tweet"},{"index":"3120-8581492074517","lat":51.233298476112,"lng":51.366706879856,"type":"tweet"},{"index":"6282-8581494412305","lat":40.185758428615,"lng":44.524261936792,"type":"tweet"},{"index":"9087-8581494875885","lat":51.207311266817,"lng":3.2269694621865,"type":"tweet"},{"index":"699-8581494925982","lat":49.995983881118,"lng":36.237038095552,"type":"tweet"},{"index":"4056-8581494934818","lat":50.960838938352,"lng":6.0424858922948,"type":"tweet"}]'
         $scope.locations = JSON.parse(tempData); //locations
      console.log($scope.locations);
    };

//getLocations1();
}]);
var layers = new Array();
window.global_layers_pointer = layers;


app.directive('leafletmap', function ($http, $log) {
    return {
        restrict: 'A',
        scope: {
            geoboxes: '=ngModel', // Bind geoboxes to ng-model
            yakmarkers: '=ngModelYaks', //Bind yikyak markers to ng-model-yaks for use in other files
            points: '=points',
            editable: '@editable',
            clusters: '@clusters'
        },
        link: function (scope, elem, attrs) {

            console.log("shobhit");
            // We need to give the map element an id or it
            if (attrs.id === undefined) {
                attrs.id = ('map' + scope.geoboxes)
            }

            // Set the height of the map
            var height = $(document).height() - (250 + $('.navbar-fixed-top').outerHeight(true) + $('.navbar-fixed-bottom').outerHeight(true));
            height = height < 350 ? 350 : height; // Height at least 350px
            height=650;
            elem.height(height);

            // Create the map
            var map = L.map(attrs.id).setView([0.0, 0.0], 2);

            //Create map pointer
            window.global_map_pointer = map;

            // add local tiles
            var tiles = new L.tileLayer('/static/maptiles/{z}/{x}/{y}.png', {
                minZoom:1,
                maxZoom:4
            }).addTo(map);

            // Add the bing tile layers
            // map.addLayer(new L.BingLayer('AuLwvXawanhcxA4FYbxOzq4ejciLipLnjU5trQ9jE0oufGhGTyUe5r7wJGEuAWlj', {
            //     maxZoom: 18,
            //     type: 'Road'
            // }));

            var markerLayer = new L.MarkerClusterGroup();
            map.addLayer(markerLayer);
            layers["tweet_markers"] = markerLayer;

            // Clears the markers and adds new ones from scope.points
            var updateMarkers = function () {
                markerLayer.clearLayers();
                _.forEach(scope.points, function(point) {
                    var marker = new L.Marker(new L.LatLng(point.lat, point.lng));
                    var popup = new L.Popup()
                        .setLatLng(new L.LatLng(point.lat, point.lng))
                        .setContent(JSON.stringify({ "type": point.type, "index": point.index}));
                    marker.bindPopup(popup);
                    markerLayer.addLayer(marker);
                });
            };

            // We only mess around with the points if scope.clusters is true
            if (scope.clusters === "true") {
                scope.$watchCollection('points', function (oldVal, newVal) {
                    if (newVal) {
                        updateMarkers();
                    }
                });

                map.on('popupopen', function(e) {
                    var content = JSON.parse(e.popup.getContent());
                    var index = content.index;
                    var type = content.type;
                    // You can use the if statements below to add images and videos
                    if (type === "tweet") {
                        var tweetPromise = $http.get("/api/tweet/" + index);
                        tweetPromise.success(function(data, status, headers, config) {
                            // Change this code to display images and videos
                            $log.info(data);
                            if('tweet' in data){
                                data = data['tweet'];
                                var date = new Date(data['created_at']),
                                    HTML =  '<p class="map-popup-date">' + date.toGMTString() + "</p>" +
                                            '<span class="map-popup-screenname">@' + data['user']['screen_name'] + ': </span>' +
                                            '<span class="map-popup-text">' + data['text'] + '</span>';
                                //add the username, date, and text.
                                e.popup.setContent(HTML);
                            }
                            else{
                                e.popup.setContent('<p>Failed to load popup tweet.</p>');
                            }
                        });
                        tweetPromise.error(function(data, status, headers, config) {
                            $log.error("Failed to load popup tweet");
                        });
                    } else if (type === "image") {
                        var imagePromise = $http.get("/api/image/" + index);
                        imagePromise.success(function(data, status, headers, config) {
                            $log.info(data);
                            if('image' in data){
                                data = data['image'];
                                var date = new Date(data['created_at']),
                                    HTML = populateModal('image', data);
                                e.popup.setContent(HTML);
                            }
                            else{
                                e.popup.setContent('<p>Failed to load popup image.</p>');
                            }
                        });
                        imagePromise.error(function(data, status, headers, config) {
                            $log.error("Failed to load popup image");
                        });
                    } else  if (type === "video") {
                        var videoPromise = $http.get("/api/video/" + index);
                        videoPromise.success(function(data, status, headers, config) {
                            $log.info(data);
                            if('video' in data){
                                data = data['video'];
                                var date = new Date(data['created_at']),
                                    HTML = populateModal('video', data);
                                e.popup.setContent(HTML);
                            }
                            else{
                                e.popup.setContent('<p>Failed to load popup video.</p>');
                            }
                        });
                        videoPromise.error(function(data, status, headers, config) {
                            $log.error("Failed to load popup video");
                        });                            }
                    // Change this API call to /api/image/ for images and /api/video/ for videos

                });
            }

            // Create a geobox layer accessible to the outside
            var geoboxLayer = new L.FeatureGroup();
            map.addLayer(geoboxLayer);
            layers["tweet_geobox"] = geoboxLayer;

            // create yikyaklayer which stores yaks
            var yakLayer = new L.FeatureGroup();
            map.addLayer(yakLayer);
            layers["yak_markers"] = yakLayer;


            // Only if we set it to be editable will there be editing controls
            if (scope.editable === 'true') {

                // Set the draw controls to allow boxes and markers
                var options = new L.Control.Draw({
                    draw: {
                        polyline: false,
                        polygon: false,
                        circle: false,
                        marker: true
                    },
                    edit: {  //allows editting of both geoboxes and yikyak pins
                        featureGroup: geoboxLayer,
                        featureGroup: yakLayer
                    }
                });

                map.addControl(options);

                map.on('draw:created', function (e) {
                console.log("drawstart")
                    //checks if markers are being added
                    if (e.layerType === 'marker') {

                          if(scope.yakmarkers === undefined){
                            scope.yakmarkers = [];
                          }

                          //adds new marker to layer
                          scope.yakmarkers.push({
                          yaklat: e.layer._latlng.lat,
                          yaklong: e.layer._latlng.lng
                          });

                    }
                    else
                    {

                    var bounds = e.layer.getBounds();
                    scope.geoboxes.push({
                        nwLat: bounds.getNorthWest().lat,
                        nwLng: bounds.getNorthWest().lng,
                        neLat: bounds.getNorthEast().lat,
                        neLng: bounds.getNorthEast().lng,
                        seLat: bounds.getSouthEast().lat,
                        seLng: bounds.getSouthEast().lng,
                        swLat: bounds.getSouthWest().lat,
                        swLng: bounds.getSouthWest().lng
                    });

					}
                    updateLayer();

                });

                map.on('draw:edited', function () {
                    //updates scope variables for yikyak markers and geoboxes
                    updateGeoboxes();
                    updateyaks();
                });

                map.on('draw:deleted', function () {
                    //updates scope variables
                    updateGeoboxes();
                    updateyaks();
                });
            }

            // When this function is called, clear all layers and add them from
            // the current scope
            var updateLayer = function () {
                geoboxLayer.clearLayers();
                _.forEach(scope.geoboxes, function (geobox) {
                    geoboxLayer.addLayer(
                        L.rectangle(
                            [
                                [geobox.swLat, geobox.swLng],
                                [geobox.neLat, geobox.neLng]
                            ]
                        )
                    );
                });


                yakLayer.clearLayers();
                _.forEach(scope.yakmarkers, function (yak) {
                    var marker = new L.Marker(new L.LatLng(yak.yaklat, yak.yaklong),{icon: yikyakIcon});

                    var popup = new L.Popup()
                        .setLatLng(new L.LatLng(yak.yaklat, yak.yaklong))
                        .setContent(JSON.stringify({ "type": "yikyak"}));
                    marker.bindPopup(popup);
                    yakLayer.addLayer(marker);

                    // TODO: HACKY BUT WE COULD WRITE TO THE DATABASE SEPARATELY AND STORE YIKYAKS THAT WAY

                });
            };

            // This function is called when the scope needs to be updated
            var updateGeoboxes = function () {
                scope.geoboxes.length = 0; // This clears the array in place
                _.forEach(geoboxLayer.getLayers(), function (layer) {
                    var bounds = layer.getBounds();
                    scope.geoboxes.push({
                        nwLat: bounds.getNorthWest().lat,
                        nwLng: bounds.getNorthWest().lng,
                        neLat: bounds.getNorthEast().lat,
                        neLng: bounds.getNorthEast().lng,
                        seLat: bounds.getSouthEast().lat,
                        seLng: bounds.getSouthEast().lng,
                        swLat: bounds.getSouthWest().lat,
                        swLng: bounds.getSouthWest().lng
                    });
                });
            };

            var updateyaks = function () {
                // This function is called when the scope needs to be updated
                //updates layers based on created pins
                scope.yakmarkers.length = 0; // This clears the array in place
                _.forEach(yakLayer.getLayers(), function (layer) {
                    scope.yakmarkers.push({

                          yaklat: layer._latlng.lat,
                          yaklong: layer._latlng.lng

                    });
                });
            };


            // Whenever geoboxes is modified, change the map to reflect it
            scope.$watchCollection('geoboxes', function (oldVal, newVal) {
                updateLayer();
            });

            scope.$watchCollection('yakmarkers', function (oldVal, newVal) {
                updateLayer();
            });
        }
    }
});
