var API_ENDPOINT = "<your API URL>"
var Ocp_Apim_Subscription_Key = "<YOUR Ocp_Apim_Subscription_Key>"
document.getElementById("sayButton").onclick = function(){

	var inputData = {
		"voice": $('#voiceSelected option:selected').val(),
		"text" : $('#postText').val()
	};
	
	$.ajaxSetup({
		headers: { "Ocp-Apim-Subscription-Key": Ocp_Apim_Subscription_Key }
	});

	$.ajax({
		  url: API_ENDPOINT,
	      type: 'POST',
	      data:  JSON.stringify(inputData)  ,
	      //contentType: 'application/json; charset=utf-8',
	      success: function (response) {
					document.getElementById("postIDreturned").textContent="Post ID: " + response;

	      },
	      error: function (err) {
			  console.log(err);
	          alert("error");
	      }
	  });
}


document.getElementById("searchButton").onclick = function(){

	var postId = $('#postId').val();

	$.ajaxSetup({
		headers: { "Ocp-Apim-Subscription-Key": Ocp_Apim_Subscription_Key }
	});
	$.ajax({
				url: API_ENDPOINT + '?postId='+postId,
				//url: API_GETPOST + '?postId='+postId,
				type: 'GET',
				success: function (response) {
					//console.log(response);
				//$('#posts tr').slice(1).remove();
					$('#posts tr').slice(1).remove();
					console.log(response);				
				jQuery.each(response.posts, function(i,data) {
					console.log(data);
					var player = "<audio controls><source src='" + data['url'] + "' type='audio/mpeg'></audio>"

					if (typeof data['url'] === "undefined") {
					var player = ""
					}

					$("#posts").append("<tr> \
							<td>" + data['_id'] + "</td> \
							<td>" + data['voice'] + "</td> \
							<td>" + data['text'] + "</td> \
							<td>" + data['status'] + "</td> \
							<td>" + player + "</td> \
							</tr>");
	        });
				},
				error: function () {
						alert("error");
				}
		});
}

document.getElementById("postText").onkeyup = function(){
	var length = $(postText).val().length;
	document.getElementById("charCounter").textContent="Characters: " + length;
}
