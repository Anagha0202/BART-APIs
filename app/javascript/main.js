$(document).ready(function() {

    //Include footer file
    $("#footer").load("html/footer.html");

    // Include the trips file
    $("#trips").load("html/trips.html");
    
    var timer;
    var timeTillNextTrain = 0;
    var trainTripDetails;
    var g_arrivalStation;
    var g_departureStation;
    var stationLookupMap = new Map();

    // Counter for user visits from same Browser
    var visits_counter = parseInt(localStorage.getItem("counter"));
    if(visits_counter > 0) {
        var s = "<p>Welcome back!</br>";
        s +=        "You have visited this page " + visits_counter + " times </p>";
        console.log(s);
        $("#visits_counter").html(s);

        localStorage.setItem("counter", visits_counter+1);
    } else {
        var s = "<p>Welcome!</br>";
        s +=       "This is your 1st visit";
        s +=    " </p>";
        console.log(s);
        $("#visits_counter").html(s);
        localStorage.setItem("counter", 1);
    }
    

    // Display the correct page based on sub navigation 
    function show(shown, hidden1) {
        document.getElementById(shown).style.display='block';
        document.getElementById(hidden1).style.display='none';
        return true;
    }

    // Activate the correct sub navigation page
    function removeActive(option1, option2) {
        $('#nav-'+option1).removeClass('active');
        $('#nav-'+option2).removeClass('active');
    }

    $('.navigation_options a').click(function(id) {
        var shownId = $(this).attr('id');
        $(this).addClass("active");
        if (shownId=="nav-stations") {
            show("stations", "trips");
            removeActive( "station", "trips");
            $("#station_aside_contents").css("display", "none");
        } else if (shownId=="nav-trips") {
            show("trips", "stations")
            removeActive( "stations", "station");
            $("#station_aside_contents").css("display", "block");
        }
    });

    // -------------------------------------------------------------------------------------------------
    // GET request to /stations API to fetch STATION data
    function stationsData() {
        return new Promise((resolve , reject ) => {
            $.ajax({
                url: '/bartdir/app/stations',
                type: 'get',
                dataType: 'JSON',
                success: function(response){
                    resolve(response);
                },
                error: function(error) {
                    reject(error);
                    alert("Error in stations"+error);
                },
            })
        })
    };

    // GET request to /station/source/STN_ABBR API to fetch STATION data
    function stationData(sourceStation) {
        return new Promise((resolve , reject ) => {
            $.ajax({
                url: '/bartdir/app/station/source/' + sourceStation,
                type: 'get',
                dataType: 'JSON',
                success: function(response){
                    resolve(response);
                },
                error: function(error) {
                    reject(error);
                    alert("Error in stations"+error);
                },
            })
        })
    };

    // GET request to /trips/source/STN_ABBR/dest/STN_ABBR API to fetch TRIP data
    function tripData(sourceStation, destStation) {
        return new Promise((resolve , reject ) => {
            $.ajax({
                url: '/bartdir/app/trips/source/' + sourceStation + '/dest/' + destStation,
                type: 'get',
                dataType: 'JSON',
                success: function(response){
                    resolve(response);
                },
                error: function(error) {
                    reject(error);
                    alert("Error in stations"+error);
                },
            })
        })
    };
    // --------------------------------------------------------------------------------------------

    // --------------------------------------------------------------------------------------------
    // By default load the STATIONS data
    stationsData()
        .then((response)=> {
            stationsDisplay(response.stations.station);
            departureStationDisplay(response.stations.station);
            arrivalStationDisplay(response.stations.station, "", true);
            createAStationsIndex(response.stations.station);
        })
        .catch((error)=> {
            console.log(error)
        })

    // Display STATIONS Data in table 
    function stationsDisplay(response) {

        // Get headers from first row to get the column names and append
        var thHTML = '<tr class = "text-uppercase">';
        $.each(response[0], function(key, value) {
            if (key != "gtfs_latitude" && key != "gtfs_longitude") {
                thHTML += '<th>' + key + '</th>';
            }
        });
        thHTML += '</tr>';
        $('#tHead').append(thHTML);

        // Get data for all other rows and append 
        var trHTML = '';
        $.each(response, function (i, stationsData) {
            
            trHTML += '<tr>'
            $.each(stationsData, function(key, value) {
                if (key != "gtfs_latitude" && key != "gtfs_longitude") {
                    trHTML += '<td>' + value + '</td>';
                }
            })
            trHTML += '</tr>'
            
        });
        $('#tBody').append(trHTML);
    }
    // --------------------------------------------------------------------------------------------

    // --------------------------------------------------------------------------------------------
    // Populate dropdowns of TRIPs page with data from /stations
    function departureStationDisplay(response) {
        var s = '<option value="-1"> Select a Station</option>';  
        for (var i = 0; i < response.length; i++) {  
            s += '<option class="dropdown-item" value="' + response[i].abbr + '">' + response[i].name + '</option>';  
        }  
        $("#departureDD").html(s);
    }

    function arrivalStationDisplay(response, arrivalStation, enable) {
        var s = '<option value="-1"> Select a Station</option>';
          
        $("#arrivalDD").prop("disabled", enable);
        for (var i = 0; i < response.length; i++) {  
            if(arrivalStation == response[i].abbr){
                s += '<option class="dropdown-item" value="' + response[i].abbr + '" disabled>' + response[i].name + '</option>'; 
            } else {
                s += '<option class="dropdown-item" value="' + response[i].abbr + '">' + response[i].name + '</option>'; 
            }
        }  
        $("#arrivalDD").html(s);
    }
    

    // On selecting a source STN_ABBR departure station:
    // 1. Enable arrival station dropdown & Populate arrival stations by disabling the source station
    // 2. Invoke /station API to get station data
    $(document).on('change', '#departureDD', function () {  

        // Set global variables
        g_arrivalStation = "";
        g_departureStation = "";

        var departureStation = $(this).val(); 
        
        clearInterval(timer);
        timeTillNextTrain = 0;
        $("#map").html("");
        $("#countdownTimer").html("");
        $('#tHead_trip_details').html("");
        $('#tBody_trip_details').html("");

        // 1. Populate Arrival station dropdown
        stationsData()
        .then((response)=> {
            arrivalStationDisplay(response.stations.station, departureStation, false);
        })
        .catch((error)=> {
            console.log(error);
        })

        // 2. Get each station data
        stationData(departureStation)
        .then((response)=> {
            eachStationDisplay(response.stations.station);
        })
        .catch((error)=> {
            console.log(error);
        })
        
    });
    
    function eachStationDisplay(response) {
        console.log(response);  
        // Row details
        var s = "<article class='row'>";
        
        s +=        "<article class='col-sm-3'>";
        s +=            "<p>Name: </p>";
        s +=            "<p>Abbr: </p>";
        s +=            "<p>Address: </p>";
        s +=        "</article>";
        s +=        "<article class='col-sm-9'>";
        s +=            "<p>" + response.name + "</p>";
        s +=            "<p>" + response.abbr + "</p>";
        s +=            "<p class='text-capitalize'>" 
                             + response.address + " " 
                             + response.city + " " 
                             + response.county + " " 
                             + response.state + " " 
                             + response.zipcode + 
                        "</p>";
        s +=        "</article>"; 
        s +=    "</article>";
        s +=    "<hr text-white>";

        // Row North bound
        s += "<article class='row'>";
        s +=        "<article class='col-sm-5'>";
        s +=            "<p> North Bound: </p>";
        s +=            "<p class='text-sm-right'> Platform: </p>";
        s +=            "<p class='text-sm-right'> Routes: </p>";
        s +=        "</article>";
        s +=        "<article class='col-sm-7'>";
        s +=            "<p> &nbsp </p>";
        s +=            "<p>" + (response.north_platforms.platform ? response.north_platforms.platform : '-')+ "</p>";
        s +=            "<p>" + (response.north_routes.route ? response.north_routes.route : '-') + "</p>";
        s +=        "</article>";
        s +=    "</article>";
        s += "</article>";

        // Row South bound
        s += "<article class='row'>";
        s +=        "<article class='col-sm-5'>";
        s +=            "<p> South Bound: </p>";
        s +=            "<p class='text-sm-right'> Platform: </p>";
        s +=            "<p class='text-sm-right'> Routes: </p>";
        s +=        "</article>";
        s +=        "<article class='col-sm-7'>";
        s +=            "<p> &nbsp </p>";
        s +=            "<p>" + (response.south_platforms.platform ? response.south_platforms.platform : '-') + "</p>";
        s +=            "<p>" + (response.south_routes.route ? response.south_routes.route : '-') + "</p>";
        s +=        "</article>";
        s +=    "</article>";
        s += "</article>";

        $("#station_aside_contents").css("display", "block");
        $("#station_aside_contents").html(s);
    }
    // --------------------------------------------------------------------------------------------

    // --------------------------------------------------------------------------------------------
    // Get departure station and  arrival station
    $(document).on('change', '#arrivalDD', function () {  
        var arrivalStation = $(this).val();
        var departureStation = $("#departureDD").val();

        // Set global variables
        g_arrivalStation = arrivalStation;
        g_departureStation = departureStation;
        
        clearInterval(timer);
        timeTillNextTrain = 0;
        $("#countdownTimer").html("");
        $("#map").html("");

        console.log(arrivalStation);
        console.log(departureStation);

        tripData(departureStation, arrivalStation)
        .then((response)=> {
            trainTripDetails = response.schedule.request.trip;
            tripDetailsDisplay(response.schedule.request.trip, false);
            console.log(trainTripDetails);
        })
        .catch((error)=> {
            console.log(error);
        })
    });

    // Populate trips table    
    function tripDetailsDisplay(response, fromHardRefresh) {
        console.log("inside method:")
        console.log(trainTripDetails);

        // Identify the next train time and start the timer
        if (!fromHardRefresh) {
            setTimeTillNextTrain(response, fromHardRefresh);
        }
        console.log("Time until the next train = " + timeTillNextTrain);

        // Get headers from first row to get the column names and append
        var thHTML = '<tr class = "text-uppercase">';
        thHTML +=       '<th>Departure Time</th>';
        thHTML +=       '<th>Arrival Time</th>';
        thHTML +=       '<th>Route No.</th>';
        thHTML +=       '<th>Fare / Clipper</th>';
        thHTML +=       '<th>Status</th>';
        thHTML +=    '</tr>';
        $('#tHead_trip_details').html(thHTML);

        // Get data for all other rows and append 
        var trHTML = '';
        $.each(response, function (i, stationsData) {

            var fare = "$" +  response[i]['@attributes']['fare'];
            var clipper = "$" + response[i]['@attributes']['clipper'];

            trHTML += '<tr>'
            trHTML += '<td>' + response[i]['@attributes']['origTimeDate'] + '&nbsp' + response[i]['@attributes']['origTimeMin'] + '</td>';
            trHTML += '<td>' + response[i]['@attributes']['destTimeDate'] + '&nbsp' + response[i]['@attributes']['destTimeMin'] + '</td>';
            if(response[i]['leg'].length>1) {
                trHTML += '<td>';
                $.each(response[i]['leg'], function(j, legData) {
                    trHTML += response[i]['leg'][j]['@attributes']['line'] + ',';
                })
                trHTML += '</td>';
            }
            else {
                trHTML += '<td>' + response[i]['leg']['@attributes']['line'] + '</td>';
            }
            trHTML += '<td>' + fare + '/' + clipper + '</td>';

            var endTime = new Date(trainTripDetails[i]['@attributes']['origTimeDate'] + " " + trainTripDetails[i]['@attributes']['origTimeMin']);
            var timeDiff = endTime.getTime() - new Date().getTime();
            if (timeDiff <= 0){
                trHTML += '<td> DEPARTED </td>';
            } else {
                trHTML += '<td> </td>';
            }
            trHTML += '</tr>';
        });
        $('#tBody_trip_details').html(trHTML);

        // Load the map with departureStation + arrivalStation and timeTillNextTrain.
        initMap(g_departureStation, g_arrivalStation);
    }
    
    // ----------------------------------------------------------------------------------------
    // Timer ticking for every 1second
    function makeTimer() {

        // Get today's date and time
        var now = new Date().getTime();
    
        // Find the distance between now and the count down date
        var distance = timeTillNextTrain.getTime() - now;

        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
        $("#countdownTimer").html(hours + ":" + minutes + ":" + seconds);

        // Find the next train where the time difference is positive
        if (distance<=0){
            clearInterval(timer);
            $("#countdownTimer").html("");
            setTimeTillNextTrain();
        }
        
    };

    // Set the `timeTillNextTrain` with the time until the next train departs
    function setTimeTillNextTrain() {
        console.log("Setting next train timer:")
        console.log(trainTripDetails);
        var currentTime = new Date();

        $.each(trainTripDetails, function (i, stationsData) {
            var endTime = new Date(trainTripDetails[i]['@attributes']['origTimeDate'] + " " + trainTripDetails[i]['@attributes']['origTimeMin']);
            var timeDiff = endTime.getTime() - currentTime.getTime();

            if( timeDiff > 0) {
                timeTillNextTrain = endTime;
                return false;
            }
            
        });
        timer = setInterval(function() { makeTimer(); }, 1000);
    }

    // Refresh the trips data every 30seconds
    time1 = setInterval(function(){
        if (g_departureStation && g_arrivalStation) {
            tripData(g_departureStation, g_arrivalStation)
            .then((response)=> {
                trainTripDetails = response.schedule.request.trip;
                tripDetailsDisplay(response.schedule.request.trip, true);
                console.log(trainTripDetails);
            })
            .catch((error)=> {
                console.log(error);
            })
      }
     }, 30000);

    // ----------------------------------------------------------------------------------------

    // Get the latitude and longitude; Display map
    function initMap(departureStationAbbr, arrivalStationAbbr){
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();

        var departureLatLng = stationLookupMap.get(departureStationAbbr);
        var arrivalLatLng = stationLookupMap.get(arrivalStationAbbr);

        const start = new google.maps.LatLng(departureLatLng.lat, departureLatLng.lng);
        const end = new google.maps.LatLng(arrivalLatLng.lat, arrivalLatLng.lng);

        // const uluru = {lat: 37.3706687, lng: -122.002572};
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 7,
            // center: uluru, 
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        directionsDisplay.setMap(map);
        var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.DirectionsTravelMode.TRANSIT,
        transitOptions: {
            // departureTime: new Date(this.date), //the departure time of next train
            departureTime: timeTillNextTrain,
            modes: ['SUBWAY']
        },
        unitSystem: google.maps.UnitSystem.IMPERIAL,

        };

        directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
        });
    }

    // Method that creates a reverse lookup map for stations. Map{ stationAbbr -> { lat: Latitude, lng: Longitude} }
    function createAStationsIndex(stationsData) {
        $.each(stationsData, function (i, data) {
            stationLookupMap.set(data.abbr, {"lat": data.gtfs_latitude, "lng":data.gtfs_longitude})
        });
    }

})