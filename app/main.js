$(document).ready(function() {
    //Include header file
    // $("#header").load("html/header.html");

    //Include footer file
    $("#footer").load("html/footer.html");

    // Include the trips file
    $("#trips").load("html/trips.html");
    
    var timer;

    // Counter for user visits from same Browser
    var visits_counter = parseInt(localStorage.getItem("counter"));
    if(visits_counter > 0) {
        var s = "<p>Welcome back!</br>";
        s += "You have visited this page ";
        s += visits_counter;
        s += " times </p>";
        console.log(s);
        $("#visits_counter").append(s);

        localStorage.setItem("counter", visits_counter+1);
    } else {
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

    // GET request to /station/source/STN_ABBR/dest/STN_ABBR API to fetch TRIP data
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


    // Invoke stations data on page load
    stationsData()
        .then((response)=> {
            stationsDisplay(response.stations.station);
            departureStationDisplay(response.stations.station);
            arrivalStationDisplay(response.stations.station, "", true);
        })
        .catch((error)=> {
            console.log(error)
        })

    // --------------------------------------------------------------------------------------------

    // Display Stations Data in table 
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
        var departureStation = $(this).val(); 
        clearInterval(timer);
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
    $(document).on('change', '#arrivalDD', function () {  
        var arrivalStation = $(this).val();
        var departureStation = $("#departureDD").val();
        clearInterval(timer);
        firstDepartureTime = 0;
        $("#countdownTimer").html("");

        console.log(arrivalStation);
        console.log(departureStation);

        tripData(departureStation, arrivalStation)
        .then((response)=> {
            console.log(response.schedule.request.trip);
            tripDetailsDisplay(response.schedule.request.trip);
        })
        .catch((error)=> {
            console.log(error);
        })
    });

    var firstDepartureTime = 0;
    function tripDetailsDisplay(response) {
        console.log(response);
        var currentTime = new Date();

        // Get headers from first row to get the column names and append
        var thHTML = '<tr class = "text-uppercase">';
        thHTML +=       '<th>Departure Time</th>';
        thHTML +=       '<th>Arrival Time</th>';
        thHTML +=       '<th>Route No.</th>';
        thHTML +=       '<th>Fare / Clipper</th>';
        thHTML +=    '</tr>';
        $('#tHead_trip_details').html(thHTML);

        // Get data for all other rows and append 
        var trHTML = '';
        
        $.each(response, function (i, stationsData) {

            var endTime = new Date(response[i]['@attributes']['origTimeDate'] + " " + response[i]['@attributes']['origTimeMin']);
            var timeDiff = endTime.getTime() - currentTime.getTime();
            var fare = "$" +  response[i]['@attributes']['fare'];
            var clipper = "$" + response[i]['@attributes']['clipper'];

            if (timeDiff > 0) {
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
                trHTML += '</tr>'

                firstDepartureTime = (firstDepartureTime == 0) ? endTime : firstDepartureTime;
            }
        });
        $('#tBody_trip_details').html(trHTML);

        // Set the count down:
        console.log("First time = " + firstDepartureTime);
        // getCountDownDisplay(firstTime);
        clearInterval(timer);
        timer = setInterval(function() { makeTimer(); }, 1000);
    }
    
    function makeTimer() {

        // Get today's date and time
        var now = new Date().getTime();
    
        // Find the distance between now and the count down date
        if (firstDepartureTime > 0) {
            var distance = firstDepartureTime.getTime() - now;
            var seconds = Math.floor(distance/1000);
        
            // Display the result in the element with id="demo"
            $("#countdownTimer").html(seconds + ' seconds');
            console.log(distance);
        }
    };



    // Functions for Station
    // Change table data on selecting departure station 
    // $(document).on('change', '#departureDD', function () {  
    //     var departureStation = $(this).val();  
    //     alert (departureStation);  
    //     stationsData()
    //     .then((response)=> {
    //         console.log("=>"+response.stations.station[0].abbr);
    //         resp = response.stations.station;
    //         //$.each(resp, function (i, departureStationsData) {


    //         // for (var i = 0; i < resp.length; i++) {  
    //         //     if(resp[i].abbr == departureStation) {
    //         //         stationsDisplay(resp[i]);
    //         //     }
    //         // }
    //     })
    //     .catch((error)=> {
    //         console.log(error)
    //     })
    // });



    // Retrieve Stations Data 

    // Calling of all functions 


    // departureStationData()
    //     .then((response)=> {
    //         console.log(response.stations.station);
    //         departureStationDisplay(response.stations.station);
    //     })
    //     .catch((error)=> {
    //         console.log(error)
    //     })
    
    // arrivalStationData()
    //     .then((response)=> {
    //         console.log(response.stations.station);
    //         arrivalStationDisplay(response.stations.station);
    //     })
    //     .catch((error)=> {
    //         console.log(error)
    //     })
    

    // $.fn.index = function(){ 
    //     alert('You have successfully defined the function!'); 
    // }

    // var sourceStation = 'balb';
    // $.ajax({
    //     url: '/bartdir/app/station/source/' + sourceStation,
    //     type: 'get',
    //     dataType: 'JSON',
    //     success: function(response){
    //         console.log(response);
    //     }
    // });

    // var sourceStation = 'balb';
    // var destStation = 'lake';
    // $.ajax({
    //     url: '/bartdir/app/trips/source/' + sourceStation + '/dest/' + destStation,
    //     type: 'get',
    //     dataType: 'JSON',
    //     success: function(response){
    //         console.log(response);
    //     }
    // });


})