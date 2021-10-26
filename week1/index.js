let object;

let httpRequest = new XMLHttpRequest(); // asynchronous request
httpRequest.open("GET", "dataset.json", true);
httpRequest.send();
httpRequest.addEventListener("readystatechange", function() {
    if (this.readyState === this.DONE) {
      	// when the request has completed
        object = JSON.parse(this.response);
    }
});

/*fetch("dataset.json")
    .then(Response => Response.json())
    .then(data => {
        console.log(data);
  		// or whatever you wanna do with the data
});*/