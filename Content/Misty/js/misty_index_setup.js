
var ip = "";
var ipAddress = "";
var lastIPReported = Date.now();
var instanceOfBrowseInMistyTabblockName;
//Alert to to tell users that the robot is not responding
var disconnectedAlert;
var abortScript = false;
var notImplemented = [];
var GetListOfImages = [];
var GetListOfAudioFiles = [];
var robotVersion = 2;
var connectingAnimation = '<svg id="connecting-animation" data-name="Layer 1" style="height: 50%; position: absolute; top: 20%; right: 30%; z-index:1000;" viewBox="0 0 1285 725">';
connectingAnimation += '<rect class="cls-1" x="382" y="335" width="95" height="95"/><rect class="cls-2" x= "596" y= "335" width= "95" height="95"/><rect class="cls-3" x= "797" y= "335" width= "95" height="95"/>';
connectingAnimation += '</svg>';

$(document).ready(function () {
	bindEvents();
	//var starterCommands = JSON.parse(robot.result);
	var starterCommands = robot.result;
	matchToolboxToRobotVersion();
	listOfImages.push(["No files", ""]);
	listOfAudioFiles.push(["No files", ""]);
	createAllCommands(starterCommands);
});

var options = {
	toolbox: toolbox,
	collapse: true,
	comments: true,
	disable: true,
	maxBlocks: Infinity,
	trashcan: true,
	horizontalLayout: false,
	toolboxPosition: "start",
	css: true,
	media: "Content/media/",
	rtl: false,
	scrollbars: true,
	sounds: true,
	oneBasedIndex: false,
	grid: {
		spacing: 20,
		length: 1,
		colour: "#888",
		snap: true
	},
	zoom: {
		controls: true,
		wheel: false,
		startScale: 1.0,
		maxScale: 3.0,
		minScale: 0.3,
		scaleSpeed: 1.2
	}
};

var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');
var workspace = Blockly.inject(blocklyDiv, options);

function bindEvents() {
	$("#connect-to-robot").unbind("click").on('click', addressChanged);
	$("#abort-script").on("click", abortFunction);
	$("#show-javascript").on('click', showJavaScript);
	$("#run-script").on('click', runJavaScript);
	$("#browse-files").unbind('click').on('click', openFilePicker);
	var toolbox = document.getElementById('toolbox');
}

function disableButtons() {
	$("#show-javascript").addClass("disabled");
	$("#browse-files").addClass("disabled");
	$("#export-session").addClass("disabled");
	$("#help").addClass("disabled");
}

function enableButtons() {
	$("#show-javascript").removeClass("disabled");
	$("#browse-files").removeClass("disabled");
	$("#export-session").removeClass("disabled");
	$("#help").removeClass("disabled");
}

function addressChanged(e) {
	//connect to robot, get capabilities
	e.preventDefault();
	e.stopPropagation();
	$("#connect-to-robot").html("Connecting...").addClass("active");
	var input = $("#ip-address").val();
	ip = validateIPAddress(input);
	if (ip !== "")
	{
		sendGetRequestToRobot("device", ip, function (data)
		{
			if (data === "timeout") {
				console.log("Timed out while trying to connect to robot");
				return;
			}
			let version = data.robotVersion;
			let versionArray = version.split(".");
			robotVersion = parseInt(versionArray[0]);

			matchToolboxToRobotVersion();

			try {
				updateToolboxBlocks(input);
			}
			catch (err) {
				console.log("Error updating toolbox blocks:" + err);
			}
		});	
	}
	else
	{
		showToastMessage("IP Address needs to be in the format of ###.###.###.### where ### is a number between 0-255.");
		$("#connect-to-robot").html("Connect").removeClass("active");
	}
}

function matchToolboxToRobotVersion()
{
	if (robotVersion === 1) {
		notImplemented = ["MoveHead", "RobotMode", "PerformTargetedUpdate", "GetCameraData", "TakePicture", "SlamGetDepthImage", "SlamGetVisibleImage", "GetDeviceInformation", "GetImage", "GetStringSensorValues", "GetSkills", "GetRunningSkills", "GetStoreUpdateAvailable", "GetWebsocketHelp", "GetWebsocketVersion", "GetVideoFile", "SaveSkillFiles", "ReloadSkills", "RunSkill", "CancelSkill", "TriggerSkillEvent", "SetWebsocketVersion", "StartRecordingVideo", "StopRecordingVideo", "GetLogFile", "RestartRobot", "MoveArm", "MoveArms"];
	} else {
		notImplemented = ["MoveHead", "RobotMode", "PerformTargetedUpdate", "GetCameraData", "TakePicture", "SlamGetDepthImage", "SlamGetVisibleImage", "GetDeviceInformation", "GetImage", "GetStringSensorValues", "GetSkills", "GetRunningSkills", "GetStoreUpdateAvailable", "GetWebsocketHelp", "GetWebsocketVersion", "GetVideoFile", "SaveSkillFiles", "ReloadSkills", "RunSkill", "CancelSkill", "TriggerSkillEvent", "SetWebsocketVersion", "StartRecordingVideo", "StopRecordingVideo", "GetLogFile", "RestartRobot"];
	}
}

function updateToolboxBlocks(input) {	
	var commands;
	$(connectingAnimation).prependTo('#blocklyDiv');
	sendGetRequestToRobot("help", ip, function (result) {
		if (result === "timeout") {
			showToastMessage("Robot does not seem to be responding.");
			startWorker();
		} else if (result === "error") {
			showToastMessage("This robot does not seem to be on line. Do you have the correct ip address?");
		}
		else {
			//commands = JSON.parse(result);
			commands = result;
			openWebsocket();
			startWorker();
			updateImageList(function () {
				updateAudioList(function () {
					createAllCommands(commands);
				});
			});
		}
	});
}

function validateIPAddress(input) {
	// right now we only except ip addresses.
	var ipNumbers = input.split('.');
	var ipNums = new Array(4);
	var ip = "";
	if (ipNumbers.length !== 4) {
		return "";
	}
	for (let i = 0; i < 4; i++) {
		ipNums[i] = parseInt(ipNumbers[i]);
		if (ipNums[i] < 0 || ipNums[i] > 255) {
			return "";
		}
	}
	ip = ipNums.join('.');
	return ip;
}

function openWebsocket() {

	const socket = new WebSocket('ws://' + ip + ':80/pubsub');
	var msg = {
		"#id": "1",
		"Operation": "subscribe",
		"Type": "SelfState",
		"DebounceMs": 1000,
		"EventName": "checkConnection",
		"Message": "",
		"ReturnProperty": "LocalIPAddress"
	};

	var message = JSON.stringify(msg);
	socket.onopen = function (event) {
		socket.send(message);
	};

	socket.onmessage = function (event) {
		var theDataObject = JSON.parse(event.data);
		ipAddress = theDataObject.message;
		lastIPReported = Date.now();
	};
}

async function workerFunction() {
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	while (true) {
		await sleep(5000);
		postMessage(true);
	}
}

function startWorker() {
	if (typeof Worker !== "undefined") {
		if (typeof worker === "undefined") {
			worker = new Worker(URL.createObjectURL(new Blob(["(" + workerFunction.toString() + ")()"], { type: 'text/javascript' })));
		}
		worker.onmessage = function (data) {
			var timeElapsed = Date.now() - lastIPReported;
			if (ipAddress === "") {
				$("#connect-to-robot").html("Connect").removeClass("disabled").addClass("active");
				showToastMessage("Attempting to re-establish connection with robot...");
				disableButtons();
				if (timeElapsed > 10000) {
					$("#connect-to-robot").html("Connect").removeClass("active");
					showToastMessage("Robot has stopped responding. You will need to connect again.");
					stopWorker();
				}
			} else {
				$("#connect-to-robot").html("Connected").addClass("disabled");
				enableButtons();
			}
			ipAddress = "";
		};
	}
}

function stopWorker() {
	if (worker) {
		worker.terminate();
	}
	worker = undefined;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function showToastMessage(message, timeInMs = 4000) {
	if (message) {
		var element = document.getElementById("toast");
		var snackbar = $('#toast').html(message);
		element.className = "show";
		await sleep(timeInMs);
		element.className = element.className.replace("show", "");
	}
}

function showJavaScript() {
	// Generate JavaScript code and display it.
	var code = Blockly.JavaScript.workspaceToCode(workspace);
	var textWindow = window.open("", "MsgWindow", "width=500, height=400");
	textWindow.document.body.innerHTML = "<div style=\"white-space:pre-wrap\">" + code + "</div>";
	console.log(code);
}	

function abortFunction() {
	abortScript = true;
	$("#run-script").toggleClass("run-abort");
	$("#abort-script").toggleClass("run-abort");
}

function highlightBlock(id) {
	workspace.highlightBlock(id);
}

function exportBlocklySession() {
	var name ="blockly.txt";
	var xml = Blockly.Xml.workspaceToDom(workspace);
	var text = Blockly.Xml.domToText(xml);
	if (text.length === 0) {
		window.alert("There is nothing to save");
		return;
	}
	download(name, text);
}

function importBlocklySession() {
	workspace.clear();
	var file = $("#selectedFile").files[0];
	var reader = new FileReader();
	reader.onload = function () {
		var text = reader.result;
		var xml = Blockly.Xml.textToDom(text);
		Blockly.Xml.domToWorkspace(xml, workspace);
	};
	reader.readAsText(file);
	$("#selectedFile").value = "";
}

function download(filename, text) {
	if (window.navigator.userAgent.indexOf("Edge") > -1) {
		var blob = new Blob([text], { type: "text/plain"});
		window.navigator.msSaveOrOpenBlob(blob, "blockly.txt");
	} else {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();
		document.body.removeChild(element);
	}
}

function restoreBlocklySession() {
	BlocklyStorage.restoreBlocks(workspace);
}

function updateAudioList(callback) {
	sendGetRequestToRobot("audio/list", ip, function (result) {
		listOfAudioFiles = [];
		if (result.status === "error" || result === "error") {
			listOfAudioFiles.push("Output not supported", "");
		} else if (!result.length) {
			listOfAudioFiles.push(["No files", ""]);
		} else {
			for (i = 0; i < result.length; i++) {
				var fileName = [result[i].name, result[i].name];
				listOfAudioFiles.push(fileName);
			}
		}
	});
	if (callback) {
		callback();
	}
}

function updateImageList(callback) {
	sendGetRequestToRobot("images/list", ip, function (result) {
		listOfImages = [];
		if (result.status === "error" || result === "error") {
			listOfImages.push(["Output not supported", ""]);
		} else if (!result.length) {
			listOfImages.push(["No files", ""]);
		} else {
			for (i = 0; i < result.length; i++) {
				var fileName = [result[i].name, result[i].name];
				listOfImages.push(fileName);
				if (!result[i].userAddedAsset) {
					SystemImageList.push(result[i].name);
				}
			}
		}
	});
	if (callback) {
		callback();
	}
}

var myInterpreter = null;
function runJavaScript(e) {
	e.preventDefault();
	disableButtons();
	$("#run-script").toggleClass("run-abort");
	$("#abort-script").toggleClass("run-abort");

	Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
	Blockly.JavaScript.addReservedWords('highlightBlock', 'sendGetRequestToRobotWrapper', 'sendPostRequestToRobotWrapper', 'sendDeleteRequestToRobotWrapper', 'sleep');
	var code = Blockly.JavaScript.workspaceToCode(workspace);

	var initFunc = function (interpreter, scope) {
		var sendGetRequestToRobotWrapper = interpreter.createAsyncFunction(function (endpoint, ip, callback) {
			return sendGetRequestToRobot(endpoint, ip, callback);
		});
		interpreter.setProperty(scope, 'sendGetRequestToRobot', sendGetRequestToRobotWrapper);

		var sendPostRequestToRobotWrapper = interpreter.createAsyncFunction(function (endpoint, ip, payload, callback) {
			return sendPostRequestToRobot(endpoint, ip, payload, callback);
		});
		interpreter.setProperty(scope, 'sendPostRequestToRobot', sendPostRequestToRobotWrapper);

		var sendDeleteRequestToRobotWrapper = interpreter.createAsyncFunction(function (endpoint, ip, callback) {
			return sendDeleteRequestToRobot(endpoint, ip, callback);
		});
		interpreter.setProperty(scope, 'sendDeleteRequestToRobot', sendDeleteRequestToRobotWrapper);

		var waitForMsWrapper = interpreter.createAsyncFunction(function (pauseDuration, callback) {
			return setTimeout(callback, pauseDuration);
		});	
		interpreter.setProperty(scope, 'waitForMs', waitForMsWrapper);

		var updateAudioListWrapper = interpreter.createNativeFunction(function () {
			return updateAudioList();
		});
		interpreter.setProperty(scope, 'updateAudioList', updateAudioListWrapper);

		var updateImageListWrapper = interpreter.createNativeFunction(function () {
			return updateImageList();
		});
		interpreter.setProperty(scope, 'updateImageList', updateImageListWrapper);

		var alertWrapper = interpreter.createNativeFunction(function (text) {
			return alert(text);
		});
		interpreter.setProperty(scope, 'alert', alertWrapper);

		var highlightBlockWrapper = interpreter.createNativeFunction(function (id) {
			id = id ? id.toString() : '';
			return interpreter.createPrimitive(highlightBlock(id));
		});
		interpreter.setProperty(scope, 'highlightBlock', highlightBlockWrapper);
	};
	myInterpreter = new Interpreter(code, initFunc);

	function nextStep() {
		if (abortScript) {
			alert("Script aborted");
			abortScript = false;
			enableButtons();
			return;
		}
		if (myInterpreter.step()) {
			window.setTimeout(nextStep, 20);
		}
		else {
			workspace.highlightBlock(null);
			enableButtons();
			abortScript = false;
			$("#run-script").toggleClass("run-abort");
			$("#abort-script").toggleClass("run-abort");		
		}
	}
	nextStep();

	//TODO: implement synchronous calls using code below...
	//if (myInterpreter.step() && myInterpreter.pa) {
	//	myInterpreter.pa = false;
	//}
}

function arrayContains(array, val2match) {
	if (array.length === 0) {
		return false;
	}
	else {
		for (var k = 0; k < array.length; k++) {
			if (array[k] === val2match) {
				return true;
			}
		}
		return false;
	}
}