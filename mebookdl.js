const fetch = require("node-fetch");

fetch('http://mebook.cc/22781.html')
    .then(resp => resp.text())
    .then(body => console.log(body));

