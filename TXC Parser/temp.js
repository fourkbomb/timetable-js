function generateStopsTable(stops) {

	var ALL_STATIONS = true;
	var LAST_STATION = "";
	var txt = "";
	//var stops = next["jpref"]["jpatsect"];
	var MinDiff = 0;
	var SecDiff = 0;
	var found_current_station = false;
	var legitimately = false;
	var SKIPS_CURRENT_STATION = false;
	var overridden = false;
	// zero-based indexing
	var counted_stops = -1;
	if (SHOW_PROGRESS_OF && TIME_TO_SHOW != "") {
		var hms = next["leaves"].split(":");
		time = new Date();
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
		MinDiff = 0;
		SecDiff = 0;
		var nt = false;
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
			if (stops[i][1] == null) {
				z = [null, "pickUp"];
			}
			var type = "<img height=\"25\" width=\"30\" src=\"imgs/pickup.fw.png\" alt=\"Pick up only\" title=\"Pick up only\" />";
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

		if (counted_stops == 0) {
			after_thing = true;
			var t = time;
			var now = new Date();
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
				if (counted_stops == 0 && document.getElementById("td0") != null && document.getElementById("td0").innerHTML != "" && !COUNTDOWN_SUCKS && !TEMP_COUNTDOWN_SUCKS) {

					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + "\"" : "") + ">" + document.getElementById("td0").innerHTML + "</td></tr>";
				} else {

					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + "\"" : "") + ">" + getHoursAndMinutesWithDate(time) + "</td></tr>";
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
				if (counted_stops == 0 && document.getElementById("td0") != null && document.getElementById("td0").innerHTML != "" && !COUNTDOWN_SUCKS && !TEMP_COUNTDOWN_SUCKS) {
					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + "\"" : "") + ">" + document.getElementById("td0").innerHTML + "</td></tr>";
				} else {
					//document.getElementById("time-left").innerHTML = "s tomorrow";
					txt += "<td  " + ((after_time || found_current_station && !SHOW_PROGRESS_OF) ? "class=\"bolder\" id=\"td" + counted_stops + "\"" : "") + ">" + getHoursAndMinutesWithDate(time) + "</td></tr>";
				}
			} else {
				txt += "<br/>";

			}
			z = null;

		}

		var object = {
		"SKIPS_CURRENT_STATION" : SKIPS_CURRENT_STATION,
		"counted_stops" :counted_stops,
		"found_current_station":found_current_station,
		"text" :txt

	};
	return object;

}

