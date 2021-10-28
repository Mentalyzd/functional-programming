/*let object;

let httpRequest = new XMLHttpRequest(); // asynchronous request
httpRequest.open("GET", "https://raw.githubusercontent.com/Mentalyzd/functional-programming/main/week1/dataset.json", true);
httpRequest.send();
httpRequest.addEventListener("readystatechange", function() {
    if (this.readyState === this.DONE) {
        object = JSON.parse(this.response);
        console.log(object)
    }
});*/

fetch("https://raw.githubusercontent.com/Mentalyzd/functional-programming/main/week1/dataset2.json")
    .then(Response => Response.json())
    .then(data => {
        data = data[0]['Als je later een auto zou kopen, van welk merk zou deze dan zijn?']
        console.log(data);
  		// or whatever you wanna do with the data
});