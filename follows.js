(function ( $ ){

	/*
	EXAMPLE CONFIGURATION

		var defaultKey	= 'fje329iun52ngtuijo2f4jeun432A', // Unique master Xively API key to be used as a default
		defaultFeeds	= [61916,12425,94322], // Comma separated array of Xively Feed ID numbers
		applicationName	= 'My Company\'s Application', // Replaces Xively logo in the header
		dataDuration	= '90days', // Default duration of data to be displayed // ref: https://xively.com/dev/docs/api/data/read/historical_data/
		dataInterval	= 10800, // Default interval for data to be displayed (in seconds)
		dataColor		= '0A1922', // CSS HEX value of color to represent data (omit leading #)
		hideForm		= 0;
	*/

	var defaultKey		= 'O1gd3yykB3lO6zCEjjKsTiwTrrsWJMEKEhDd81yLBAVrzQQ0', // Unique master Xively API key to be used as a default
		defaultFeeds	= [53026], // Comma separated array of Xively Feed ID numbers
		applicationName	= 'Milestone2', // Replaces Xively logo in the header
		dataDuration	= '1day', // Default duration of data to be displayed // ref: https://xively.com/dev/docs/api/data/read/historical_data/
		dataInterval	= 10800, // Default interval for data to be displayed (in seconds)
		dataColor		= '0A1922', // CSS HEX value of color to represent data (omit leading #)
		hideForm		= 0; // To hide input form use value of 1, otherwise set to 0

// Function Declarations

	// URL Parameters
	function getParam(key) {
	 	var value = location.hash.match(new RegExp(key+'=([^&]*)'));
		if(value) {
			return value[1];
		} else {
			return "";
		}
	}

	// Graph Annotations
	function addAnnotation(force) {
		if (messages.length > 0 && (force || Math.random() >= 0.95)) {
			annotator.add(seriesData[2][seriesData[2].length-1].x, messages.shift());
		}
	}

	// Add One (1) Day to Date Object
	Date.prototype.addDays = function (d) {
		if (d) {
			var t = this.getTime();
			t = t + (d * 86400000);
			this.setTime(t);
		}
	};

	// Subtract One (1) Day to Date Object
	Date.prototype.subtractDays = function (d) {
		if (d) {
			var t = this.getTime();
			t = t - (d * 86400000);
			this.setTime(t);
		}
	};

	// Parse Xively ISO Date Format to Date Object
	Date.prototype.parseISO = function(iso){
		var stamp= Date.parse(iso);
		if(!stamp) throw iso +' Unknown date format';
		return new Date(stamp);
	}

	// Set xively API Key
	function setApiKey(key) {
		xively.setKey(key);
	}

	function updateFeeds(feedId, datastreamIds, duration, interval) {
		xively.feed.get(feedId, function(feedData) {
			if(feedData.datastreams) {
				if(datastreamIds == '' || !datastreamIds) {
					feedData.datastreams.forEach(function(datastream) {
						datastreamIds += datastream.id + " ";
					});
				}
				feedData.datastreams.forEach(function(datastream) {
					var now = new Date();
					var then = new Date();
					var updated = new Date;
					updated = updated.parseISO(datastream.at);
					var diff = null;
					if(duration == '6hours') diff = 21600000;
					 if(duration == '1day') diff = 86400000;
					 if(duration == '1week') diff = 604800000;
					 if(duration == '1month') diff = 2628000000;
					 if(duration == '90days') diff = 7884000000;
					then.setTime(now.getTime() - diff);
					if(updated.getTime() > then.getTime()) {
						if(datastreamIds && datastreamIds != '' && datastreamIds.indexOf(datastream.id) >= 0) {
							xively.datastream.history(feedId, datastream.id, {duration: duration, interval: interval, limit: 1000}, function(datastreamData) {

								var series = [];
								var points = [];

								// Create Datastream UI
								$('.datastream-' + datastream.id).empty();
								$('.datastream-' + datastream.id).remove();
								$('#feed-' + feedId + ' .datastream.hidden').clone().appendTo('#feed-' + feedId + ' .datastreams').addClass('datastream-' + datastream.id).removeClass('hidden');

								// Check for Datastream Tags
								var tagsHtml = '';
								if(datastreamData.tags) {
									tagsHtml = '<div style="font-size: 14px;"><span class="radius secondary label">' + datastreamData.tags.j
