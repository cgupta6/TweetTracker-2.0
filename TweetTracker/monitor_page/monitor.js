//This file controls monitor page. All it needs to do is call the api endpoint and when the data returns, draw the trendlines.

console.log("testing")


$.ajax({
	'url': "http://blogtrackers.fulton.asu.edu:5000/api/monitoringtrendlines",
	'dataType': "jsonp",
	'success': function(data){
		console.log(data)
		
		Morris.Line({
			'element': 'hourlyTrends',
			'data': data['hourArray'],
			'xkey': 'timestamp',
			'ykeys': ['count'],
			'labels': ['Tweets per hour']
		})
	
		Morris.Line({
			'element': 'minutelyTrends',
			'data': data['minuteArray'],
			'xkey': 'timestamp',
			'ykeys': ['count'],
			'labels': ['Tweets per minute']
		})
	}
})