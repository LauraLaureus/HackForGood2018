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
		
		imageUploaded = 1;
		textresult = "You are handsome!"
		percentComplete = 0;
		showError = false;
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