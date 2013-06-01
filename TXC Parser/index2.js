// index2.js
// variables
var COUNTDOWN_SUCKS = false;
var TEMP_COUNTDOWN_SUCKS = false;
var ALREADY_LOADED = false;
var timer_on_01 = false;
var SHOW_PROGRESS_OF = false;
var DISABLE_UPDATE_TIME = false;
var IS_GADGET = navigator.userAgent.search(/Tablet PC/) != -1;
var THIS_TIME_OK = false; // used to 
var ENDS_AT_CQ = false;
// used for gadget-mode detection.
var ENABLE_CITYRAIL_MODE = IS_GADGET;

var NORTH_SHORE_WESTERN_CENTRAL_TIMES = {};
var LAST_NSW_CENTRAL = "";

var stops;
var reverse_stations;
var station_platform;
var times;
var LatestTrain;
var last_station;
var CURRENT_STATION;

var last_minute = -4;
var DAY_OF_WEEK = (new Date()).getDay();

var TIME_TO_SHOW = null;
var COUNTDOWN_TIME = null;
var LAST_NSW_TIME = null;

var TRIP_DATA = {};
var stations = {};
var possible_times = {};

var OLD_TDATA = {};
var OLD_STATIONS = {};
var OLD_RSTATIONS = {};

var LAST_KEY = "";
var old_best_shot = [];
var orderedRouteList = [];

var FORCE_MERGE_AT_STATION = "";
var MERGED_ROUTES;
var TIMECACHE_FOR_STATIONS = {};

for (z in SCRIPTS) {

	orderedRouteList.push(z);
}
orderedRouteList = orderedRouteList.sort();

/**
 *Return a date
 * @return date
 */
function getDate() {

	var date = new Date();
	while (date.getDay() != DAY_OF_WEEK) {
		date.setDate(date.getDate() + 1);
	}
	return date;

}

function backupCurrentStuff() {
	
	OLD_TDATA = TRIP_DATA;
	OLD_STATIONS = stations;
	OLD_RSTATIONS = reverse_stations;
	
}

function mergeOldData() {
	
	for (i in OLD_TDATA) {
		
		TRIP_DATA[i] = OLD_TDATA[i];
		
	}
	
	for (i in OLD_STATIONS) {
		
		stations[i] = OLD_STATIONS[i];
		
	}
	
	MERGED_ROUTES = true;
	
	for (i in OLD_RSTATIONS) {
		
		reverse_stations[i] = OLD_RSTATIONS[i];
		
	}
	
	OLD_RSTATIONS = OLD_STATIONS = OLD_TDATA = {};
	
	// taken from loaded()
	stops = [];
	for (s in stations) {
		
		if (stops.indexOf(stations[s]) != -1) {
			continue;
		}
		if (stops.join(" ").search(stations[s]) != -1) {
			continue;
		}
		
		stops.push(stations[s]);

		//reverse_stations[stations[s].replace("_", "")] = s;
	}

	stops = stops.sort()
	for (s in stops) {
		var j = stops[s].split("(Platform");
		if (j[1] != null) {
			j[0] = j[0].replace(/ $/, "");
			j[1] = "(Platform" + j[1];
			if (station_platform == null || station_platform[j[0]] == null) {
				station_platform[j[0]] = [j[1].replace("(", "").replace(")", "")];
			} else {
				if (station_platform[j[0]].indexOf(j[1].replace("(", "").replace(")", "")) != -1) {
					continue;
				}
				station_platform[j[0]].push(j[1].replace("(", "").replace(")", ""));
			}
			station_platform[j[0]] = station_platform[j[0]].sort();
		} else {
			station_platform = null;
		}
	}
	if (station_platform != null) {
		for (s in station_platform) {
			html += "<option value=\"" + s + "\">" + s + "</option>\n";
		}
		document.getElementById("cityrailmode").style.display = "inline";
		document.getElementById("crmw").style.display = "inline";
	} else {
		for (s in stops) {
			html += "<option value=\"" + reverse_stations[stops[s]] + "\">" + stops[s] + "</option>\n";
		}
		document.getElementById("cityrailmode").style.display = "none";
		document.getElementById("crmw").style.display = "none";
	}
	clockUpdate();
	document.getElementById("stickWithMe").checked = false;
	document.getElementById("list1").innerHTML = html;

	onRouteChoiceChange();
	updateTimeLeft();
	populateTimeList();
	updateHours();
	document.getElementById("chooseordie").style.display = "none";
	TIMECACHE_FOR_STATIONS = {}; // force recalculate
}

function toggleCityRailMode() {
	var el = document.getElementById("cityrailmode");
	ENABLE_CITYRAIL_MODE = el.checked;
	if (document.getElementById("content-left").style.display == "none" || LatestTrain == null) {
		el.checked = false;
		return;
	}
	if (el.checked) {
		// CityRail mode ACTIVATED.
		document.getElementById("sidebar").style.display = "inline";
		//	document.getElementById("cityrailmode").style.position = "relative";
		var tl = document.getElementById("time-left");
		tl.innerHTML = "";
		tl.id = "time-left2";
		document.getElementById("alternate-time-left").id = "time-left";
		document.getElementById("sidebar").style.width = "110px";
		//		document.getElementById("sidebar").innerHTML = "sidebar.";
		document.getElementsByTagName("body")[0].style.background = "#00008C";
		document.getElementsByTagName("body")[0].style.color = "#FFFF00";
		document.getElementById("skips").style.display = "none";
		document.getElementById("content-left").style.marginLeft = "110px";
		document.getElementById("list-wrapper").style.display = "none";
		document.getElementById("allstops").id = "allstops2";
		document.getElementById("allstops2").innerHTML = "";
		document.getElementById("alt-all-stops").id = "allstops";
		document.getElementById("hideme").style.display = "none";
		document.getElementsByTagName("body")[0].style.textAlign = "center";
		document.getElementById("stoppingAt").style.display = "none";
		document.getElementById("content-left").style.marginTop = "70px";

		var lists = document.getElementsByClassName("list");
		for ( i = 0; i < lists.length; i++) {
			lists.item(i).classList.add("list2");
		}

	} else {
		document.getElementById("sidebar").style.display = "none";
		document.getElementById("content-left").style.marginLeft = "auto";
		document.getElementsByTagName("body")[0].style.backgroundColor = "rgb(30,34,39)";
		document.getElementsByTagName('body')[0].style.color = "rgb(230,230,230)";
		var tl = document.getElementById("time-left");
		tl.innerHTML = "";
		tl.id = "alternate-time-left";
		document.getElementById("skips").style.display = "inline";
		document.getElementById("time-left2").id = "time-left";
		document.getElementsByTagName("body")[0].style.textAlign = "left";
		document.getElementById("list-wrapper").style.display = "inline";
		document.getElementById("allstops").id = "alt-all-stops";
		document.getElementById("alt-all-stops").innerHTML = "";
		document.getElementById("allstops2").id = "allstops";
		document.getElementById("hideme").style.display = "inline";
		document.getElementById("stoppingAt").style.display = "inline";
		document.getElementById("allstops-helper").innerHTML = "";
		document.getElementById("content-left").style.marginTop = "130px";

		var lists = document.getElementsByClassName("list");
		for (var i = 0; i < lists.length; i++) {
			lists.item(i).classList.remove("list2");
		}
	}
	updateTimeLeft();

}

function updateDayOfWeek() {
	DAY_OF_WEEK = document.getElementById("date-select").selectedIndex
	loaded();
	document.getElementById("chooseordie").style.display = "none";
}

function doScroll() {
	if (document.getElementById("content-left").style.display != "none") {
		window.scrollBy(0, 1);
	}

	//	setTimeout(doScroll, 100);
}

function doScrollTop() {
	window.scrollTo(0, 0);
	setTimeout(doScroll, 300);
}

// helper functions
function numToDay(day) {
	switch(day) {
		case 0:
			return "Sunday";
		case 1:
			return "Monday";
		case 2:
			return "Tuesday";
		case 3:
			return "Wednesday";
		case 4:
			return "Thursday";
		case 5:
			return "Friday";
		case 6:
			return "Saturday";
	}
}

function getHoursAndMinutes() {
	var NOW = getDate();
	return getHoursAndMinutesWithDate(NOW);
}

function getHoursAndMinutesWithDate(NOW, ampm, withsecs) {
	if (ampm == null) {
		ampm = false;
	}
	if (withsecs == null) {
		withsecs = true;
	}
	var hours;
	var suffix = "";
	if (ampm) {
		hours = NOW.getHours() % 12;

		//hours = hours.toString();
		suffix = ((NOW.getHours() / 12) < 1) ? "AM" : "PM";
		if (hours == 0) {
			hours = 12;
		}
		hours = hours.toString();
	} else {
		hours = NOW.getHours().toString();
	}
	if (hours.length == 1) {
		hours = "0" + hours;
	}
	var minutes = NOW.getMinutes().toString();
	if (minutes.length == 1) {
		minutes = "0" + minutes;
	}
	var seconds = NOW.getSeconds().toString();
	if (seconds.length == 1) {
		seconds = "0" + seconds;
	}
	return hours + ":" + minutes + ( withsecs ? ":" + seconds : "") + " " + suffix;
}

// these actually do stuff.
function loaded() {
	// reset variables
	if (document.getElementsByTagName("script").length - 2 > 10) {
		document.getElementById("toomanyscripts").style.display = "inline";
	}
	document.getElementById("cityrailmode").checked = false;
	document.getElementById("chooseordie").style.display = "inherit";
	document.getElementById("date-select").selectedIndex = DAY_OF_WEEK;
	var html = ""
	stops = [];
	ENDS_AT_CQ = false;
	THIS_TIME_OK = false;
	if (OLD_TDATA == {} || OLD_TDATA == null) {
		MERGED_ROUTES = false;
	}
	station_platform = {};
	reverse_stations = {};
	if (!ALREADY_LOADED) {
		
		
		// populate operator list
		
		var linechoose = document.getElementById("op-choose");
		linechoose.onchange = changeJavascript;
		var text = "";
		for (i in orderedRouteList) {
			var str = orderedRouteList[i];
			text += "<option value=\"" + str + '">' + str + "</option>";
		}
		linechoose.innerHTML = text;
		
	}

	for (s in stations) {
		if (reverse_stations[stations[s].replace("_", "")] != null ) {
			//	window.console.log("Found dupe: " + stations[s]);
			if (document.getElementById("op-choose").value == "CityRail") {
				continue;
			}
			stations[s] += " ";
		}
		stops.push(stations[s].replace("_", ""));

		reverse_stations[stations[s].replace("_", "")] = s;
	}

	stops = stops.sort()
	for (s in stops) {
		var j = stops[s].split("(Platform");
		if (j[1] != null) {
			j[0] = j[0].replace(/ $/, "");
			j[1] = "(Platform" + j[1];
			if (station_platform == null || station_platform[j[0]] == null) {
				station_platform[j[0]] = [j[1].replace("(", "").replace(")", "")];
			} else {
				station_platform[j[0]].push(j[1].replace("(", "").replace(")", ""));
			}
			station_platform[j[0]] = station_platform[j[0]].sort();
		} else {
			station_platform = null;
		}
	}
	if (station_platform != null) {
		for (s in station_platform) {
			html += "<option value=\"" + s + "\">" + s + "</option>\n";
		}
		document.getElementById("cityrailmode").style.display = "inline";
		document.getElementById("crmw").style.display = "inline";
	} else {
		for (s in stops) {
			html += "<option value=\"" + reverse_stations[stops[s]] + "\">" + stops[s] + "</option>\n";
		}
		document.getElementById("cityrailmode").style.display = "none";
		document.getElementById("crmw").style.display = "none";
	}
	clockUpdate();
	document.getElementById("stickWithMe").checked = false;
	document.getElementById("list1").innerHTML = html;

	onRouteChoiceChange();
	updateTimeLeft();
	populateTimeList();
	updateHours();


	// start.
	if (!ALREADY_LOADED) {	
		setInterval(updateTimeLeft, 1000);
		setInterval(clockUpdate, 1000);
		ALREADY_LOADED = true;
	}
}

function populateTimeList() {
	var el = document.getElementById("hour-sel");
	var txt = "<option value=\"\">Next time</option>";
	var sorted = [];
	possible_times = {};
	for (i in times) {
		sorted.push(i);
	}

	sorted = sorted.sort();
	var hours = [];
	for (i in sorted) {
		var time = sorted[i];
		var hms = time.split(':');
		if (possible_times[hms[0]] == null) {
			hours.push(hms[0]);
			possible_times[hms[0]] = [hms[1] + ":" + hms[2]];
		} else {
			possible_times[hms[0]].push(hms[1] + ":" + hms[2]);
			continue;
		}
		//txt += "<option value=\"" + hms[0] + "\">" + hms[0] + "</option>";
	}

	hours = hours.sort();
	for (j in hours) {
		i = hours[j];
		txt += '<option value="' + i + '">' + i + "</option>";
	}
	el.innerHTML = txt;

}

function updateHours() {
	var el = document.getElementById("min-sel");
	var hrs = document.getElementById("hour-sel");
	var txt = "<option value=\"\">Choose...</option>";

	var mins = possible_times[hrs.value];
	if (hrs.value == "") {
		el.innerHTML = "<option value=\"\">&nbsp;&nbsp;</option>";
		return;
	}
	for (i in mins) {

		var time = mins[i];
		time = time.replace(/:\d\d /, ":00 ");
		var prettytime = mins[i].split(":")[0];
		txt += '<option value="' + time + '">' + prettytime + '</option>';

	}
	el.innerHTML = txt;
}

function updateTimeToShow() {

	var choose = document.getElementById("min-sel");
	var hchoose = document.getElementById("hour-sel");
	if (hchoose.value != "" && hchoose.value != null && choose.value != "" && choose.value != null) {
		TIME_TO_SHOW = hchoose.value + ":" + choose.value;
		SHOW_PROGRESS_OF = (TIME_TO_SHOW != "");
		document.getElementById("stickWithMe").checked = false;
	} else {
		TIME_TO_SHOW = "";
		SHOW_PROGRESS_OF = false;
	}

	updateTimeLeft();
	clockUpdate();
}

function doMathsHomework() {
	
	window.console.error("2 + 2 == 3 according to your PC. Please update!");// + (2+2));
	
}

function changeJavascript() {
	NORTH_SHORE_WESTERN_CENTRAL_TIMES = null;
	LAST_NSW_CENTRAL = "";
	MERGED_ROUTES = false;
	var key = document.getElementById("op-choose").value;
	var route = document.getElementById("line-choose").value;
	document.getElementById("not-stop").innerHTML = "";
	TRIP_DATA = {};
	stations = {};

	if (key != LAST_KEY) {
		LAST_KEY = key;
		var sel = document.getElementById("line-choose");
		var txt = "<option value=\"\">Choose...</option>";
		var ary = [];
		for (i in SCRIPTS[key]) {
			ary.push(i);
		}
		ary = ary.sort();
		for (j in ary) {
			var i = ary[j];
			txt += "<option value=\"" + i + "\">" + i + "</option>";
		}
		sel.innerHTML = txt;
		route = ""

	}

	
		// hide unused content while we're loading.
	document.getElementById("content-left").style.display = "none";
	document.getElementById("chooseordie").style.display = "inline";
	document.getElementById("list-wrapper").style.display = "none";
	if (route == "") {
		return;
	}

	
	var file = SCRIPTS[key][route];

	var tag = document.createElement("script");
	tag.src = file;
	tag.type = "text/javascript";
	tag.async = false;
	tag.onload = function() {
		
		loaded();
		document.getElementById("content-left").style.display = "inline";
		document.getElementById("chooseordie").style.display = "none";
		document.getElementById("list-wrapper").style.display = "inline";
	}
	var s=document.getElementsByTagName('script')[0];
	
	try {
		s.parentNode.insertBefore(tag,s);
	}
	catch (ex){} // chrome screws up


	html = "";
	//setTimeout(loaded, 250);
	
}

function toggleStations() {
	updateTimeLeft();
}

function clockUpdate() {
	//var lw = document.getElementById("l");
	//document.getElementById("header").style.height = lw.offsetHeight + 10;
	//document.getElementById("content-left").style.paddingTop = lw.offsetHeight + 30;
	document.getElementById("clock").innerHTML = getHoursAndMinutes();

	var currentCountdown = document.getElementById("td0");
	if (COUNTDOWN_TIME == null || currentCountdown == null) {
		return;
	}

	if (COUNTDOWN_SUCKS || TEMP_COUNTDOWN_SUCKS) {
		return;
	}
	var now = getDate();
	var mins = 0;
	var secs = 0;
	var ms = 0;
	if (now.valueOf() > COUNTDOWN_TIME.valueOf()) {
		COUNTDOWN_TIME.setDate(COUNTDOWN_TIME.getDate() + 1);
	}

	var dif = COUNTDOWN_TIME.valueOf() - now.valueOf();
	dif = Math.floor(dif / 1000);
	secs = Math.floor(dif % 60);
	dif = Math.floor(dif / 60);
	mins = Math.floor(dif % 60);
	dif = Math.floor(dif / 60);
	ms = Math.floor(dif % 60);
	dif = Math.floor(dif / 60);

	secs = secs.toString();
	if (mins < 0) {
		mins = 0;
	}
	mins = mins.toString();
	ms = ms.toString();
	if (ms.length == 1) {
		ms = "0" + ms;
	}
	if (secs.length == 1) {
		secs = "0" + secs;
	}
	if (mins.length == 1) {
		mins = "0" + mins;
	}
	if (new Number(ms) > 0) {
		currentCountdown.innerHTML = ms + ":" + mins + ":" + secs;
	} else {
		currentCountdown.innerHTML = mins + ":" + secs;
	}

}

function onRouteChoiceChange() {
	last_minute = -4;
	LatestTrain = null;
	TEMP_COUNTDOWN_SUCKS = false;
	ENDS_AT_CQ = false;
	if (document.getElementById("td0") != null) {
		document.getElementById("td0").innerHTML = "";
	}

	document.getElementById("allstops").innerHTML = "";

	if (station_platform != null) {
		if (document.getElementById("list1").value != last_station) {
			var curplat = document.getElementById("list2").value;
			var curplat_exists = false;
			var curplatindex = 0;
			var z = station_platform[document.getElementById("list1").value];
			var s = document.getElementById("list1").value;
			last_station = s;
			var html = "";
			// populate list2.
			for (i in z) {
				var plat = stations[CURRENT_STATION];
				if (plat != null) {
					plat = plat.split("(")[1];
					plat = plat.replace(")", "");
				}
				if (z[i] == plat) {
					curplat_exists = true;
					//curplatindex++;
				}
				html += '<option value="' + reverse_stations[s + " (" + z[i] + ")"] + '">' + z[i] + '</option>';
				if (!curplat_exists) {
					curplatindex++;
				}
			}

			if (document.getElementById("list2").innerHTML != html) {
				document.getElementById("list2").innerHTML = html;
				var j = document.getElementById("list2");
				j.selectedIndex = curplatindex;
				if (j.selectedIndex < 0 || j.selectedIndex >= j.options.length) {
					j.selectedIndex = 0;
				}
			}
		}
	}
	CURRENT_STATION = document.getElementById("list1").value;
	if (station_platform != null) {
		document.getElementById("list2").style.display = "inline";
		var CURPLAT = document.getElementById("list2").value;
		CURRENT_STATION = CURPLAT;
	} else {
		document.getElementById("list2").style.display = "none";
	}

	updateTimeMapping();

	populateTimeList();
	updateTimeToShow();
	updateTimeLeft();
	clockUpdate();
}

function updateTimeMapping() {

	CURRENT_STATION = CURRENT_STATION.replace("_", "");
	times = {};
	
	if (TIMECACHE_FOR_STATIONS[CURRENT_STATION] != null) {
		times = TIMECACHE_FOR_STATIONS[CURRENT_STATION];
		return;
	}

	var last_loop = {};
	var last_dept_time = {};
	var been_two = 0;
	var do_been_two = false;
	// disabled, do this in later sections. (stations[CURRENT_STATION] != null && stations[CURRENT_STATION].search("Central") != -1 && document.getElementById("line-choose").value == "North Shore and Western Line");

	for (j in TRIP_DATA) {
		var min_offset = 0;
		var sec_offset = 0;
		var leaves = TRIP_DATA[j]["leaves"];
		var now = getDate();
		if (TRIP_DATA[j]["days"].indexOf(numToDay(DAY_OF_WEEK)) == -1) {
			continue;
		}
		var o = leaves.split(/:/);
		leaves = getDate();
		leaves.setHours(new Number(o[0]));
		leaves.setMinutes(new Number(o[1]));
		leaves.setSeconds(new Number(o[2]));
		var ok = false;
		var jps = TRIP_DATA[j]["jpref"]["jpatsect"];
		if (been_two == 1) {
			for (i in last_loop) {
				jps[i] = last_loop[i];
			}
		}
		for (z in jps) {
			jps[z][0] = jps[z][0].replace("_", "");
			if (jps[z][1] == null) {
				if (jps[z].indexOf(CURRENT_STATION) != -1) {
					ok = true;
					//break;
				}
				continue;
			}

			if (jps[z].indexOf(CURRENT_STATION) != -1) {
				ok = true;
				//break;
			}
			o = jps[z][1].split(/M/);
			//, jps[z][1]);
			if (jps[z][1].search("M") >= 0) {
				if (min_offset != Number.NaN) {
					min_offset += new Number(o[0]);
				}
				if (jps[z][1].search("S") && o[1] != null) {
					//window.console.log(o[1]);
					o[1] = o[1].replace(/S/, "").split(" ")[0];

					var sec = new Number(o[1]);
					if (sec != Number.NaN) {
						sec_offset += sec;
					}
				}
			} else {
				o = jps[z][1].split(/S/);
				var sec = new Number(o[0]);
				if (sec.toString() != "NaN") {
					sec_offset += sec;
				}
			}
			if (ok) {
				break;
			}
		}

		if (!ok) {
			continue;
		}

		leaves.setMinutes(leaves.getMinutes() + min_offset);
		if (LatestTrain == null) {
			LatestTrain = leaves;
		} else {
			if (LatestTrain.valueOf() < leaves.valueOf()) {
				LatestTrain = leaves;
			}
		}

		if (sec_offset != Number.NaN && sec_offset.constructor == Number && sec_offset.toString().search("N") == -1) {
			leaves.setSeconds(leaves.getSeconds() + sec_offset);
		}
		var now = getDate();
		leaves.setDate(now.getDate());
		//leaves.setMinutes(leaves.getMinutes() + 2);
		leaves.setYear(now.getFullYear());
		leaves.setMonth(now.getMonth());
		var left = getHoursAndMinutesWithDate(leaves);
		//window.console.log(left + " " + leaves + " (mo: " + min_offset + " so: " + sec_offset + ")");
		
		if (times[left] != null) {
			
			var jpsect = TRIP_DATA[times[left]]["jpref"]["jpatsect"];
			var len = TRIP_DATA[j]["jpref"]["jpatsect"].length;
			for (i in jpsect) {
				TRIP_DATA[j]["jpref"]["jpatsect"][i + length] = jpsect[i];
			}
			
		}
		times[left] = j;
	}
	TIMECACHE_FOR_STATIONS[CURRENT_STATION] = times;
}

function updateTimeLeft() {
	if (DISABLE_UPDATE_TIME) {
		return;
	}
	var DO_TWO_TRAINS = document.getElementById("line-choose").value == "North Shore and Western Line" || document.getElementById("line-choose").value == "Northern Line" || MERGED_ROUTES;
	var NOW = getDate();
	var test = getDate();
	var first = false;
	if (LatestTrain == null || NOW.valueOf() > LatestTrain.valueOf()) {
		first = true;
	}
	var best_shot = findNextTime();
	//var type = "Pick up/Set down";

	if (best_shot == null && LatestTrain != null) {
		var now = getDate();
		now.setDate(now.getDate() + 1);
		best_shot = [times[getHoursAndMinutesWithDate(LatestTrain)], LatestTrain];
		if (TRIP_DATA[best_shot[0]]["days"].indexOf(numToDay(now.getDay())) == -1) {
			best_shot = null;
		}
	}
	if (best_shot == null) {
		// STILL!
		document.getElementById("stops").innerHTML = "(nothing stopping here in the near future)";
		document.getElementById("time-left").innerHTML = "s in many hours";
		return;
	}
	var after_thing = false;
	var next = TRIP_DATA[best_shot[0]];
	if (next == null) {
		return;
	}
	var iadded24 = false;
	if (best_shot[1].valueOf() < NOW.valueOf() && !SHOW_PROGRESS_OF) {
		iadded24 = true;
		best_shot[1].setDate(best_shot[1].getDate() + 1);
	}
	var time_left = best_shot[1].valueOf() - NOW.valueOf();
	time_left /= 1000;
	time_left /= 60;
	/*if (time_left < 0) {
	 time_left /= 60;
	 time_left += 24;
	 time_left *= 60;
	 }*/
	time_left = Math.round(time_left);
	//	time_left--;
	//time_left += 3;
	var time = new Date(best_shot[1].valueOf());
	time.setSeconds(0);
	var text = "s" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " in ") + "<span class=\"big\">" + time_left + "</span>" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + " minutes";
	if (time_left == 1) {
		text = "s" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " in ") + "<span class=\"big\">" + time_left + "</span>" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + " minute";
	} else if (time_left < 0 && !SHOW_PROGRESS_OF) {
		text = "s" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "<span class=\"big\">now</span>";
	} else if (time_left == 0) {
		text = "s" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "<span class=\"big\">now</span>";
	} else if (time_left < 0 && SHOW_PROGRESS_OF) {
		var suffix = ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "minutes";

		if (time_left == -1) {
			suffix = ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "minute";
		}

		if (time_left < -100) {
			var m = time_left % -60;
			if (m == -1 || m == 1) {
				suffix = "minute";
			}
			if (m == 0) {
				suffix = "";
				m = "";
			}
			var h = Math.floor(time_left / -60);
			time_left = h + "</span>" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "hour" + (h != -1 && h != 1 ? "s" : "") + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + " <span class=\"big\">" + m + "</span> " + suffix;
		} else {
			time_left = time_left + "</span> " + suffix;
		}
		var t = time_left.toString();
		t = t.replace("-", "");
		text = "ed" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "<span class=\"big\">" + t + " ago";
	} else if (time_left >= 120) {
		text = "s in <span class=\"big\">" + Math.floor(time_left / 60) + "</span>" + " hours " + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + "and <span id=\"big\">" + time_left % 60 + "</span>" + ( ENABLE_CITYRAIL_MODE ? "<br />" : " ") + " minutes";
	}
	if (!ENABLE_CITYRAIL_MODE) {
		text += " (at " + getHoursAndMinutesWithDate(best_shot[1], true, false) + ")";

	} else {
		text = text.replace(" in ", "");
		var j = text.split(" ");
		j[1].replace(">", ">&nbsp;");
		text = j.join(" ");

	}

	document.getElementById("time-left").innerHTML = text;
	var txt = "<table style=\"text-align: inherit;\">";

	var obj = generateStopsTable(next, false, time, iadded24);
	txt += obj["text"];
	/*
	 * SKIPS_CURRENT_STATION" : SKIPS_CURRENT_STATION;
	 "counted_stops" :counted_stops;
	 "found_current_station":found_current_station;
	 "text" :txt;
	 */
	var SKIPS_CURRENT_STATION = obj["SKIPS_CURRENT_STATION"];
	var counted_stops = obj["counted_stops"];
	var found_current_station = obj["found_current_station"];
	var ALL_STATIONS = obj["ALL_STATIONS"];
	var LAST_STATION = obj["LAST_STATION"];
	time = obj["time"];
	var LAST_STATION_ORIG = null;
	var ALL_STATIONS_ORIG = ALL_STATIONS;

	if (DO_TWO_TRAINS && (LAST_STATION.search("Central") != -1 || (LAST_STATION.search("Circular Quay") != -1 && MERGED_ROUTES))) {
		var central = reverse_stations[LAST_STATION];
		if (LAST_NSW_CENTRAL != central || LAST_NSW_TIME != time) {
			//window.console.log("Updating NSW_CENTRAL...");
			LAST_NSW_CENTRAL = central;
			LAST_NSW_TIME = time;
			var now = CURRENT_STATION;
			CURRENT_STATION = central;
			updateTimeMapping();
			SHOW_PROGRESS_OF = true;
			TIME_TO_SHOW = getHoursAndMinutesWithDate(time);
			var best_shot = findNextNextTime();
			SHOW_PROGRESS_OF = false;
			TIME_TO_SHOW = "";
			NORTH_SHORE_WESTERN_CENTRAL_TIMES = TRIP_DATA[best_shot[0]];
			//["jpref"]["jpatsect"];
			CURRENT_STATION = now;
			//window.console.log("Current NSW_CENTRAL = " + LAST_NSW_CENTRAL);
			updateTimeMapping();
			THIS_TIME_OK = false;
			ENDS_AT_CQ = false;
		}

		obj = generateStopsTable(NORTH_SHORE_WESTERN_CENTRAL_TIMES, true, time, iadded24);
		ALL_STATIONS = ALL_STATIONS && obj["ALL_STATIONS"];
		counted_stops += obj["counted_stops"];
		LAST_STATION_ORIG = LAST_STATION;
		LAST_STATION = obj["LAST_STATION"];
		var parts = obj["text"].split("<tr>");
		if (parts[parts.length - 1].search("Circular Quay") == -1 /*|| THIS_TIME_OK*/) {
			THIS_TIME_OK = true;
			if (obj["text"] == "" || obj["text"] == null) {
				return;
			}
			//window.console.log("text: " + obj["text"].replace(/\s/g, "<space>"));
			txt += obj["text"];
		}

	}

	if (SKIPS_CURRENT_STATION) {
		//document.getElementById("not-stop").classList = "";
		document.getElementById("not-stop").innerHTML = "This service does <span class=\"bolder smaller\">not</span> stop at <span class=\"bolder smaller\">" + stations[CURRENT_STATION].split("(")[0] + "</span>";
	} else if (counted_stops == 0 || reverse_stations[LAST_STATION] == CURRENT_STATION) {
		document.getElementById("not-stop").innerHTML = "This service <span class=\"bolder smaller\">terminates</span> at <span class=\"bolder smaller\">" + stations[CURRENT_STATION].split("(")[0] + "</span>";
		document.getElementById("allstops").innerHTML = "<span class=\"bolder smaller\">Terminates</span>";
	}
	else if (DO_TWO_TRAINS && LAST_STATION.search("Circular Quay") == -1 && txt.search("Circular Quay") != -1 && txt.split("<tr>")[0].search("Circular Quay") == -1) {
		ENDS_AT_CQ = true;
		document.getElementById("not-stop").innerHTML = "This train goes to <span class=\"bolder smaller\">" + LAST_STATION.split(" (")[0] + "</span> via the city."
	} else if (DO_TWO_TRAINS) {
		window.console.log("Ho hum...");
		if (ENDS_AT_CQ) {
			return;
		}
		else {
			document.getElementById("not-stop").innerHTML = "";
		}
		
		//nonExistantTOGetF12();
	} else {
		//document.getElementById("not-stop").classList = "fade-out";
		//setTimeout(function() { document.getElementById("not-stop").innerHTML = ""; }, 3000);
		document.getElementById("not-stop").innerHTML = "";
	}
	if (found_current_station == false) {
		txt = "(something screwed up)";
	} else {
		txt += "</table>";
	}
	document.getElementById("stops").innerHTML = txt;
	//clockUpdate(); // force countdown update, causes apparent lag otherwise
	if (station_platform != null && counted_stops != 0 && reverse_stations[LAST_STATION] != CURRENT_STATION) {
		var txt = ALL_STATIONS ? "All stations to " : "Limited stations to ";

		LAST_STATION = LAST_STATION.replace(/\(.*/, "");
		if (ENABLE_CITYRAIL_MODE) {
			var as = txt.replace(" to ", "");
			txt = "<strong class=\"bolder\" style=\"font-size: inherit\">" + LAST_STATION + "</strong>";
			
			document.getElementById("allstops-helper").innerHTML = as;

		} else {
			if (LAST_STATION_ORIG != null && LAST_STATION_ORIG.split(" (")[0] != LAST_STATION && document.getElementById("stops").innerHTML.search("Circular Quay") != -1) {
				txt = ALL_STATIONS_ORIG ? "All stations to " : "Limited stations to ";
				txt += '<strong class="bolder" style="font-size: inherit">' + LAST_STATION_ORIG.split(" (")[0] + "</strong><br />and then<br />";
				txt += ALL_STATIONS ? "All stations to " : "Limited stations to ";
			}
			txt += "<strong class=\"bolder\" style=\"font-size: inherit\">" + LAST_STATION + "</strong>";
		}
		document.getElementById("allstops").innerHTML = txt;
	}
	else {
		document.getElementById("allstops").innerHTML = "Terminates at <strong class=\"bolder\" style=\"font-size: inherit\">" + LAST_STATION.split(" (")[0].replace("_", "") + "</strong>"
	}
	

}

function generateStopsTable(next, isSecondTime, time, iadded24) {
	var stops = next["jpref"]["jpatsect"];
	var ALL_STATIONS = true;
	var LAST_STATION = "";
	var txt = "";
	//var stops = next["jpref"]["jpatsect"];
	var MinDiff = 0;
	var SecDiff = 0;
	var found_current_station = isSecondTime;
	var legitimately = isSecondTime;
	var SKIPS_CURRENT_STATION = isSecondTime;
	var after_time = isSecondTime;
	var overridden = false;
	// zero-based indexing
	var counted_stops = -1;
	if (SHOW_PROGRESS_OF && TIME_TO_SHOW != "") {
		var hms = next["leaves"].split(":");
		time = getDate();
		time.setHours(new Number(hms[0]));
		time.setMinutes(new Number(hms[1]));
		time.setSeconds(new Number(hms[2]));
	}
	var row_tag = "<tr>";
	var end_row_tag = "</tr>";
	var cell_tag = "<td>";
	var end_cell_tag = "</td>";
	if (ENABLE_CITYRAIL_MODE) {
		row_tag = "";
		end_row_tag = "<br />";
		cell_tag = "";
		end_cell_tag = "</span>";
	}
	for ( i = 0; i < stops.length; i++) {
		if (i == 0 && isSecondTime) {
			// don't show "Central" twice.
			continue;
		}
		MinDiff = 0;
		SecDiff = 0;
		var nt = false;
		if (stops[i] == null) {
			// weird bug, idk why it happens
			break;
		}
		stops[i][0] = stops[i][0].replace("_", "");
		if (stops[i][0] == CURRENT_STATION || SHOW_PROGRESS_OF) {
			nt = true;
			//found_current_station = true;
		}
		if (stops[i][0] == CURRENT_STATION) {
			found_current_station = true;
			legitimately = true;
		} else if (!found_current_station && !SHOW_PROGRESS_OF && TIME_TO_SHOW == "") {
			continue;
		}

		var z;

		var skip = false;

		if (stops[i][1] != null) {
			z = stops[i][1].split(" ");

			if (z[0].search("M") != -1) {
				if (!nt || SHOW_PROGRESS_OF) {
					var minsec = z[0].split("M");
					if (minsec.length == 2 && minsec[1].search(/S/) >= 0) {

						minsec[1] = minsec[1].replace(/S/, "");
						SecDiff += new Number(minsec[1]);

					}
					if ((SecDiff / 60) >= 1) {
						MinDiff += Math.floor(SecDiff / 60);
						SecDiff = SecDiff % 60;
					}
					MinDiff += new Number(minsec[0]);
				}
			} else {
				if (!nt || SHOW_PROGRESS_OF) {
					var minsec = z[0].split("S");
					SecDiff += new Number(minsec[0]);
					if ((SecDiff / 60) >= 1) {
						MinDiff += Math.floor(SecDiff / 60);
						SecDiff = SecDiff % 60;
					}
				}
			}
			//var type = "";

			var type = "<img height=\"25\" width=\"30\" src=\"imgs/pickup.fw.png\" alt=\"Pick up only\" title=\"Pick up only\" />";
			if (isSecondTime) {
				type = "<img height=\"25\" width=\"30\" src=\"imgs/pickupsetdown.fw.png\" alt=\"Pick up/Set down\" title=\"Pick up/Set down\" />";
			}
			if (z[1] != null) {
				type = "<img height=\"25\" width=\"30\" ";
				if (z[1].search("pass") != -1) {
					if (document.getElementById("showskipped").checked == false) {
						skip = true;
					}
					ALL_STATIONS = false || !legitimately;
					if (stops[i][0] == CURRENT_STATION) {
						SKIPS_CURRENT_STATION = true;
					}
					type += " src=\"imgs/pass.fw.png\" alt=\"Does not stop\" title=\"Does not stop\" />";
				} else if (z[1].search("pasd") != -1) {
					type += " src=\"imgs/pickupsetdown.fw.png\" alt=\"Pick up/Set down\" title=\"Pick up/Set down\" />";
				} else if (z[1].search("pickUp") != -1) {
					type += " src=\"imgs/pickup.fw.png\" alt=\"Pick up only\" title=\"Pick up only\" />";
				} else if (z[1].search("setDown") != -1) {
					type += " src=\"imgs/setdown.fw.png\" alt=\"Set down only\" title=\"Set down only\" />";
				}
				if (counted_stops == -1 && isSecondTime) {
					type = "<img height=\"25\" width=\"30\" src=\"imgs/pickupsetdown.fw.png\" alt=\"Pick up/Set down\" title=\"Pick up/Set down\" />";
				}
			}
		}
		time.setMinutes(time.getMinutes() + MinDiff);
		time.setSeconds(time.getSeconds() + SecDiff);
		var time_valid = time.valueOf() > Date.now();
		if (skip && !SHOW_PROGRESS_OF) {
			continue;
		} else if (!skip && time_valid && found_current_station) {
			//counted_stops++;
		} else if (after_thing && skip) {
			continue;
		} else if (!found_current_station && !SHOW_PROGRESS_OF) {
			continue;
		} else if ((!found_current_station || skip) && ENABLE_CITYRAIL_MODE) {
			continue;
		} else if (!found_current_station) {
			skip = true;
		}

		txt += row_tag;
		var overridecountedStops = false;
		var now = Date.now();
		if (time.valueOf() > now && !overridden && SHOW_PROGRESS_OF) {
			overridecountedStops = true;
			after_time = true;

		}
		if (after_time || (found_current_station && !SHOW_PROGRESS_OF)) {
			counted_stops++;
		}

		if (counted_stops == 0 && isSecondTime == false) {
			after_thing = true;
			var t = time;
			var now = getDate();
			var diff = now.valueOf() - t.valueOf();
			if (iadded24) {
				t.setDate(t.getDate() - 1);
			}
			COUNTDOWN_TIME = new Date(t.valueOf());
			//window.console.log("time: " + time + " C_T: " + COUNTDOWN_TIME);
		}

		if (overridecountedStops) {
			overridden == true;
		}

		if (type == null) {
			type = "<img height=\"25\" width=\"30\" src=\"imgs/pickup.fw.png\" alt=\"Pick up only\" title=\"Pick up only\" />";
		}

		LAST_STATION = stations[stops[i][0]];

		if (i != 0) {

			var text = "";
			var z = stations[stops[i][0]];
			z = z.replace(/( +)$/, "");
			var ary = z.split("(Platform");
			ary[0] = ary[0].replace("_", "");
			txt += "<" + ( ENABLE_CITYRAIL_MODE ? "span" : "td") + " class=\"" + ((after_time || (found_current_station && !SHOW_PROGRESS_OF) || ENABLE_CITYRAIL_MODE) ? "bolder" : "none") + "\">" + ary[0] + "&nbsp;&nbsp;" + end_cell_tag;
			if (!ENABLE_CITYRAIL_MODE) {

				txt += "<td>" + type + "&nbsp;&nbsp;</td>";
				if (ary[1] != null) {
					txt += "<td>Platform" + ary[1].replace(")", "") + "&nbsp;&nbsp;</td>";
				}
				var cs_neg = false;
				if (counted_stops == 0 && document.getElementById("td0") != null && document.getElementById("td0").innerHTML != "" && !isSecondTime && !COUNTDOWN_SUCKS && !TEMP_COUNTDOWN_SUCKS) {

					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + ( isSecondTime ? "_" : "") + "\"" : "") + ">" + document.getElementById("td0").innerHTML + "</td></tr>";
				} else {

					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + ( isSecondTime ? "_" : "") + "\"" : "") + ">" + getHoursAndMinutesWithDate(time) + "</td></tr>";
				}
			} else {
				txt += "<br />";
			}
		} else {

			var ary = stations[stops[i][0]].split("(Platform");
			ary[0] = ary[0].replace("_", "");
			txt += "<" + ( ENABLE_CITYRAIL_MODE ? "span" : "td") + " class=\"" + (after_time || (found_current_station && !SHOW_PROGRESS_OF || ENABLE_CITYRAIL_MODE) ? "bolder" : "none") + "\">" + ary[0] + "&nbsp;&nbsp;" + end_cell_tag;
			if (!ENABLE_CITYRAIL_MODE) {

				txt += "<td>" + type + "&nbsp;&nbsp;</td>";
				if (ary[1] != null) {
					txt += "<td>Platform" + ary[1].replace(")", "") + "&nbsp;&nbsp;</td>";
				}
				if (counted_stops == 0 && document.getElementById("td0") != null && document.getElementById("td0").innerHTML != "" && !COUNTDOWN_SUCKS && !TEMP_COUNTDOWN_SUCKS && !isSecondTime) {
					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + ( isSecondTime ? "_" : "") + "\"" : "") + ">" + document.getElementById("td0").innerHTML + "</td></tr>";
				} else {
					//document.getElementById("time-left").innerHTML = "s tomorrow";
					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + ( isSecondTime ? "_" : "") + "\"" : "") + ">" + getHoursAndMinutesWithDate(time) + "</td></tr>";
				}
			} else {
				txt += "<br/>";

			}
			z = null;

		}
	}
	var object = {};
	object["SKIPS_CURRENT_STATION"] = SKIPS_CURRENT_STATION;
	object["counted_stops"] = counted_stops;
	object["found_current_station"] = found_current_station;
	object["text"] = txt;
	object["ALL_STATIONS"] = ALL_STATIONS;
	object["LAST_STATION"] = LAST_STATION;
	object["time"] = time;

	return object;

}

/**
 * Find the next applicable time of a train.
 *
 *
 */
function findNextTime() {
	var best_shot;
	var NOW = getDate();
	while (NOW.getDay() != DAY_OF_WEEK) {
		NOW.setDate(NOW.getDate() + 1);
	}
	// stay in sync
	var test = new Date(NOW.valueOf());
	var first = false;
	if (LatestTrain != null && NOW.valueOf() > LatestTrain.valueOf()) {
		first = true;
	}
	if (TIME_TO_SHOW != "" && SHOW_PROGRESS_OF == true) {
		var hms = TIME_TO_SHOW.split(":");
		test.setHours(new Number(hms[0]));
		test.setMinutes(new Number(hms[1]));
		test.setSeconds(0);

		best_shot = [times[TIME_TO_SHOW], test];

	} else {
		for (i in times) {
			if (TRIP_DATA[times[i]] == null) {
				changeJavascript();
				return;
			}
			var hms = i.split(":");

			if (i.search("NaN") != -1) {
				hms = TRIP_DATA[times[i]]["leaves"].split(":");
			}
			test.setHours(new Number(hms[0]));
			test.setMinutes(new Number(hms[1]));
			var pos = TRIP_DATA[times[i]]["jpref"]["jpatsect"];
			var skip = false;
			for (j in pos) {
				if (pos[j][0] != CURRENT_STATION) {
					continue;
				}

				if (pos[j][1] != null) {
					if (pos[j][1].search("pass") != -1) {
						if (document.getElementById("showskipped").checked == false) {
							skip = true;
						}
					}
					break;
				}

			}
			if (skip) {
				continue;
			}

			if (!first) {
				if (TRIP_DATA[times[i]]["days"].indexOf(numToDay(NOW.getDay())) == -1) {
					continue;
				}
				//test.setMinutes(test.getMinutes() + 2);
				if (test.valueOf() < NOW.valueOf()) {
					continue;
				}
				//test.setMinutes(test.getMinutes() - 2);
				test.setSeconds(0);

			} else {
				var newDay = NOW.getDay() + 1;
				if (newDay == 7) {
					newDay = 0;
				}
				if (skip) {
					SKIPS = true;
					continue;
				} else {
					SKIPS = false;
				}
				if (TRIP_DATA[times[i]]["days"].indexOf(numToDay(newDay)) == -1) {
					continue;
				}
			}
			if (best_shot == null) {
				best_shot = [times[i], new Date(test.valueOf())];
			} else {
				var time2 = best_shot[1];
				if (time2.valueOf() < test.valueOf()) {
					continue;
				} else {
					best_shot = [times[i], new Date(test.valueOf())];
					continue;
				}
			}

		}
	}
	if (best_shot != old_best_shot) {
		TEMP_COUNTDOWN_SUCKS = false;
		old_best_shot = best_shot;
	}
	return best_shot;
}

function findNextNextTime() {
	var best_shot;
	var NOW = findNextTime()[1];
	var test = getDate();
	var first = false;
	if (LatestTrain == null || NOW.valueOf() > LatestTrain.valueOf()) {
		first = true;
	}
	var replaced_already = false;

	for (i in times) {
		if (TRIP_DATA[times[i]] == null) {
			changeJavascript();
			return;
		}
		var hms = i.split(":");

		if (i.search("NaN") != -1) {
			hms = TRIP_DATA[times[i]]["leaves"].split(":");
		}
		test.setHours(new Number(hms[0]));
		test.setMinutes(new Number(hms[1]));
		var pos = TRIP_DATA[times[i]]["jpref"]["jpatsect"];
		var skip = false;
		for (j in pos) {
			if (pos[j][0] != CURRENT_STATION) {
				continue;
			}

			if (pos[j][1] != null) {
				type = "<img height=\"25\" width=\"30\" ";
				if (pos[j][1].search("pass") != -1) {
					if (document.getElementById("showskipped").checked == false) {
						skip = true;
					}
					type += " src=\"imgs/pass.fw.png\" alt=\"Does not stop\" title=\"Does not stop\" />";
				} else if (pos[j][1].search("pasd") != -1) {
					type += " src=\"imgs/pickupsetdown.fw.png\" alt=\"Pick up/Set down\" title=\"Pick up/Set down\" />";
				} else if (pos[j][1].search("pickUp") != -1) {
					type += " src=\"imgs/pickup.fw.png\" alt=\"Pick up only\" title=\"Pick up only\" />";
				} else if (pos[j][1].search("setDown") != -1) {
					type += " src=\"imgs/setdown.fw.png\" alt=\"Set down only\" title=\"Set down only\" />";
				}
			}

		}
		if (skip) {
			continue;
		}

		if (!first) {
			if (TRIP_DATA[times[i]]["days"].indexOf(numToDay(NOW.getDay())) == -1) {
				continue;
			}
			//test.setMinutes(test.getMinutes() + 2);
			if (test.valueOf() <= NOW.valueOf()) {
				continue;
			}
			//test.setMinutes(test.getMinutes() - 2);
			test.setSeconds(0);

		} else {
			var newDay = NOW.getDay() + 1;
			if (newDay == 7) {
				newDay = 0;
			}
			if (skip) {
				SKIPS = true;
				continue;
			} else {
				SKIPS = false;
			}
			if (TRIP_DATA[times[i]]["days"].indexOf(numToDay(newDay)) == -1) {
				continue;
			}
		}
		if (best_shot == null) {
			best_shot = [times[i], new Date(test.valueOf())];
		} else {
			var time2 = best_shot[1];
			if (time2.valueOf() <= test.valueOf()) {
				continue;
			} else {
				best_shot = [times[i], new Date(test.valueOf())];
				continue;
			}
		}

	}

	if (best_shot != old_best_shot) {
		TEMP_COUNTDOWN_SUCKS = false;
		old_best_shot = best_shot;
	}
	return best_shot;
}

function checkboxUpdate() {
	var box = document.getElementById("stickWithMe");
	if (box.checked) {
		TIME_TO_SHOW = getHoursAndMinutesWithDate(findNextTime()[1]);
		TIME_TO_SHOW = TIME_TO_SHOW.replace(/:\d\d /, ":00 ");
		SHOW_PROGRESS_OF = true;
	} else {

		TIME_TO_SHOW = "";
		SHOW_PROGRESS_OF = false;

	}

}