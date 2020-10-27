const fs = require("fs");

async function writeLog(asset, requser, message) {
	message = message.replace(/(\r\n|\n|\r)/gm, ""); //Strip newlines
	let output = "(" + Date.now() + ") " + "(Requested By: " + requser + ") " + asset + ": " + message;
	let stream = fs.createWriteStream("./app/data/logs/ads.log", {flags:"a"});
	stream.write(output + "\n");
	stream.end();
	console.log(output);
}

module.exports = {
	writeLog
};