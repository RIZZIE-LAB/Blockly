function blocklyTypes(value, min, max) {
	return {
		"String": new Blockly.FieldTextInput("     "),
		"Int32": new Blockly.FieldNumber(value, min, max, 1),
		"Double": new Blockly.FieldNumber(value, min, max, .001),
		"Single": new Blockly.FieldNumber(value, min, max, .001),
		"Byte": new Blockly.FieldColour("#ff0000"),
		"Boolean": new Blockly.FieldCheckbox(value),
	};
}
var listOfImages = [];
var listOfAudioFiles = [];
var SystemImageList = [];
var today = new Date().toJSON().slice().replace(/-/g, '/');
var hardCodedCommands = {
	"AudioListDropdown": null,
	"BrowseToAudioFile": null,
	"BrowseToImageFile": null,
	"DisplayImage": {
		"RelatedCommand": "GetImageList",
		"Category": "Assets",
		"RelatedEndpoint": "images"
	},
	"ChangeLED": null,
	"DeleteAudioAsset": {
		"RelatedCommand": "GetAudioList",
		"Category": "Assets",
		"RelatedEndpoint": "audio"
	},
	"DeleteImageAsset": {
		"RelatedCommand": "GetImageList",
		"Category": "Assets",
		"RelatedEndpoint": "images"
	},
	"DriveTime": null,
	"GetAudioList": null,
	"GetImageList": null,
	"GetLogFile": null,
	"ImageListDropdown": null,
	"MoveArm": null,
	"MoveHead": null,
	"MoveHead2": null,
	"Pause": null,
	"PlayAudioClip": {
		"RelatedCommand": "GetAudioList",
		"Category": "Assets",
		"RelatedEndpoint": "audio"
	},
	"SaveAudio": {
		"RelatedCommand": "GetAudioList",
		"Category": "Assets",
		"RelatedEndpoint": "audio"
	},
	"SaveImage": {
		"RelatedCommand": "GetImageList",
		"Category": "Assets",
		"RelatedEndpoint": "images"
	},
	"GetSlamPath": null
};

//Process commands from robot

function createAllCommands(commands) {	

	let implementedCommands = [];

	implementedCommands.push({ "Category": "Assets", "Name": "BrowseToImageFile", "Endpoint": null, "Arguments": [], "CommandCategory": "Current" });
	implementedCommands.push({ "Category": "Assets", "Name": "BrowseToAudioFile", "Endpoint": null, "Arguments": [], "CommandCategory": "Current" });
	implementedCommands.push({ "Category": "Movement", "Name": "PauseCode", "Endpoint": null, "Arguments": [], "CommandCategory": "Current" });
	if (ip !== "") {
		if (robotVersion === 1) {
			implementedCommands.push({ "Category": "Movement", "Name": "MoveHead", "Endpoint": "head", "Arguments": [], "CommandCategory": "Current" });
		} else {
			implementedCommands.push({ "Category": "Movement", "Name": "MoveHead2", "Endpoint": "head", "Arguments": [], "CommandCategory": "Current" });
		}
	}

	constructCommandObjects(commands, handleResult);

	function handleResult(commandObjects) {
		for (object = 0; object < commandObjects.length; object++) {
			implementedCommands.push(commandObjects[object]);
		}
		enableButtons();
		constructCategories(implementedCommands);
	}
}

//Create command objects with the details needed to create blockly blocks
function constructCommandObjects(commands, callback) {

	var commandsByRequestType = {
		"POST": commands.post,
		"DELETE": commands.delete,
		"PUT": commands.put,
		"GET": commands.get,
	};
	var commandObjects = [];

	for (var key in commandsByRequestType) {
		var sublist = commandsByRequestType[key];
		for (var x = 0; x < sublist.length; x++) {
			let thisCommand = sublist[x];
			if (!notImplemented.includes(thisCommand.baseApiCommand) && thisCommand.apiCommand.category != "Alpha" && thisCommand.apiCommand.category != "Beta") {
				let commandObject = {
					"Category": thisCommand.apiCommand.apiCommandGroup,
					"Name": thisCommand.apiCommand.name,
					"Endpoint": thisCommand.endpoint,
					"Arguments": thisCommand.apiCommand.arguments,
					"CommandCategory": thisCommand.apiCommand.category,
					"RequestType": key
				};
				commandObjects.push(commandObject);
			}
		}
	}
	parseArguments(commandObjects, callback);
}

function parseArguments(commandObjects, callback) {
	commandObjects.forEach(function (command) {
		if (command.Arguments) {
			var commandArguments = command.Arguments;
			var argNames = Object.keys(commandArguments);
			var argArray = Array.from(argNames, x => commandArguments[x]);
			var args = [];
			argArray.forEach(function (arg) {
				let type = "";
				var bTypes = Object.keys(blocklyTypes(0,0,0));
				for (i=0; i < bTypes.length; i++) {
					if (arg["getValueType"].indexOf(bTypes[i]) > -1)
					{
						type = bTypes[i];
						break;
					}
				};
				arg["getValueType"].substring(arg["getValueType"].lastIndexOf("System.") + 7, arg["getValueType"].indexOf(","));
				let argument = {
					"Name": arg.name,
					"Type": type,
					"Value": arg.Value
				};
				args.push(argument);
			});
			command.Arguments = args;
		}
	});
	callback(commandObjects);
}

//Create an array of categories, each containing an array of its commands
function constructCategories(commandObjects) {
	var commandGroupOfEachCommand = commandObjects.map(x => x.Category);
	var commandGroups = [];
	var categoryArray = [];

	for (const key of commandGroupOfEachCommand) {
		if (!commandGroups[key]) {
			commandGroups[key] = new Array;
			categoryArray.push(key);
		}
	}

	for (var i = 0; i < categoryArray.length; i++) {
		for (var j = 0; j < commandObjects.length; j++) {
			commandObjects[j].Category === categoryArray[i] ? commandGroups[categoryArray[i]].push(commandObjects[j]) : null;
		}
	}
	updateMistyBlocks(commandGroups, categoryArray);
}

//Add tabs and blocks to blockly toolbox
function updateMistyBlocks(commandGroups, categories) {
	var colours = ["#339933", "#FBBD0B", "#D11149", "#4285F4", "#990099", "#9966FF", "#F17105", "#1A8FE3", "#6B09EE"];
	var blocklyColours = [153, 45, 344, 218, 344, 260, 28, 206, 266];

	while (toolbox.childNodes[7]) {
		toolbox.removeChild(toolbox.childNodes[7]);
	}
	for (var i = 0; i < categories.length; i++) {
		var categoryTab = document.createElement("category");
		categoryTab.setAttribute("name", categories[i]);
		categoryTab.setAttribute("colour", colours[i]);

		let commandGroup = commandGroups[categories[i]];
		for (var j = 0; j < commandGroup.length; j++) {
			addBlock(commandGroup[j], categoryTab, blocklyColours[i]);
		}
		toolbox.appendChild(categoryTab);
	}
	workspace.updateToolbox(toolbox);
}

function addBlock(commandObject, categoryTab, colour) {
	var legacyCommands = Object.keys(hardCodedCommands);
	var blockName = commandObject.Name;
	var endpoint = commandObject.Endpoint;
	var commandCategory = commandObject.CommandCategory;
	var requestType = commandObject.RequestType;
	var args = commandObject.Arguments;
	var newBlock = document.createElement("block");

	newBlock.setAttribute("type", blockName);
	newBlock.setAttribute("disabled", false);
	categoryTab.appendChild(newBlock);

	if (!arrayContains(legacyCommands, blockName)) {
		Blockly.Blocks[blockName] = {
			init: function () {
				this.setColour(colour);
				var dummy = this.appendDummyInput();
				dummy.appendField(blockName);

				for (var k = 0; k < args.length; k++) {
					let fieldValue = "FIELD_" + blockName + "_" + args[k].Name;
					let fieldTypes = blocklyTypes(args[k].Value, -100, 100);
					let fieldType = fieldTypes[args[k].Type];
					if (args[k].Type === "String") {
						dummy.appendField(new Blockly.FieldTextInput(args[k].Name), fieldValue);
					} else {
						dummy.appendField(args[k].Name);
						dummy.appendField(fieldType, fieldValue);
					}
				}
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setOutput(false);
				this.setTooltip(blockName);
			}
		};
		Blockly.JavaScript[blockName] = function (block) {
			const payload = {};
			for (const arg of args) {
				var input = block.getFieldValue("FIELD_" + blockName + "_" + arg.Name);
				payload[arg.Name] = parseInt(input) ? parseInt(input) : input;
			}
			var code;
			if (requestType === "GET") {
				if (!payload["Command"] || payload["Command"] === "Command") {
					code = "sendGetRequestToRobot(\"" + endpoint + "\",\"" + ip + "\");";
				} else {
					newEndpoint = "help?command=" + payload["Command"].toLowerCase();
					code = "sendGetRequestToRobot(\"" + newEndpoint + "\",\"" + ip + "\");";
				}
			} else {
				code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
			}
			return code;
		};
	} else {
		legacyBlocks(commandObject, blockName, newBlock, args, colour, endpoint);
	}
}

//#hardCoded Blocks
function legacyBlocks(block, blockName, newBlock, args, colour, endpoint) {
	let fieldValue = "FIELD_" + blockName;
	switch (blockName) {
		case "ChangeLED":
			args = ["Red", "Green", "Blue"];
			Blockly.Blocks["ChangeLED"] = {
				init: function () {
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("Change the LED color to")
						.appendField(new Blockly.FieldColour("#FF0000"), fieldValue);
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setOutput(false);
					this.setTooltip("ChangeLED");
				}
			};
			Blockly.JavaScript["ChangeLED"] = function (block) {
				const payload = {};
				for (var arg of args) {
					var input = block.getFieldValue("FIELD_ChangeLED");
					payload[arg] = hexToRgb(input)[arg];
				}			
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "GetImageList":
			Blockly.Blocks[blockName] = {
				init: function () {
					updateImageList();
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("List of files available:")
						.appendField(new Blockly.FieldDropdown(listOfImages), fieldValue);
					this.setPreviousStatement(false, null);
					this.setNextStatement(false, null);
					this.setOutput(true);
					this.setTooltip(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
			};
			break;
		case "GetAudioList":
			Blockly.Blocks[blockName] = {
				init: function () {
					updateAudioList();
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("List of files available:")
						.appendField(new Blockly.FieldDropdown(listOfAudioFiles), fieldValue);
					this.setPreviousStatement(false, null);
					this.setNextStatement(false, null);
					this.setOutput(true);
					this.setTooltip(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
			};
			break;
		case "GetLogFile":
			Blockly.Blocks[blockName] = {
				init: function () {
					updateImageList();
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("Get log file for date: ")
						.appendField(new Blockly.FieldTextInput("YYYY/MM/DD"), "FIELD_GetLogFile_Date");
					this.setPreviousStatement(false, null);
					this.setNextStatement(false, null);
					this.setOutput(true);
					this.setTooltip(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
				const payload = {};
				var arg = args[0].Name;
				var input = block.getFieldValue("FIELD_GetLogFile_Date");
				var code = "sendGetRequestToRobot(\"" + endpoint + "?date=" + input + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "DisplayImage":
			Blockly.Blocks[blockName] = {
				init: function () {
					this.setColour(colour);
					let valueInput = this.appendValueInput(fieldValue);
					let check = "FIELD_" + hardCodedCommands[blockName].RelatedCommand;
					valueInput.setCheck(check)
                        .setAlign(Blockly.ALIGN_RIGHT)
                        .appendField(blockName);
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip(blockName);
					this.setHelpUrl(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
				var payload = {
					"FileName": block.childBlocks_[0].inputList[0].fieldRow[1].value_
				};
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "PlayAudioClip":
			Blockly.Blocks[blockName] = {
				init: function () {
					this.setColour(colour);
					let valueInput = this.appendValueInput(fieldValue);
					let check = "FIELD_" + hardCodedCommands[blockName].RelatedCommand;
                    valueInput.setCheck(check)
                        .setAlign(Blockly.ALIGN_RIGHT)
                        .appendField(blockName)
                        .appendField("at volume (0-100): ")
                        .appendField(new Blockly.FieldNumber(100, 0, 100, 1), "FIELD_PlayAudioClip_Volume");
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip(blockName);
					this.setHelpUrl(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
				var payload = {
					"AssetId": block.childBlocks_[0].inputList[0].fieldRow[1].value_,
					"Volume": parseFloat(block.getFieldValue("FIELD_PlayAudioClip_Volume"))
				};
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "DeleteImageAsset":
			Blockly.Blocks[blockName] = {
				init: function () {
					this.setColour(colour);
					let valueInput = this.appendValueInput(fieldValue);
					let check = "FIELD_" + hardCodedCommands[blockName].RelatedCommand;
					valueInput.setCheck(check)
						.setAlign(Blockly.ALIGN_RIGHT)
						.appendField(blockName);
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip(blockName);
					this.setHelpUrl(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
				let payload = {};
				var arg = args[0].Name;
				var input = block.childBlocks_[0].inputList[0].fieldRow[1].value_;
				payload[arg] = input;
				if (SystemImageList.includes(input)) {
					showToastMessage("Sorry, this appears to be a system file. Only user added files can be deleted!");
					return;
				}
				else {
					var code = "sendDeleteRequestToRobot(\"" + endpoint + "?FileName="+ encodeURI(input) + "\",\"" + ip + "\");";
					return code;
				}			
			};
			break;
		case "DeleteAudio":
			Blockly.Blocks[blockName] = {
				init: function () {
					this.setColour(colour);
					let valueInput = this.appendValueInput(fieldValue);
					let check = "FIELD_" + hardCodedCommands[blockName].RelatedCommand;
					valueInput.setCheck(check)
						.setAlign(Blockly.ALIGN_RIGHT)
						.appendField(blockName);
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip(blockName);
					this.setHelpUrl(blockName);
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
				const payload = {};
				var arg = args[0].Name;
				var input = block.childBlocks_[0].inputList[0].fieldRow[1].value_;
				payload[arg] = input;
				if (!input.includes(".")) {
					showToastMessage("Sorry, this appears to be a system file. Only user added files can be deleted!");
					return;
				}
				else {
					var code = "sendDeleteRequestToRobot(\"" + endpoint + "?FileName="+ encodeURI(input) + "\",\"" + ip + "\");";
					return code;
				}
			};
			break;
		case "DriveTime":
			var fieldValues = [];
			for (var z = 0; z < args.length; z++) {
				fieldValues.push(fieldValue + "_" + args[z].Name);
			}
			Blockly.Blocks["DriveTime"] = {
				init: function () {
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("Move ")
						.appendField(new Blockly.FieldDropdown([["Forward", "F"], ["Backward", "B"], ["Left", "L"], ["Right", "R"]]), "FIELD_DriveTime_Direction")
						.appendField("at a speed of")
						.appendField(new Blockly.FieldNumber(25, 0, 100, 1), "FIELD_DriveTime_Velocity")
						.appendField("(0 to 100) for a duration of")
						.appendField(new Blockly.FieldNumber(500, 100, 10000, 100), "FIELD_DriveTime_TimeMs")
						.appendField("ms");
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip("DriveTime");
					this.setHelpUrl("DriveTime");
				}
			};
			Blockly.JavaScript["DriveTime"] = function (block) {
				var direction = block.getFieldValue("FIELD_DriveTime_Direction");
				var velocity = parseInt(block.getFieldValue("FIELD_DriveTime_Velocity"));
				var time = parseInt(block.getFieldValue("FIELD_DriveTime_TimeMs"));
				var payload = null;
				var angularVelocity = direction === "L" || direction === "R" ? (direction === "L" ? velocity : -velocity) : 0;
				var linearVelocity = angularVelocity === 0 ? (direction === "F" ? velocity : -velocity) : 0;
				payload = {
					"LinearVelocity": linearVelocity,	//-100 - 100
					"AngularVelocity": angularVelocity,				//-100 - 100
					"TimeMs": time						//Milliseconds
				};
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "PauseCode":
			Blockly.Blocks["PauseCode"] = {
				init: function () {
					this.appendDummyInput()
						.appendField("Pause for a duration of")
						.appendField(new Blockly.FieldNumber(500, 100, 10000, 100), "FIELD_PauseCode_Duration")
						.appendField("ms");
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setColour(colour);
					this.setTooltip("PauseCode");
					this.setHelpUrl("PauseCode");
				}
			};

			Blockly.JavaScript["PauseCode"] = function (block) {
				var pauseDuration = Number(block.getFieldValue("FIELD_PauseCode_Duration"));
				var code = "waitForMs(" + pauseDuration + ");\n";
				return code;
			};
			break;
		case "GetSlamPath":
			Blockly.Blocks[blockName] = {
				init: function () {
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("ALPHA - " + blockName)
						.appendField(new Blockly.FieldNumber(0, 0, null, 1), "X")
						.appendField(new Blockly.FieldNumber(0, 0, null, 1), "Y");
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip(blockName);
					this.setHelpUrl(blockName);
				}
			};
			Blockly.JavaScript["GetSlamPath"] = function (block) {
				var payload = {
					"X": parseInt(block.getFieldValue("X")),
					"Y": parseInt(block.getFieldValue("Y"))
				};
				var code = "sendPostRequestToRobot(\"SlamGetPath\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "MoveHead":
			Blockly.Blocks["MoveHead"] = {
				init: function () {
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("Move head")
						.appendField(new Blockly.FieldDropdown([["Up", "U"], ["Down", "D"]]), "FIELD_MoveHead_Pitch")
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip("MoveHead");
					this.setHelpUrl("MoveHead");
				}
			};
			Blockly.JavaScript["MoveHead"] = function (block) {
				var pitch = block.getFieldValue("FIELD_MoveHead_Pitch") === "D" ? 5 : -5;
				var velocity = parseInt(block.getFieldValue("FIELD_MoveHead_Velocity"));
				var payload = null;
				payload = {
					"Pitch": pitch,		//-5 - 5
					"Yaw": 0,											
					"Roll": 0,
					"Units": "position" 
				};
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "MoveHead2":
			Blockly.Blocks["MoveHead2"] = {
				init: function () {
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("Move head")
						.appendField("Pitch (-40 to 25):")
						.appendField(new Blockly.FieldNumber(0, -40, 25, 1), "FIELD_MoveHead_Pitch")
						.appendField("Roll (-42 to 42):")
						.appendField(new Blockly.FieldNumber(0, -42, 42, 1), "FIELD_MoveHead_Roll")
						.appendField("Yaw (-90 to 90):")
						.appendField(new Blockly.FieldNumber(0, -90, 90, 1), "FIELD_MoveHead_Yaw")
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip("MoveHead");
					this.setHelpUrl("MoveHead");
				}
			};
			Blockly.JavaScript["MoveHead2"] = function (block) {
				var pitch = block.getFieldValue("FIELD_MoveHead_Pitch");
				var roll = block.getFieldValue("FIELD_MoveHead_Roll");
				var yaw = block.getFieldValue("FIELD_MoveHead_Yaw");
				var velocity = parseInt(block.getFieldValue("FIELD_MoveHead_Velocity"));
				var payload = null;
				payload = {
					"Pitch": pitch,
					"Yaw": yaw,
					"Roll": roll,
					"Units": "degrees" 
				};
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "MoveArm":
			Blockly.Blocks["MoveArm"] = {
				init: function () {
					this.setColour(colour);
					this.appendDummyInput()
						.appendField("Move ")
						.appendField(new Blockly.FieldDropdown([["Right", "Right"], ["Left", "Left"]]), "FIELD_MoveArm_Arm")
						.appendField("arm to position")
						.appendField(new Blockly.FieldNumber(0, 0, 10, 1), "FIELD_MoveArm_Position")
						.appendField("at a speed of")
						.appendField(new Blockly.FieldNumber(5, 0, 100, 1), "FIELD_MoveArm_Velocity");
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip("MoveArm");
					this.setHelpUrl("MoveArm");
				}
			};
			Blockly.JavaScript["MoveArm"] = function (block) {
				var arm = block.getFieldValue("FIELD_MoveArm_Arm") === "Right" ? "Right" : "Left";
				var position = parseInt(block.getFieldValue("FIELD_MoveArm_Position"));
				var velocity = parseInt(block.getFieldValue("FIELD_MoveArm_Velocity"));
				var payload = null;
				payload = {
					"Arm": arm,		//0 - 10
					"Position": position,
					"Velocity": velocity,   //0 - 100
					"Units": "Position"
				};
				var code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";
				return code;
			};
			break;
		case "BrowseToImageFile":
		case "BrowseToAudioFile":
			Blockly.Blocks[blockName] = {
				init: function () {
					this.setColour(colour);
					var dummy = this.appendDummyInput("")
						.setAlign(Blockly.ALIGN_RIGHT);
					if (blockName === "BrowseToImageFile") {
						dummy.appendField(new Blockly.FieldCheckbox(false, openImageFilePicker), "FIELD_BrowseToImageFile_Boolean");
					} else {
						dummy.appendField(new Blockly.FieldCheckbox(false, openAudioFilePicker), "FIELD_BrowseToAudioFile_Boolean");
					}
					dummy.appendField(blockName)
						.appendField(new Blockly.FieldLabel(""), "FIELD_BrowseToFile_Data");
					this.setOutput(true, blockName);
					this.setColour(colour);
					this.setTooltip("Checkbox to browse");
					var name = newBlock;
					if (blockName === "BrowseToImageFile") {
						this.setHelpUrl("Image File");
					} else {
						this.setHelpUrl("Audio File");
					}
				}
			};
			break;
		case "SaveAudio":
		case "SaveImage":
		case "SaveAsset":
			Blockly.Blocks[blockName] = {
				init: function () {
					var typeOfFile = "";
					this.setColour(colour);
					var valueInput = this.appendValueInput(fieldValue);
					if (blockName === "SaveImage") {
						typeOfFile = "image";
						valueInput.setCheck("BrowseToImageFile");
					} else {
						typeOfFile = "audio";
						valueInput.setCheck("BrowseToAudioFile");
					}
					valueInput.setAlign(Blockly.ALIGN_RIGHT)
						.appendField("Save " + typeOfFile + " file to robot");
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
					this.setTooltip("Save " + typeOfFile + " file to robot");
					this.setHelpUrl("SaveFileToRobot");
				}
			};
			Blockly.JavaScript[blockName] = function (block) {
				var code;
				var input = block.childBlocks_[0]["id"];
				var payload = {};
				for (u = 0; u < listOfFilesReadIn.length; u++) {
					var browseBlockIdOfFile = listOfFilesReadIn[u].blockId;
					if (input === browseBlockIdOfFile) {
						payload = listOfFilesReadIn[u];
						payload["ImmediatelyApply"] = false;
					}
				}
				code = "sendPostRequestToRobot(\"" + endpoint + "\",\"" + ip + "\"," + JSON.stringify(payload) + ");";	
				return code;
			};
			break;
	}
}