var imageUploaded = 0;
var percentComplete = 0;
var showError = false;
var textresult = "";

	function processPhoto(base64Photo, filename)
	{
		//We will use that later to handle the upload, do not delete that
		//2 parallel request, one to ask photo, other to upload on database
		/*var uploadfiles = document.querySelector('#imageuploader');
		var file = uploadfiles.files[0];
		file.name = filename;
		showError = false;
		
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        xhr.open("POST", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // Every thing ok, file uploaded
                console.log(xhr.responseText); // handle response.
				imageUploaded = 1;
				textresult = "HOLAAA!"
            }
			else if(xhr.status == 404 && showError == false)
			{
				showError = true;
				alert("Uploaded file is wrong format or size!");
			}
        };
		
		xhr.upload.addEventListener("progress", updateProgress, false);
		xhr.addEventListener("error", transferFailed, false);			
		
        fd.append('upload_file', file);
		fd.append('name', filename);
        xhr.send(fd);	
		*/
		
		AnalyzeImage(base64Photo);

		// imageUploaded = 1;
		// textresult = "You are handsome!"
		// percentComplete = 0;
		// showError = false;
	}

	
	function updateProgress (oEvent) {
	  if (oEvent.lengthComputable) {
		percentComplete = (oEvent.loaded / oEvent.total) * 100;
		console.log("Uploading: " + percentComplete)
	  } else {
		// Unable to compute progress information since the total size is unknown
	  }
	}

	function transferFailed(evt) 
	{
		imageUploaded = false;
		alert("Sorry, we have encountered a problem during image upload :( Please try again (did you check your internet connection?)");
		xhr.abort();
	}


	function AnalyzeImage(base64data) { //EY!!! using FORMDATA version sourceImageURL == formData
		// Request parameters.
		var params = {
			"visualFeatures": "Categories,Description,Faces,ImageType,Adult",
			"details": "",
			"language": "en",
		};
		
		// Perform the REST API call.
		jQuery.ajax({
			url: common.uriBasePreRegion + "westeurope" +
				//  $("#subscriptionRegionSelect").val() + 
				 common.uriBasePostRegion + 
				 common.uriBaseAnalyze +
				 "?" + 
				 $.param(params),
			processData: false,
			contentType: false,         
			// Request headers.
			beforeSend: function(jqXHR){
				// jqXHR.setRequestHeader("Content-Type","application/json"); //ORIGINAL
				jqXHR.setRequestHeader("Content-Type","application/octet-stream");
				jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", 
					// encodeURIComponent($("#subscriptionKeyInput").val())); //ORIGINAL
					encodeURIComponent("41e04f3666d346c4a8b20a8222925598"));
			},
			
			type: "POST",
			
			// Request body.
			// data: '{"url": ' + '"' + sourceImageUrl + '"}',
			 data: makeblob(base64data)  ,
		})
	
		
		.done(function(data) {
			debugger;
			imageUploaded = 1;
			textresult = makeHuman(data);
			percentComplete = 100;
			showError = false;
			
		})
		
		.fail(function(jqXHR, textStatus, errorThrown) {

			textresult = errorThrown;
			showError = true;
			imageUploaded = 1;

			// // Prepare the error string.
			// var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
			// errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ? 
			// 	jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
			
			// // Put the error JSON in the response textarea.
			// responseTextArea.val(JSON.stringify(jqXHR, null, 2));
			
			// // Show the error message.
			// alert(errorString);
		});
	}


makeblob = function (dataURL) {
            var BASE64_MARKER = ';base64,';
            if (dataURL.indexOf(BASE64_MARKER) == -1) {
                var parts = dataURL.split(',');
                var contentType = parts[0].split(':')[1];
                var raw = decodeURIComponent(parts[1]);
                return new Blob([raw], { type: contentType });
            }
            var parts = dataURL.split(BASE64_MARKER);
            var contentType = parts[0].split(':')[1];
            var raw = window.atob(parts[1]);
            var rawLength = raw.length;

            var uInt8Array = new Uint8Array(rawLength);

            for (var i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            return new Blob([uInt8Array], { type: contentType });
        }

makeHuman = function(jsonResponse)
{
	var str_humanResponse = "";
	//Microsoft response
	// jsonResponse.description.captions.forEach(caption => {
	// 	str_humanResponse += caption.text + ".";
	// });

	str_humanResponse += imageType(jsonResponse.imageType);
	str_humanResponse += adultContent(jsonResponse.adult);
	// str_humanResponse +=

	console.log(str_humanResponse);
	return str_humanResponse;
}

makeSentence = function(subject,negativeVerb,verb,directObj,adjetive,adverb)
{
	return subject + " " + negativeVerb + " " + verb +" " + adjetive + " " + directObj + " " + adverb + "."; 
}

//use binary for negative particle of verb
adverbFromConfidence = function(binary, confidence,thridpersonSingular)
{
	if(binary)
	{
		if(confidence >=0.45)
		{
			return "";
		} // 60%
		else
		{
			if(thridpersonSingular)
			{
				return "does not";
			}
			else
			{
				return "do not";
			}
		}
	}

	else
	{
		if(confidence < 0.45)
		{
			return "not quite sure";
		}

		else if(confidence < 0.65)
		{
			return "quite sure";
		}

		else
		{
			return "actually sure";
		}

	}
}


imageType = function (imageType)
{
	var subject = "This image";
	var verb = "is";

	var directObj = chooseOneImageType(imageType);
	return makeSentence(subject,"",verb,directObj,"","");
}

chooseOneImageType = function(imageType)
{
	if(imageType.clipArtType > 0.85 && imageType.lineDrawingType < 0.85)
	{ return "clip art";}

	if(imageType.clipArtType < 0.85 && imageType.lineDrawingType > 0.85)
	{ return "line drawing";}

	if(imageType.clipArtType < 0.85 && imageType.lineDrawingType < 0.85)
	{ return "photo";}
}

adultContent = function(adult)
{
	var result = "";
	var subject = "The content of this image";
	var verb = "is";

	if(adult.isAdultContent)
		result += makeSentence(subject,"",verb,"adult content","",adverbFromConfidence(false,adult.adultScore,true));
	if(adult.isRacyContent)
		result += makeSentence(subject,"",verb,"racy content","",adverbFromConfidence(false,adult.racyScore,true))
	return result;
}

//////COMMON LIBRARY ----------
	var common = (function()
	{
		"use strict";
		
		/////////////
		// Variables.
		/////////////
		
		// The array of navigation links. These will be modified when the subscription key information changes.
		var navigationArray;
		
		var uriBasePreRegion = "https://";
		var uriBasePostRegion = ".api.cognitive.microsoft.com/vision/";
		var uriBaseAnalyze = "v1.0/analyze";
		var uriBaseLandmark = "v1.0/models/landmarks/analyze";
		var uriBaseCelebrities = "v1.0/models/celebrities/analyze";
		var uriBaseThumbnail = "v1.0/generateThumbnail";
		var uriBaseOcr = "v1.0/ocr";
		var uriBaseHandwriting = "v1.0/recognizeText";
	
		
		var subscriptionChange = function()
		{
			// Build parameter string.
			var paramString = "?subscriptionKey=" + 
				encodeURIComponent(document.getElementById("subscriptionKeyInput").value) + "&subscriptionRegion=" + encodeURIComponent(document.getElementById("subscriptionRegionSelect").value);
			
			// Update navagation links with new parameters.
			for (var i = 0; i < navigationArray.length; ++i)
			{
				// Get the URL from the navigation array.
				var urlString = navigationArray[i].href;
			
				// Check for existing URL parameters.
				var pos = urlString.indexOf("?");
				if (pos === -1)
				{
					// No URL parameters are attached to the navigation URLs.
					navigationArray[i].href = urlString + paramString;
				}
				else
				{
					// Trim off the existing URL parameters before adding the current parameters.
					navigationArray[i].href = urlString.substring(0, pos) + paramString
				}
			}
		};
	
		// Returns the value of the specified URL parameter.
		
		var getQueryVariable = function(paramaterName) 
		{
			// Get the URL parameters.
			var query = window.location.search.substring(1);
			
			// Split the parameters into a string array.
			var vars = query.split("&");
			
			// Parse the string array and return the value of the specified parameter.
			for (var i = 0; i < vars.length; ++i) 
			{
				var pair = vars[i].split("=");
				
				if (pair[0] === paramaterName)
				{
					// Return the value.
					return pair[1];
				}
			}
			
			// If the parameter wasn't found, return false.
			return(false);
		}
	
		
		// Displays an error when an image does not load.
		
		var imageLoadError = function()
		{
			$("#responseTextArea").val("Image load error.");
		}
		
		
		// Initializes the page.
		
		var init = function()
		{
			// Initialize the array of navigation links. 
			navigationArray = [
				document.getElementById("analyzeLink"),
				document.getElementById("analyzeLink"),
				document.getElementById("landmarkLink"),
				document.getElementById("celebritiesLink"),
				document.getElementById("thumbnailLink"),
				document.getElementById("ocrLink"),
				document.getElementById("handwritingLink")
			];
			
			// Extract URL parameters into the subscription key elements.
			var subKey = getQueryVariable("subscriptionKey");
			if (subKey)
			{
				document.getElementById("subscriptionKeyInput").value = decodeURIComponent(subKey);
			}
			
			subKey = getQueryVariable("subscriptionRegion");
			if (subKey)
			{
				document.getElementById("subscriptionRegionSelect").value = decodeURIComponent(subKey);
			}
			
			subscriptionChange();
		};
	
		return {
			// Declare public members.
			init:                   init,
			getQueryVariable:       getQueryVariable,
			subscriptionChange:     subscriptionChange,
			imageLoadError:         imageLoadError,
			
			uriBasePreRegion:       uriBasePreRegion,
			uriBasePostRegion:      uriBasePostRegion,
			uriBaseAnalyze:         uriBaseAnalyze,
			uriBaseLandmark:        uriBaseLandmark,
			uriBaseCelebrities:     uriBaseCelebrities,
			uriBaseThumbnail:       uriBaseThumbnail,
			uriBaseOcr:             uriBaseOcr,
			uriBaseHandwriting:     uriBaseHandwriting
		};
	})();
	
	
	// Initialize the JavaScript code.
	
	//window.onload = common.init;
	jQuery( document ).ready(function() {
		common.init;
	});