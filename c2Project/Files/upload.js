var imageUploaded = 0;
var percentComplete = 0;
var showError = false;
var textresult = "";
var callResult = "";

	function processPhoto(base64Photo, filename)
	{
		AnalyzeImage(base64Photo);
		
		
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
				 common.uriBasePostRegion + 
				 common.uriBaseAnalyze +
				 "?" + 
				 $.param(params),
			processData: false,
			contentType: false,         
			// Request headers.
			beforeSend: function(jqXHR){
				jqXHR.setRequestHeader("Content-Type","application/octet-stream");
				jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", 
					encodeURIComponent("41e04f3666d346c4a8b20a8222925598"));
			},
			
			type: "POST",
			 data: makeblob(base64data)  ,
		})
	
		
		.done(function(data) {
			imageUploaded = 1;
			callResult = makeHuman(data);
			// percentComplete = 100; //await the second 
			percentComplete = (data.faces.length == 0 ? 100 : 70 );
			if(percentComplete == 100)
			{
				textresult = callResult;
			} 
			else
			{
				AnalyzeFaces(base64data);
			}
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

AnalyzeFaces = function(base64data)
{

	var params = {
		"returnFaceId": "true",
		"returnFaceLandmarks": "false",
		"returnFaceAttributes": "age,gender,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise",
	};

	// Perform the REST API call.
	jQuery.ajax({
		url: common.uriBasePreRegion + "westeurope" +
			 common.uriBasePostRegionFaces + 
			 common.uriBaseAnalyzeFaces +
			 "?" + 
			 $.param(params),
		processData: false,
		contentType: false,         
		// Request headers.
		beforeSend: function(jqXHR){
			jqXHR.setRequestHeader("Content-Type","application/octet-stream");
			jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", 
				encodeURIComponent("9d9520eb8c3e451392d7949356a57c54"));
		},
		
		type: "POST",
		 data: makeblob(base64data)  ,
	})

	
	.done(function(data) {
		imageUploaded = 1;
		textresult += describeFaces(data);
		percentComplete = 100; //await the second 
		showError = false;
		
	})
	
	.fail(function(jqXHR, textStatus, errorThrown) {

		textresult = errorThrown;
		showError = true;
		imageUploaded = 1;
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
describeFaces = function(jsonResponse)
{
	var str_humanResponse = "";

	var index = 1;
	jsonResponse.forEach(face => {
		str_humanResponse += "The person number " + index.toString() + " ";
		str_humanResponse += describeSingleFace(face);
	});

	return str_humanResponse;
}

describeSingleFace = function(face)
{
	var result = "";

	result += expressEmotion(face.faceAttributes.emotion);
	result += "This person is a " + (face.faceAttributes.gender == "female" ? "woman" : "man") + "."; 
	result += isSmiling(face.faceAttributes.smile);
	result += (face.faceAttributes.glasses != "NoGlasses"? "This person has glasses.": "");
	result += describeFacialHair(face.faceAttributes.facialHair);
	result += describeHeadHair(face.faceAttributes.hair);
	result += describeMakeUp(face.faceAttributes.makeup);
	return result;
}

describeMakeUp = function(makeup)
{
	var result = ""

	if(makeup.eyeMakeup)
	{
		result += makeSentence("This person","","has","eyeMakeup","","");
	}

	if(makeup.lipMakeup)
	{
		result += makeSentence("This person","","has","lipMakeup","","");
	}
	return result;
}

describeHeadHair = function(hair)
{
	var result = "";

	if(hair.bald > 0.75)
	{
		result += "This person is bald " + adverbFromConfidence(false,hair.bald,false) + ".";
	}

	var hairColor, confidence;
	confidence = 0;
	hairColor = "";

	hair.hairColor.forEach(info => {
		if(info.confidence> 0.85)
		{
			hairColor = info.color;
		}
	});

	if(hairColor.length > 0)
	{
		result += makeSentence("This person","","has","hair",hairColor,"");
	}
	return result;
}


describeFacialHair = function(facialHair)
{
	var result = "";

	var andFlag = false;

	if(facialHair.moustache > 0.4)
	{
		result += "moustache ";
		andFlag = true;
	}

	if(facialHair.beard > 0.4)
	{
		if(andFlag)
		{
			result += "and ";
		}
		result += "beard ";
		andFlag = true;
	}

	
	if(facialHair.sideburns > 0.4)
	{
		if(andFlag)
		{
			result += "and ";
		}
		result += "sideburns ";
		andFlag = true;
	}

	if(result.length > 0)
	{
		result = makeSentence("This person","","has",result,"","");
	}
	return result;
}


isSmiling = function(smile)
{
	if(smile > 0)
	{
		return "This person is smiling.";
	}
	return "";
}

expressEmotion = function(emotion)
{
	var emotion,confidence;
	confidence = 0;
	for (var property in emotion) {
		//if (emotion.hasOwnProperty(property)) {
			if(emotion[property] > confidence)
			{
				confidence = emotion[property]; 
				emotion = property;
			}
		//}
	}
	return "expresses " +  emotion.toString() + "."; 
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
	str_humanResponse += facesContent(jsonResponse.faces);
	str_humanResponse += readCaptions(jsonResponse.description);

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
	return directObj == "photo" ? "": makeSentence(subject,"",verb,directObj,"","");
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

facesContent = function(faces)
{
	var result = "";
	if(faces.length >  0)
	{
		faces.forEach(face => {
			//describeFace(face);
			var subj = "There";
			var verb = "is a "; 
			var dirObj = face.gender === "Female" ? "woman" : "man";
			var adj = face.age.toString() + (face.age > 1 ? " years" : "year") + " old";
			result += makeSentence(subj,"",verb,dirObj,adj,"");	
		});
	}
	return result;

}

readCaptions = function(description)
{
	var result = "";

	if(description.captions.length > 0)
	{
		result += "This picture can be described as: ";
	}
	description.captions.forEach(caption => {
		result += caption.text + ".";
	});

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
		var uriBasePostRegionFaces = ".api.cognitive.microsoft.com/face/";
		var uriBaseAnalyze = "v1.0/analyze";
		var uriBaseAnalyzeFaces = "v1.0/detect";
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
			uriBasePostRegionFaces:      uriBasePostRegionFaces,
			uriBaseAnalyze:         uriBaseAnalyze,
			uriBaseAnalyzeFaces:         uriBaseAnalyzeFaces,
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