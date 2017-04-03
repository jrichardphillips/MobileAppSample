$(document).ready(function() {
    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", appInit, false);
        document.addEventListener("resume", appInit, false);

        $('#waiting').hide();

    } else {
        appInit();
    }
});

/*
$(document).ready(function() {
    document.addEventListener("deviceready", appInit, false);
	document.addEventListener("resume", appInit, false);

    $('#waiting').hide();
    // appInit();
});
*/
function appInit() {

    var tempXY = [{
        x: .6528,
        y: .3445
    }, {
        x: .6388,
        y: .3565
    }, {
        x: .6251,
        y: .3674
    }, {
        x: .6116,
        y: .3772
    }, {
        x: .5985,
        y: .3858
    }, {
        x: .5857,
        y: .3931
    }, {
        x: .5732,
        y: .3993
    }, {
        x: .5611,
        y: .4043
    }, {
        x: .5493,
        y: .4082
    }, {
        x: .5378,
        y: .4112
    }]

    var deviceIP = localStorage.getItem('deviceIP');
    var bridgeIP = '';
    var macAddress = '';
    var lightData = [];
    var config = {};
    /*  var config = {
    	"system": {
    		"bridgeIP": "",
    		"bridgeMac": "",
    		"macAddress": "",
    		"uniqueID": "scheduler01",
    		"serverAddress": "www.shadelighting.com",
    		"update": 0,
    		"clearRequest": 0,
    		"mode": {
    			"blueFilter": {
    				"active": 0,
    				"startCycle": "Mon Nov 30 2015 8:00:00 GMT-0600 (CST)",
    				"endCycle": "Mon Nov 30 2015 20:00:00 GMT-0600 (CST)",
    				"maxTemp": 6500,
    				"minTemp": 1000,
    				"maxBright": 255,
    				"minBright": 255,
    				"curCycle": 0
    			},
    			"adaptive": {
    				"transition": 650,
    				"timeout": 3600000,
    				"schedulePaused": 0,
    				"monitorPaused": 1,
    				"manualPaused": 1
    			}
    		}
    	},
    	"lightList": ""
    }
    */
    //deviceIP = "192.168.1.101";

    //Use for testing in browser
    // if (deviceIP === null) {
    //      deviceIP = "192.168.1.101";
    //   }

    checkForDevice();

    function checkForDevice() {
        if (deviceIP === null) {
            navigator.notification.prompt(
                'Shade device not found. Please enter IP.', // message
                deviceSetup, // callback to invoke
                'Shade Setup', // title
                ['Exit', 'Retry'], // buttonLabels
                '192.168.1.101' // defaultText
            );

            function deviceSetup(results) {
                if (results.buttonIndex === 2) {
                    localStorage.setItem('deviceIP', results.input1);
                    appInit();
                } else {
                    navigator.app.exitApp();
                }
            }
        } else {
            getConfigData();
        }
    }

    function getConfigData() {

        loadConfig();

        function loadConfig() {
            $.ajax({
                url: 'http://' + deviceIP + ':8082',
                type: 'GET',
                dataType: 'jsonp',
                jsonpCallback: 'json',
                timeout: 3000,
                error: errorBridge,
                success: importParam,
                beforeSend: function() {
                    $('#waiting').show();
                }
            });

            function errorBridge(data) {
                $('#waiting').hide();

                navigator.notification.prompt(
                    'Shade device unavailable. Make sure you are connected to your network and verify the IP below.', // message
                    deviceSetup, // callback to invoke
                    'Unable to Connect', // title
                    ['Exit', 'Retry'], // buttonLabels
                    deviceIP // defaultText
                );

                function deviceSetup(results) {
                    if (results.buttonIndex === 2) {
                        localStorage.setItem('deviceIP', results.input1);
                        appInit();
                    } else {
                        navigator.app.exitApp();
                    }
                }

                return;
            }

            function importParam(data, response) {
                $('#waiting').hide();
                //check if command completed
                if (data.bridgeIP === null) {
                    navigator.notification.prompt(
                        'No hub found. Please enter the IP.', // message
                        hubSetup, // callback to invoke
                        'Hub Setup', // title
                        ['Exit', 'Retry'], // buttonLabels
                        '192.168.1.101' // defaultText
                    );

                    function hubSetup(results) {
                        if (results.buttonIndex === 2) {
                            config.system.bridgeIP = results.input1;
                            postConfig(config.system);
                            if (config.system.mode.blueFilter.active == 1) {
                                $('#suncycle').addClass('ui-btn-active');
                                $('#adaptive').removeClass('ui-btn-active');
                            } else {
                                $('#adaptive').addClass('ui-btn-active');
                                $('#suncycle').removeClass('ui-btn-active');
                            }
                            refreshConfig();
                            appInit();
                            return;
                        } else {
                            navigator.app.exitApp();
                        }
                    }
                } else {

                    config = data;
                    if (config.system.mode.blueFilter.active == 1) {
                        $('#suncycle').addClass('ui-btn-active');
                        $('#adaptive').removeClass('ui-btn-active');
                    } else {
                        $('#adaptive').addClass('ui-btn-active');
                        $('#suncycle').removeClass('ui-btn-active');
                    }
                    //alert(config.system.bridgeIP);
                    refreshConfig();

                    return;
                }
            }
        }
    }

    function refreshConfig() {
        $('#bridgeList').hide();
        $('#lightList').hide();
        $('#tabs').show();

        if ($('#suncycle').hasClass('ui-btn-active')) {
            $("#adaptiveSettings").hide();
            $("#sunSettings").show();
        } else {
            $("#sunSettings").hide();
            $("#adaptiveSettings").show();
        }

        var sunrise = new Date(config.system.mode.blueFilter.startCycle);
        var sunset = new Date(config.system.mode.blueFilter.endCycle);

        if (sunrise.getMinutes() == 30) {
            sunrise = sunrise.getHours() + .5;
        } else {
            sunrise = sunrise.getHours();
        }
        if (sunset.getMinutes() == 30) {
            sunset = sunset.getHours() + .5;
        } else {
            sunset = sunset.getHours();
        }

        $('#pauseSun').val(config.system.mode.blueFilter.active);
        $('#pauseSun').flipswitch('refresh');
        
		$('#sunrise').val(sunrise);
        $('#sunrise').slider('refresh');
        
		$('#sunset').val(sunset);
        $('#sunset').slider('refresh');
        
		$('#dimLow').val(config.system.mode.blueFilter.minBright);
		$('#dimLow').slider('refresh');
        
		$('#dimHigh').val(config.system.mode.blueFilter.maxBright);
        $('#dimHigh').slider('refresh');
        
		$('#tranSpeed').val(config.system.mode.adaptive.transition / 10);
        $('#tranSpeed').slider('refresh');
        
		$('#timeout').val(config.system.mode.adaptive.timeout / 60000);
        $('#timeout').slider('refresh');
        
		$('#pauseSchedule').val(config.system.mode.adaptive.manualPaused);
        $('#pauseMonitor').flipswitch('refresh');

        $('#pauseMonitor').val(config.system.mode.adaptive.monitorPaused);
		$('#pauseSchedule').flipswitch('refresh');

        return;
    }

    function postConfig(updates) {
       // alert(JSON.stringify(updates));
        var data = {};
        if ("mode" in updates) {
            data["type"] = "system";
            data["updates"] = updates
        } else {
            data["type"] = "lightList";
            data["updates"] = updates
        }
        return $.ajax({
            url: 'http://' + deviceIP + ':8082',
            type: 'PUT',
            crossDomain: true,
            data: JSON.stringify(data)
        });
    }

    function lightsUpdated(response) {
        navigator.notification.alert(
            'Your lighting configuration has been updated.', // message
            mainLoad, // callback
            'Updated', // title
            'OK' // buttonName
        );

        function mainLoad() {
            refreshConfig();
        }
    }

    //CONFIGURE THE SENSOR MENU OPTION
    $('#pauseSchedule').on('change', function pauseEvent() {

        var state1 = 1;

        if (document.getElementById("pauseSchedule").value == state1) {

            config.system.mode.adaptive.manualPaused = 1;
            postConfig(config.system);
            refreshConfig();

        } else {
            config.system.mode.blueFilter.active = 0;
            config.system.mode.adaptive.manualPaused = 0;
            postConfig(config.system);
            refreshConfig();

        }
    });

    $('#pauseMonitor').on('change', function pauseEvent() {

        var state1 = 1;

        if (document.getElementById("pauseMonitor").value == state1) {

            config.system.mode.adaptive.monitorPaused = 1;
            postConfig(config.system);
            refreshConfig();

        } else {
            config.system.mode.blueFilter.active = 0;
            config.system.mode.adaptive.monitorPaused = 0;
            postConfig(config.system);
            refreshConfig();

        }
    });

    $('#tranSpeed').on('slidestop', function updateSpeed(event) {
        var speed = $('input[id=tranSpeed]').val() * 10;
        config.system.mode.adaptive.transition = speed;
        postConfig(config.system);
        refreshConfig();
    });

    $('#timeout').on('slidestop', function updateTimeout(event) {
        var speed = $('input[id=timeout]').val() * 60000;
        config.system.mode.adaptive.timeout = speed;
        postConfig(config.system);
        refreshConfig();
    });

    $('#deviceConfig').on('click', function getBridge() {
        $('#tabs').hide();
        $('#bridgeList').show();
        $('#lightList').hide();
        $("#adaptiveSettings").hide();
        $("#sunSettings").hide();

        $.ajax({
            url: 'https://www.meethue.com/api/nupnp',
            type: 'GET',
            dataType: "json",
            timeout: 8000,
            error: getBridgeIP,
            success: getBridgeIP
        });

        function getBridgeIP(data, error) {
            if (data[0] === null) {
                navigator.notification.prompt(
                    'Enter IP manually?', // message
                    onOK, // callback to invoke
                    'No Bridge Found', // title
                    ['Exit', 'OK'], // buttonLabels
                    '192.168.1.101' // defaultText
                );

                function onOK() {
                    if (results.buttonIndex === 2) {
                        config.system.bridgeIP = data[0].internalipaddress;
                        var deviceData = {
                            'localIP': bridgeIP,
                            'macAddress': macAddress
                        };
                        registerDevice();
                        return;

                    } else {
                        navigator.app.exitApp();
                    }
                }
            } else {
                $("#bridgeList").html('<fieldset data-role="controlgroup" id="bridge-group" style="margin:0;" data-corners="false" data-iconpos="right"><ul data-role="listview" style="margin:0; border-left:0; border-right:0;" data-inset="true" data-corners="false"><li data-corners="false" data-role="list-divider"><h3 class="ui-li-heading">Choose your bridge:</h3></li></ul></fieldset>');

                for (var i = 0; i < data.length; i++) {
                    $("#bridge-group").append('<button class="ui-btn" style="background-color:#4bbde8; color:#FFF; margin:0;" data-corners="false" id="bridge' + i + '">' + data[0].internalipaddress + '</button></ul>');
                    $('#bridge' + i).on('click', function submitBridge() {
                        config.system.bridgeIP = data[0].internalipaddress;
                        $('#bridgeList').hide();
                        registerDevice();
                        return;
                    });
                }

                $("#bridge-group").append('<button class="ui-btn" style="background-color:#FF8500; color:#FFF; margin:0;" data-corners="false" id="cnclButton">Cancel</button></ul>');
                $("#bridgeList").trigger('create');
                $('#cnclButton').on('click', cancelBridge);

                function cancelBridge() {
                    $('#bridgeList').hide();
                    refreshConfig();
                }
            }

            /*
                function register(deviceData) {

                    return $.ajax({
                        url: 'http://frogfuse.com/lights/registerToServer.php',
                        type: 'POST',
                        data: JSON.stringify(deviceData),
                        dataType: 'json',
                        beforeSend: function() {
                            $('#waiting').show();
                        }
                    });
                }

                register(deviceData).always(verifyDev);

                function verifyDev(response, error) {
                    $('#waiting').hide();
                    config.system.bridgeIP = bridgeIP;
                    config.system.bridgeMac = macAddress;
                    postConfig(config.system);
                    refreshConfig();
                    registerDevice();
                    return;
                }
				*/
        }

        //Register the sensor's username with the bridge
        function registerDevice() {
            var register = {
                'devicetype': 'ShadeApp#Server'
            };

            function registerBridge(register) {
                return $.ajax({
                    url: 'http://' + config.system.bridgeIP + '/api/',
                    type: 'POST',
                    data: JSON.stringify(register),
                    dataType: 'json',
                    beforeSend: function() {
                        $('#waiting').show();
                    }
                });
            }

            registerBridge(register).always(verifyReg);

            function verifyReg(response, error) {
                $('#waiting').hide();
                //alert("here");

                // var response = JSON.stringify(config.system);
                //	alert(response);
                //check if the link button has been pressed within 30 seconds
                if ("error" in response[0]) {
                    navigator.notification.confirm(
                        'Please press the link button on your bridge.',
                        retryButton,
                        'Link Button', ['Cancel', 'Retry']
                    );

                    function retryButton(retry) {
                        if (retry == 2) {
                            registerDevice();
                        } else {
                            refreshConfig();
                        }
                    }
                }
                //else consider this a success and continue to get light data
                else {
					config.system.uniqueID = response[0].success.username;
                   //for debugging config
                    navigator.notification.alert(
                        'Successfully registered with the bridge.', // message
						dismiss, // callback to invoke
                        'Registered', // title
                        'Continue' // buttonLabels
                    );
                    function dismiss() {
						postConfig(config.system);
						refreshConfig();
                    }
                }
            }
        }
    });

    $('#bulbSelect').on('click', function bulbSetup() {
        $('#tabs').hide();
        $('#lightList').show();
        $('#bridgeList').hide();
        $("#adaptiveSettings").hide();
        $("#sunSettings").hide();

		/*
        var listLight = $.ajax({
            //url: 'http://' + config.system.bridgeIP + '/api/' + config.system.uniqueID + '/lights'
			url: 'http://shadelighting.com/api/sample.json',
			error: function(){
				navigator.notification.alert(
					'Successfully connected to the bridge.', // message
					dismiss, // callback to invoke
                    'Connected', // title
                    'Continue' // buttonLabels
                );
                function dismiss() {
					postConfig(config.system);
					refreshConfig();
                }
			},
			timeout:3000
        });
        $.when(listLight).then(function(listLight) {
            parseLights(listLight); //.always(isRegistered);
            return;
        });
		*/
		function getLightList(){
	        $('#waiting').show();

			return $.ajax({
				//url: 'http://shadelighting.com/api/sample.json',
				url: 'http://' + config.system.bridgeIP + '/api/' + config.system.uniqueID + '/lights',
				type: "GET",
				timeout: 8000,
				success: function(response){
					$('#waiting').hide();
					parseLights(response);
				},
				error: function(x, t, m) {
					$('#waiting').hide();
					
					if(t==="timeout") {
						navigator.notification.alert(
							'The connection to the hub timed out. Check connections and device pairing, then try again. (Error: Timeout)', // message
							dismiss, // callback to invoke
							'Error', // title
							'Continue' // buttonLabels
						);
						function dismiss() {
							refreshConfig();
						}
					} else {
						navigator.notification.alert(
							'An error occured while communicating with the hub. Check connections and device pairing, then try again. (Error: ' + m +')', // message
							dismiss, // callback to invoke
							'Error', // title
							'Continue' // buttonLabels
						);
						function dismiss() {
							refreshConfig();
						}
					}
				}
			});
		}
		
		getLightList().always(verifyReg);

            function verifyReg(response, error) {
                $('#waiting').hide();
                //alert("here");

                // var response = JSON.stringify(config.system);
                //	alert(response);
                //check if the link button has been pressed within 30 seconds
                if ("error" in response[0]) {
                    navigator.notification.confirm(
                        'Please press the link button on your bridge.',
                        retryButton,
                        'Link Button', ['Cancel', 'Retry']
                    );

                    function retryButton(retry) {
                        if (retry == 2) {
                            registerDevice();
                        } else {
                            refreshConfig();
                        }
                    }
                }
                //else consider this a success and continue to get light data
                else {
					config.system.uniqueID = response[0].success.username;
                   //for debugging config
                    navigator.notification.alert(
                        'Successfully registered with the bridge.', // message
						dismiss, // callback to invoke
                        'Registered', // title
                        'Continue' // buttonLabels
                    );
                    function dismiss() {
						postConfig(config.system);
						refreshConfig();
                    }
                }
			}
		
    });

    //.always(isRegistered);

    function isRegistered(response, error) {
        if (response.error.type == 101) {
            //check if the link button has been pressed within 30 seconds
            registerDevice();
        } else {
            //navigator.app.exitApp();
            // alert(JSON.stringify(response));
            parseLights(response);
        }
        return;
    }

    function parseLights(data) {
        //passes to global variable
		
        lightData = data;
        //get number of items in the element
        var items = countProperties(lightData);
		//alert(items)
        listLights(items);
        return 0;
    }

    //find how many lights there are and return that number	
    function countProperties(obj) {
        var count = 0;
        //counts how many total lights exist on this bridge
        for (var prop in obj) {
            if (lightData.hasOwnProperty(prop)) {
                ++count;
            }
        }
        return count;
    }

    //create HTML output in list format of the lights that are attached. Breathe on select.
    function listLights(items) {
        // alert(JSON.stringify(lightData));
        config.lightList = [];
        var name = "light";
        var id = "light-";

        $("#lightList").html('<fieldset data-role="controlgroup" id="cb-group" style="margin:0;" data-corners="false" data-iconpos="right"><ul data-role="listview" style="margin:0; border-left:0; border-right:0;" data-inset="true" data-corners="false"><li data-corners="false" data-role="list-divider"><h3 class="ui-li-heading">Choose the lights to control:</h3><p class="ui-li-desc wrap">Selected lights will have their current settings stored as the new default. Please set your bulbs to your preferred default color and brightness before continuing.</p></li></ul></fieldset>');

        for (var i = 1; i <= items; i++) {
            $("#cb-group").append('<label for="light-' + i + '">' + lightData[i]["name"] + '</label><input data-iconpos="right" type="checkbox" name="light" id="light-' + i + '">');
        }

        $("#cb-group").append('<button class="ui-btn" style="background-color:#4bbde8; color:#FFF; margin:0;" data-corners="false" id="lightButton">Confirm Selection</button></ul>');
        $("#cb-group").append('<button class="ui-btn" style="background-color:#FF8500; color:#FFF; margin:0;" data-corners="false" id="cancelButton">Cancel</button></ul>');

        $("#lightList").trigger('create');
        $('#lightButton').on('click', submitLights);
        $('#cancelButton').on('click', cancelLights);

        var lightSelect = document.getElementsByName("light")

        for (var z = 0; z <= lightSelect.length; z++) {

            lightSelect[z].originalIndex = z + 1;
            lightSelect[z].onclick = function(e) {
                var a = this.originalIndex;
                $.ajax({
                    url: 'http://' + config.system.bridgeIP + '/api/' + config.system.uniqueID + '/lights/' + a + '/state',
                    type: 'PUT',
                    data: JSON.stringify({
                        "alert": "select"
                    }),
                    dataType: 'json',
                });
            };
        }

        function cancelLights() {
            $('#lightList').hide();
            refreshConfig();
        }

        function submitLights() {
            $('#lightList').hide();
            $('#waiting').show();
            config.lightList = [];
            var checkboxes = $('input[name=light]:checked');
            var x = 0;
            $(checkboxes).each(function() {
                if ($(this).is(':checked')) {
                    var lightID = $(this).attr('id');
                    lightID = lightID.substring(6);
                    var url = 'http://' + config.system.bridgeIP + '/api/' + config.system.uniqueID + '/lights/' + lightID;
                    var lightsSelect = $.ajax({
                        url: url
                    });

                    $.when(lightsSelect).done(function(lightData) {
                        var item = {};
                        if (lightData.state.colormode == "ct") {
                            item = {
                                "lightNumber": lightID,
                                "timeout": 0,
                                "colormode": lightData.state.colormode,
                                "bri": lightData.state.bri,
                                "ct": lightData.state.ct,
                                "modelID": lightData.modelid,
                                "type": lightData.type,
                                "name": lightData.name
                            };
                        } else if (lightData.state.colormode == "hs") {
                            item = {
                                "lightNumber": lightID,
                                "timeout": 0,
                                "colormode": lightData.state.colormode,
                                "bri": lightData.state.bri,
                                "hue": lightData.state.hue,
                                "sat": lightData.state.sat,
                                "modelID": lightData.modelid,
                                "type": lightData.type,
                                "name": lightData.name
                            };
                        } else if (lightData.state.colormode == "xy") {
                            item = {
                                "lightNumber": lightID,
                                "timeout": 0,
                                "colormode": lightData.state.colormode,
                                "bri": lightData.state.bri,
                                "xcoord": lightData.state.xy[0],
                                "ycoord": lightData.state.xy[1],
                                "modelID": lightData.modelid,
                                "type": lightData.type,
                                "name": lightData.name
                            };
                        } else if (lightData.state.colormode === undefined){
							item = {
								"lightNumber": lightID,
                                "timeout": 0,
								"bri": lightData.state.bri,
                                "modelID": lightData.modelid,
                                "type": lightData.type,
                                "name": lightData.name
							}
						}
                        config.lightList.push(item);
                        x++;
                        if (x == (checkboxes.length)) {
                            setTimeout(function() {
                                $('#waiting').hide();
                                postConfig(config.lightList).done(lightsUpdated);
                            }, 1000);
                        }
                    });
                }
            });

        }
    }

    //CHECK FOR UPDATES

    $('#checkUpdate').on('click', function() {
        $("#adaptiveSettings").hide();
        $("#sunSettings").hide();

        verifyUpdate();
    });

    function verifyUpdate() {
        navigator.notification.confirm(
            'This will check for server software updates. Updates may be required for all available features to function properly.', // message
            updateConfirm,
            'Confirm', ['Cancel', 'OK']
        );
        
		function updateConfirm(confirm) {
            if (confirm == 2) {
			    $.ajax({
					url: 'http://' + config.system.serverAddress + '/api/version.json',
					type: 'GET',
					dataType: "json",
					timeout: 8000,
					error: errorServer,
					success: successServer,
				});
			}else{
				dismissAlert()
			}
			
			function errorServer(data){
				navigator.notification.alert(
                    'Unable to connect to shadelighting.com. Please check connection and try again.', // message
                    dismissAlert, //callback
                    'Connection Error', // title
                    'OK' // buttonLabels
                );
			}
			
			function successServer(data){
				if(config.version != data.version){
					navigator.notification.alert(
                        'There is a server update available. Please download from shadelighting.com/download.html and install on your server.', // message
                        dismissAlert, //callback
                        'Update', // title
                        'OK' // buttonLabels
                    );
				} else{
					navigator.notification.alert(
                        'Your server software is up-to-date.', // message
                        dismissAlert, //callback
                        'No Update', // title
                        'OK' // buttonLabels
                    );
				}
		
			}
		}
					
		function dismissAlert() {
			refreshConfig();
		}
    }
	
	//CLEAR ALL SCHEDULED DATA MENU OPTION

    $('#clearData').on('click', function() {
        $("#adaptiveSettings").hide();
        $("#sunSettings").hide();

        verifyClear();
    });

    function verifyClear() {
        navigator.notification.confirm(
            'This will clear all currently scheduled light preferences. Continue?', // message
            clearConfirm,
            'Confirm Action', ['Cancel', 'OK']
        );

        function clearConfirm(confirm) {
            if (confirm == 2) {
                config.system.clearRequest = 1;
                postConfig(config.system).done(function(data, status, xhr) {
                    if (status == 'success') {
                        navigator.notification.alert(
                            'Scheduling data has been erased.', // message
                            dismiss, // callback to invoke
                            'Success!', // title
                            'OK' // buttonLabels
                        );
                    } else {
                        navigator.notification.alert(
                            'Verify your connection to the device and try again.', // message
                            dismiss, // callback to invoke
                            'Failed!', // title
                            'OK' // buttonLabels
                        );
                    }
                });
            } else {
                refreshConfig();
            }

            function dismiss() {
                refreshConfig();
            }

        }
    }


    //SUN CYCLE SETTINGS FUNCTIONS


    $('#suncycle').on('click', function configureSun() {
        $('#suncycle').addClass('ui-btn-active');
        $('#adaptive').removeClass('ui-btn-active');

        refreshConfig();
    });

    $('#adaptive').on('click', function configureAdaptive() {
        $('#adaptive').addClass('ui-btn-active');
        $('#suncycle').removeClass('ui-btn-active');

        refreshConfig();
    });

    $('#pauseSun').on('change', function pauseEvent() {

        var state1 = 1;

        if (document.getElementById("pauseSun").value == state1) {
            config.system.mode.adaptive.monitorPaused = 1;
            config.system.mode.adaptive.manualPaused = 1;
            config.system.mode.blueFilter.active = 1;
            postConfig(config.system);
            refreshConfig();
        } else {
            config.system.mode.blueFilter.active = 0;
            postConfig(config.system);
            refreshConfig();
        }
    });


    $('#sunrise').on('slidestop', function updateSunrise(event) {
        var value = $('input[id=sunrise]').val();
        if (value % 1 === 0) {
            var sunrise = new Date(1970, 0, 1, value, 0, 0, 0);
        } else {
            var sunrise = new Date(1970, 0, 1, value, 30, 0, 0);
        }
        config.system.mode.blueFilter.startCycle = sunrise.toString();
        postConfig(config.system);
        refreshConfig();
    });

    $('#sunset').on('slidestop', function updateSunset(event) {
        var value = $('input[id=sunset]').val();
        if (value % 1 === 0) {
            var sunset = new Date(1970, 0, 1, value, 0, 0, 0);
        } else {
            var sunset = new Date(1970, 0, 1, value, 30, 0, 0);
        }
        config.system.mode.blueFilter.endCycle = sunset.toString();
        postConfig(config.system);
        refreshConfig();
    });

    $('#dimLow').on('slidestop', function updateDimLow(event) {
        config.system.mode.blueFilter.minBright = parseInt($('input[id=dimLow]').val());
        postConfig(config.system);
        refreshConfig();
    });

    $('#dimHigh').on('slidestop', function updateDimHigh(event) {
        config.system.mode.blueFilter.maxBright = parseInt($('input[id=dimHigh]').val());
        postConfig(config.system);
        refreshConfig();
    });

    $("#minTemp").on('slidestop', function() {
        var CT = document.getElementById("minTemp").value
        if (CT >= 2000) {
            var mireds = Math.round(1000000 / CT)
            var updates = {
                "ct": mireds,
                "transitiontime": 0
            }
        } else {
            CT = CT - 1000
            if (CT <= 0) {
                var updates = {
                    "xy": [tempXY[0].x, tempXY[0].y],
                    "transitiontime": 0
                }
            } else {
                CT = CT / 100
                var updates = {
                    "xy": [tempXY[CT].x, tempXY[CT].y],
                    "transitiontime": 0
                }
            }
        }
        for (var x = 0; x < config.lightList.length; x++) {
            $.ajax({
                url: 'http://' + config.system.bridgeIP + '/api/' + config.system.uniqueID + '/lights/' + config.lightList[x].lightNumber + '/state',
                type: 'PUT',
                data: JSON.stringify(updates),
                dataType: 'json',
            });
        }
    });

    $("#maxTemp").on('slidestop', function() {
        var CT = document.getElementById("maxTemp").value
        if (CT >= 2000) {
            var mireds = Math.round(1000000 / CT)
            var updates = {
                "ct": mireds,
                "transitiontime": 0
            }
        } else {
            CT = CT - 1000
            if (CT <= 0) {
                var updates = {
                    "xy": [tempXY[0].x, tempXY[0].y],
                    "transitiontime": 0
                }
            } else {
                CT = CT / 100
                var updates = {
                    "xy": [tempXY[CT].x, tempXY[CT].y],
                    "transitiontime": 0
                }
            }
        }
        for (var x = 0; x < config.lightList.length; x++) {
            $.ajax({
                url: 'http://' + config.system.bridgeIP + '/api/' + config.system.uniqueID + '/lights/' + config.lightList[x].lightNumber + '/state',
                type: 'PUT',
                data: JSON.stringify(updates),
                dataType: 'json',
            });
        }
    });
    $('#minTemp').on('slidestop', function updateMin(event) {
        config.system.mode.blueFilter.minTemp = parseInt($('input[id=minTemp]').val());
        postConfig(config.system);
        refreshConfig();
    });

    $('#maxTemp').on('slidestop', function updateMax(event) {
        config.system.mode.blueFilter.maxTemp = parseInt($('input[id=maxTemp]').val());
        postConfig(config.system);
        refreshConfig();
    });

    $('#timeoutInfo').on('click', function timeoutInfo() {
        navigator.notification.alert(
            'This affects how long scheduling will pause when a manual lighting change occurs. Setting to 0 will pause scheduling until the default light color is detected.', // message
            refreshConfig, // callback
            'Timeout Period', // title
            'OK' // buttonName
        );
    });

    $('#lightListInfo').on('click', function lightListInfo() {
        navigator.notification.alert(
            'Selected lights will have their current settings stored as the new default. Please set your bulbs to your preferred default color and brightness before continuing.', // message
            refreshConfig, // callback
            'Light Settings', // title
            'OK' // buttonName
        );
    });

    $('#transInfo').on('click', function timeoutInfo() {
        navigator.notification.alert(
            'This sets the transition period between one scene to the next.', // message
            refreshConfig, // callback
            'Transitions', // title
            'OK' // buttonName
        );
    });

}