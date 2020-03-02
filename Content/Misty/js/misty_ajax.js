

function sendPostRequestToRobot(endpoint, ip, payload, callback, dataType = "application/json") {

	var url = "http://" + ip + "/api/" + endpoint;

	$.ajax({
		type: "POST",
		url: url,
		headers: {
			"Accept": dataType,
			"Content-Type": dataType,
			"Access-Control-Allow-Origin": "*"
		},
		data: JSON.stringify(payload.a),
		dataType: "json",
		async: true,
		timeout: 20000,
		success: function (data) {
			console.log(`POST Request to: ${endpoint}\n`, data)
		},
		error: function (request, status, err) {
			if (status === "timeout") {
				console.log("timeout");
			}
			else {
				console.log(err);
			}
		},
		complete: function (request, status) {
			var result = "";
			try {
				var response = request.responseJSON;
				result = response.result;
				console.log("Result: " + result);
			}
			catch (err) {
				console.log(err);
			}
			if (callback !== null) {
				console.log(callback);
				callback(result);
			}
		}
	});
}


function sendGetRequestToRobot(endpoint, ip, callback) {

	var url = "http://" + ip + ":80/api/" + endpoint;

	if (endpoint.includes('help')) {

		if (callback) {
			getHelp(endpoint, ip, callback);;
		} else {
			getHelp(endpoint, ip);
		}
	}

	else {
		$.ajax({
			type: "GET",
			url: url,
			dataType: "json",
			async: true,
			timeout: 15000,
			success: function (data) {
				console.log(`GET Request to: ${endpoint}\n`, data);
			},
			error: function (request, status, err) {
				if (status === "timeout") {
					if ($("#connecting-animation")) {
						$("#connecting-animation").remove();
					}
					disableButtons();
				}
			},
			complete: function (request, status) {
				var result = "";
				if ($("#connecting-animation")) {
					$("#connecting-animation").remove();
				}
				try {

					var response = request.responseJSON;
					result = response.result;
				}
				catch (err) {
					$("#connect-to-robot").html("Connect").removeClass("active").removeClass("disabled");
					callback(status);
				}
				if (callback !== null) {
					callback(result);
				}
			}
		});
	}
}

function sendDeleteRequestToRobot(endpoint, ip, callback) {

	var url = "http://" + ip + ":80/api/" + endpoint;
	
	$.ajax({
		type: "DELETE",
		url: url,
		dataType: "json",
		async: true,
		timeout: 15000,
		success: function (data) {
			console.log(`DELETE Request to: ${endpoint}\n`, data);
		},
		error: function (request, status, err) {
			if (status === "timeout") {
				if ($("#connecting-animation")) {
					$("#connecting-animation").remove();
				}
				disableButtons();
			}
		},
		complete: function (request, status) {
			var result = "";
			if ($("#connecting-animation")) {
				$("#connecting-animation").remove();
			}
			try {

				var response = request.responseJSON;
				result = response.result;
			}
			catch (err) {
				$("#connect-to-robot").html("Connect").removeClass("active").removeClass("disabled");
				callback(status);
			}
			if (callback !== null) {
				callback(result);
			}
		}
	});
}