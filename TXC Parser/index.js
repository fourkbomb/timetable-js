
var SHOW_SKIPPED_STATIONS = false;

function toggleStations() {
	
		//document.getElementById("showskipped").value
		updateTimeLeft();
}

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

var LAST_KEY = "";
var LAST_ROUTE = "";
function changeJavascript() {
	var key = document.getElementById("op-choose").value;
	var route = document.getElementById("line-choose").value;
	
	TRIP_DATA = {};
	stations = {};
	
	if (key != LAST_KEY) {
		document.getElementById("content-left").style.display = "none";
		document.getElementById("list-wrapper").style.display = "none";
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
	
	if (route == "") {
		TRIP_DATA = {};
		stations = {};
		document.getElementById("content-left").style.display = "none";
		document.getElementById("list-wrapper").style.display = "none";
		//document.getElementById("undone").style.display = "inline";
		return;
	}
	
	
	document.getElementById("content-left").style.display = "inline";
	document.getElementById("list-wrapper").style.display = "inherit";
	//document.getElementById("undone").style.display = "none";
	var file1 = SCRIPTS[key][route];
	
	var tag1 = document.createElement("script");
	tag1.src = file1;
	
	var head = ((document.getElementsByTagName("head"))[0]);
	head.appendChild(tag1);

	html = "";
	loaded();	
}
var CURRENTLY_PRESSED = "";
function onKeyPress(arg) {}

var stops = [];
var stations = {};
var TRIP_DATA = {};
var stationplatform = {};
var orderedRouteList = [];
var times = {};
var LatestTrain;

for (z in SCRIPTS) {
	
	orderedRouteList.push(z);
}

orderedRouteList = orderedRouteList.sort();

var html = "";




var CURRENT_STATION;
var ALREADY_LOADED;
var reverse_stations = {};

function loaded() {
	if (!ALREADY_LOADED) {
		document.getElementById("line-choose").onkeypress = onKeyPress;
		var linechoose = document.getElementById("op-choose");
		linechoose.onchange = changeJavascript;
		var text = "";
		for (i in orderedRouteList) {
			var str = orderedRouteList[i];
			
			text += "<option value=\"" + str + '">' + str + "</option>";
		}
		linechoose.innerHTML = text;
	}
	ALREADY_LOADED = true;
	stops = [];
	stationplatform = {};
	reverse_stations = {};
	
	//changeJavascript();  
	for (s in stations) {
		stops.push(stations[s].replace("_", ""));
		reverse_stations[stations[s].replace("_", "")] = s;
	}
	stops = stops.sort()
	for (s in stops) {
		var j = stops[s].split("(Platform");
		if (j[1] != null) {
			j[0] = j[0].replace(/ $/, "");
			j[1] = "(Platform" + j[1];
			if (stationplatform == null || stationplatform[j[0]] == null) {
				stationplatform[j[0]] = [j[1].replace("(", "").replace(")", "")];
			}
			else {
				stationplatform[j[0]].push(j[1].replace("(", "").replace(")", ""));
			}
			stationplatform[j[0]] = stationplatform[j[0]].sort();
		}
		else {
			stationplatform = null;
		}
	}
	if (stationplatform != null) {
		for (s in stationplatform) {
			
			html += "<option value=\"" + s + "\">" + s + "</option>\n";	
		}
	}
	else {
		for (s in stops) {
			html += "<option value=\"" + reverse_stations[stops[s]] + "\">" + stops[s] + "</option>\n";	
		}
	}
	clockUpdate();
	document.getElementById("list1").innerHTML = html;
	onBitChange();
	updateTimeLeft();
	setInterval(updateTimeLeft, 1000);
	setInterval(clockUpdate, 1000);
}

function clockUpdate() {
	document.getElementById("clock").innerHTML = getHoursAndMinutes();
}

function onBitChange() {
	LatestTrain = null;
	if (stationplatform != null) {
		if (document.getElementById("list1").value != CURRENT_STATION) {
			var curplat = document.getElementById("list2").value;
			var curplat_exists = false;
			var curplatindex = 0;
			var z = stationplatform[document.getElementById("list1").value];
			var s = document.getElementById("list1").value;
			var html = "";
			// populate list2.
			for (i in z) {
				if (z[i] == curplat) {
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
	if (stationplatform != null) {
		document.getElementById("list2").style.display = "inline";
		var CURPLAT = document.getElementById("list2").value;
		CURRENT_STATION = CURPLAT;
	}
	else {
		document.getElementById("list2").style.display = "none";
	}
	
	CURRENT_STATION = CURRENT_STATION.replace("_", "");
	
	times = {};
	
	
	for (j in TRIP_DATA) {
		var min_offset = 0;
		var sec_offset = 0;
		var leaves = TRIP_DATA[j]["leaves"];
		var now = new Date();
		if (TRIP_DATA[j]["days"].indexOf(numToDay(now.getDay())) == -1) {
			continue;
		}
		var o = leaves.split(/:/);//, leaves);
		leaves = new Date();
		leaves.setHours(new Number(o[0]));
		leaves.setMinutes(new Number(o[1]));
		leaves.setSeconds(new Number(o[2]));
		var ok = false;
		var jps = TRIP_DATA[j]["jpref"]["jpatsect"];
		for (z in jps) {
			jps[z][0] = jps[z][0].replace("_", "");
			if (jps[z][1] == null) {
				if (jps[z].indexOf(CURRENT_STATION) != -1) {
					ok = true;
					break;
				}
				continue;
			}
			

			
			if (jps[z].indexOf(CURRENT_STATION) != -1) {
				ok = true;
				//window.console.log(jps[z][0] + " == " + CURRENT_STATION + " index " + z);
				break;
			}	
			o = jps[z][1].split(/M/);//, jps[z][1]);
			if (jps[z][1].search("M") >= 0) {
				if (min_offset != Number.NaN) {
					min_offset += new Number(o[0]);
				}
				if (jps[z][1].search("S") && o[1] != null) {
					//window.console.log(o[1]);
					o[1] = o[1].replace(/S/, "");
				
				
					var sec = new Number(o[1]);
					if (sec != Number.NaN) {
						sec_offset += sec;
					}
				}
			}
			else {
				o = jps[z][1].split(/S/);
				var sec = new Number(o[0]);
				if (sec != Number.NaN) {
					sec_offset += sec;
				}
			}
			
			
		}
		if (!ok) {
			continue;
		}
		min_offset++;
		leaves.setMinutes(leaves.getMinutes() + min_offset);
		if (LatestTrain == null) {
			LatestTrain = leaves;
		}
		else {
			if (LatestTrain.valueOf() < leaves.valueOf()) {
				LatestTrain = leaves;
			}
		}
		
		if (sec_offset != Number.NaN && sec_offset.constructor == Number && sec_offset.toString().search("N") == -1) {
			//window.console.log(sec_offset + " != NaN");
			leaves.setSeconds(leaves.getSeconds() + sec_offset);
			//window.console.log("Skipping seconds.");
		}
		else {
			window.console.log("secs skipped!");
		}
		var now = new Date();
		leaves.setDate(now.getDate());
		leaves.setYear(now.getFullYear());
		leaves.setMonth(now.getMonth());
		var left = getHoursAndMinutesWithDate(leaves);
		window.console.log(left + " " + leaves + " (mo: " + min_offset + " so: " + sec_offset + ")");
		/*if (getHoursAndMinutesWithDate(leaves).search("NaN") != -1) {
			alert("BEGIN DEBUG...");
			var onemin = new Date();
			onemin.setMinutes(onemin.getSeconds() + 10);
			while ((new Date()).valueOf() < onemin.valueOf()) {}	
		}*/
		times[left] = j;
	}
	updateTimeLeft();
}
//times.sort();
function getHoursAndMinutes() {
	var NOW = new Date();
	return getHoursAndMinutesWithDate(NOW);

}
function getHoursAndMinutesWithDate(NOW) {
	var withsecs;
	if (withsecs == null)
		withsecs = true;
	var hours = NOW.getHours().toString();
	if (hours.length == 1) {
		hours = "0" + hours;
	}
	var minutes = NOW.getMinutes().toString();
	if (minutes.length == 1) {
		minutes = "0" + minutes;
	}
	var seconds = NOW.getSeconds().toString();
	if (seconds.length == 1 && withsecs != false) {
		seconds = "0" + seconds;
	}
	return hours + ":" + minutes + ":" + seconds;
}
var current_entry = null;


var SKIPS = false;
function updateTimeLeft() {
	SKIPS = false;
	var NOW = new Date();	
	var test = new Date();
	var first = false;
	if (LatestTrain == null || NOW.valueOf() > LatestTrain.valueOf()) {
		first = true;
	}
	//LatestTrain = null;
	var best_shot;
	var type = "Pick up/Set down";
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
					skip = true;
					type = "Does not stop";
				}
				else if (pos[j][1].search("pasd")) {
					type = "Pick up/Set down";
				}
				else if (pos[j][1].search("pickUp")) {
					type = "Pick up only";
				}
				else if (pos[j][1].search("setDown")) {
					type = "Set down only";
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
			if (test.valueOf() < NOW.valueOf()) {
				continue;	
			}
			test.setSeconds(0);
			/*var tsecs = Math.floor(test.valueOf() / 1000);
			var nsecs = Math.floor(NOW.valueOf() / 1000);
			if ((nsecs % 60) - (tsecs % 60) < 30 && test.getHours() == NOW.getHours() && test.getMinutes() == NOW.getMinutes()) {
				continue;
			}*/
			
		}
		else {
			var newDay = NOW.getDay() + 1;
			if (newDay == 7) {
				newDay = 0;
			}
			if (skip) { SKIPS = true; continue; }
			else {SKIPS = false; }
			if (TRIP_DATA[times[i]]["days"].indexOf(numToDay(newDay)) == -1) {
				continue;
			}
		}
		if (best_shot == null) {
			best_shot = [times[i], new Date(test.valueOf())];
		}
		else {
			var time2 = best_shot[1];
			if (time2.valueOf() < test.valueOf()) {
				continue;
			}
			else {
				best_shot = [times[i], new Date(test.valueOf())];
				continue;
			}
		}
		
	}
	if (best_shot == null && LatestTrain != null) {
		var now = new Date();
		now.setDate(now.getDate() + 1);
		best_shot = [times[getHoursAndMinutesWithDate(LatestTrain)], LatestTrain];
		if (TRIP_DATA[best_shot[0]]["days"].indexOf(numToDay(now.getDay())) == -1) {
			best_shot = null;
		}
	}
	if (best_shot == null) {
		// STILL!
		document.getElementById("stops").innerHTML = "(nothing stopping here in the next twenty-four hours)";
		document.getElementById("time-left").innerHTML = "in a long time";
		return;
	}
	
	/*if (SKIPS) {
		document.getElementById("skips").innerHTML = " does not stop, but the next stopping train is due ";
	}*/
	
	var next = TRIP_DATA[best_shot[0]];
	var time_left = best_shot[1].valueOf() - NOW.valueOf();
	time_left /= 1000;
	time_left /= 60;
	if (time_left < 0) {
		time_left /= 60;
		time_left += 24;
		time_left *= 60;
	}
	time_left = Math.round(time_left);
	time_left += 3;
	var time = new Date(best_shot[1].valueOf());
	time.setSeconds(0);
	/*
	      "jpref" : {
         "direction" : "outbound",
         "jpatsect" : [
            [
               "Revesby (Platform 2)",
               "4M"
            ],
	*/
	var text = " in <span class=\"big\">" + time_left + "</span> minutes";
	if (time_left == 1) {
		text = " in <span class=\"big\">" + time_left + "</span> minute";
	}
	else if (time_left  <= 0) {
		text = " <span class=\"big\">now</span>";
	}
	else if (time_left >= 120) {
		text = " <span class=\"big\">" + Math.floor(time_left / 60) + 
		"</span>" + " hours and <span id=\"big\">" + time_left % 60 + "</span>" + " minutes";
	}
	
	document.getElementById("time-left").innerHTML = text;
	//document.getElementById("stationlist").innerHTML = next["jpref"]["jpatsect"][0][0];
	var txt = "<table>";
	var stops = next["jpref"]["jpatsect"];
	var MinDiff = 3;
	var SecDiff = 0;
	var found_current_station = false;
//	window.console.log(" ");
//	window.console.log(" ");
	for (i = 0; i < stops.length; i++) {
		//window.console.log(stops[i][0]);
		//window.console.log(stops[i]);
		var nt = false;
		stops[i][0] = stops[i][0].replace("_", "");
		if (stops[i][0] == CURRENT_STATION) {
			//window.console.log(stops[i][0] + "==" + CURRENT_STATION);
			nt = true;
			found_current_station = true;
		}
		else if (!found_current_station) {
			//window.console.log(stops[i][0] + "!=" + CURRENT_STATION);
			continue;
		}
		else {
			//window.console.log(stops[i][0] + " after " + CURRENT_STATION);
		}
		var skip = false;
		if (stops[i][1] != null) {
			var z = stops[i][1].split(" ");
			
			if (z[0].search("M") != -1) {
				if (!nt) {
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
			}
			else {
				if (!nt) {
					var minsec = z[0].split("S");
					SecDiff += new Number(minsec[0]);
					if ((SecDiff / 60) >= 1) {
						MinDiff += Math.floor(SecDiff / 60);
						SecDiff = SecDiff % 60;
					}
				}
			}
			if (z[1] != null) {
				if (z[1].search("pass") != -1) {
					if (document.getElementById("showskipped").checked == false) {
						skip = true;
					}
					type = "Does not stop";
				}
				else if (z[1].search("pasd") != -1) {
					type = "Pick up/Set down";
				}
				else if (z[1].search("pickUp") != -1) {
					type = "Pick up only";
				}
				else if (z[1].search("setDown") != -1) {
					type = "Set down only";
				}
			}
		}
		if (skip) {
			continue;
		}
		txt += "<tr>";
		if (i != 0) {
			time.setMinutes(time.getMinutes() + MinDiff);
			time.setSeconds(time.getSeconds() + SecDiff);
			var text = "";
			var z = stations[stops[i][0]];
			var ary = z.split("(Platform");
			ary[0] = ary[0].replace("_", "");
			txt += "<td class=\"bolder\">" + ary[0] + "&nbsp;&nbsp;</td>";
			txt += "<td>" + type + "&nbsp;&nbsp;</td>";
			if (ary[1] != null) {
				txt += "<td>Platform" + ary[1].replace(")", "") + "&nbsp;&nbsp;</td>";
			}
			//text = ary[0] + ary[1];
			txt += "<td class=\"bolder\">" + getHoursAndMinutesWithDate(time) + "</td></tr>";
		}
		else {
			
			var ary = stations[stops[i][0]].split("(Platform");
			ary[0] = ary[0].replace("_", "");
			txt += "<td class=\"bolder\">" + ary[0] + "&nbsp;&nbsp;</td>";
			txt += "<td>" + type + "&nbsp;&nbsp;</td>";
			if (ary[1] != null) {
				txt += "<td>Platform" + ary[1].replace(")", "") + "&nbsp;&nbsp;</td>";
			}
			txt += "<td class=\"bolder\">" + getHoursAndMinutesWithDate(time) + "</td class=\"bolder\"></tr>";
		}
		MinDiff = 0;
		SecDiff = 0;
	}
	if (found_current_station == false) {
		txt = "(something screwed up)";
	}
	else {
		txt += "</table>";
	}
	document.getElementById("stops").innerHTML = txt;
	
}