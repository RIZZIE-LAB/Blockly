//#helper functions

//listOfFilesReadIn preserves information for all files selected
var listOfFilesReadIn = [];
//latestFileData preserves information for the last file selected
var latestFileData;
//instanceOfBrowseInMistyTabblockName keeps track of the id of the instance of the browse block currently created, but not placed in workspace yet


function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		Red: parseInt(result[1], 16),
		Green: parseInt(result[2], 16),
		Blue: parseInt(result[3], 16)
	} : null;
}

//first responder to the the Browse to file
function uploadBlocklyFile() {
	workspace.clear();
	var file = document.getElementById("fileSelected").files[0];
	var reader = new FileReader();
	reader.onload = function () {
		var text = reader.result;
		var xml = Blockly.Xml.textToDom(text);
		Blockly.Xml.domToWorkspace(xml, workspace);
	};
	reader.readAsText(file);
	document.getElementById("fileSelected").value = "";
}

function restoreBlocklySession() {
	BlocklyStorage.restoreBlocks(workspace);
}

function openFilePicker() {

	$("input#fileSelected").trigger("click");
}

function openImageFilePicker() {
	if (window.File && window.FileReader && window.FileList) {
		var labelBox = Blockly.selected.getField("FIELD_BrowseToImageFile_Boolean");
		if (labelBox) {
			$("input#image-file").trigger("click");
			labelBox.setValue("<filename>");
		} 
	}
	return false;
}

function openAudioFilePicker() {
	if (window.File && window.FileReader && window.FileList) {
		var labelBox = Blockly.selected.getField("FIELD_BrowseToAudioFile_Boolean");
		if (labelBox) {
			$("input#audio-file").trigger("click");
			labelBox.setValue("<filename>");
		}
	}
	return false;
}

function validateImageFile() {
	var file = $("input#image-file")[0].files[0];
	var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
	if (!allowedExtensions.exec(file.name)) {
		alert("Please upload file having extensions .jpeg/.jpg/.png/.gif only.");
		fileInput.value = "";
		return false;
	}
	if (file.size > 6291456) {
		showToastMessage("The file exceeds the maximum size of 6MB.");
		return;
	}
	uploadFile(file);
}

function validateAudioFile() {
	var file = $("input#audio-file")[0].files[0];
	var allowedExtensions = /(\.wav|\.mp3|\.wma|\.aac|\.ogg)$/i;
	if (!allowedExtensions.exec(file.name)) {
		alert("Please upload file having extensions .wav/.mp3/.wma/.aac/.ogg only.");
		file.value = "";
		return false;
	}
	if (file.size > 6291456) {
		showToastMessage("The file exceeds the maximum size of 6MB.");
		return;
	}
	uploadFile(file);
}

function uploadFile(file) {

	var block = Blockly.selected;

	if (file.helpUrl === "Image File") {
		var image = new Image();
		image.blockid = block.id;
		let height = this.height;
		let width = this.width;

		let fileName = file.name;
		let filereader = new FileReader();
		filereader.onload = function (evt) {

			let Uint8View = new Uint8Array(evt.target.result);
			let uploadableFile = {
				"blockId": block.id,
				"FileName": fileName,
				"Data": arrayBufferToBase64(evt.target.result),//Uint8View.toString(),
				"Width": width,
				"Height": height,
				"ImmediatelyApply": true,
				"OverwriteExisting": true
			};
			$("input#image-file").value = null;
			listOfFilesReadIn.push(uploadableFile);
			block.setFieldValue(block.id, "FIELD_BrowseToFile_Data");
			updateFileBlockText(block, file);
		};
		fr.readAsArrayBuffer(file);
		fr.onerror = fileLoadErrorHandler;
	} else {

		let filereader = new FileReader();
		filereader.onload = function (evt) {
			let Uint8View = new Uint8Array(evt.target.result);
			let fileName = file.name;
			let uploadableFile = {
				"blockId": block.id,
				"FileName": file.name,
				"Data": arrayBufferToBase64(evt.target.result),//Uint8View.toString(),
				"ImmediatelyApply": true,
				"OverwriteExisting": true
			};
			$("input#audio-file").value = null;
			listOfFilesReadIn.push(uploadableFile);
			block.setFieldValue(block.id, "FIELD_BrowseToFile_Data");
			updateFileBlockText(block, file);
		};
		filereader.readAsArrayBuffer(file);
		filereader.onerror = fileLoadErrorHandler;
	}
}

function arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}

//used with the Browse to file block for when file loading fails
function fileLoadErrorHandler(evt) {
	if (evt.target.error.name === "NotReadableError") {
		alert("Cannot read file");
	}
	else {
		alert("File load error");
	}
}

//indicate file selected to user
function updateFileBlockText(block, file) {
	var checkBox = file.type.includes("image") ? block.getField("FIELD_BrowseToImageFile_Boolean") : block.getField("FIELD_BrowseToAudioFile_Boolean");
	var labelBox = block.getField("FIELD_BrowseToFile_Data");
	var value = block.getFieldValue("FIELD_BrowseToFile_Data");
	if (file.value === "") {
		labelBox.setValue("invalid file");
	}
	if (file.size > 6291456) {
		labelBox.setValue("file too large (>6mb)");
	} else {
		checkBox.setValue(true);
		labelBox.setValue(file.name);
	}
}

function fileSelectionCanceled() {
	console.log("fileSelectionCanceled");
	var labelBox = Blockly.selected.getField("FIELD_BrowseToFile_Data");
	labelBox.setValue("<filename>");
}