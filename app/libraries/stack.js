const fs = require("fs");
const logging = require("./logging");

let getStack = async function (req, res) {
	let user = null;
	if ("user" in req.query) {
		user = req.query["user"];
	}
	else {
		user = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //Set user to IP if not specified, mostly for backwards compatability
	}
	if ("get" in req.query) {
		if (req.query["get"] == "softwareInfo"){
			fs.readFile("./app/data/tools/software.json", "utf8", (err, data) => {
				if (err) {
					logging.writeLog("SERVER", user, "Error code 500");
					res.sendStatus(500);
				}
				logging.writeLog("SERVER", user, "Requested software.json info");
				res.status(200);
				res.send(data);
			});
		}
		else {
			logging.writeLog("SERVER", user, "Error, invalid get query");
			res.sendStatus(400);
		}
	}
	else {
		logging.writeLog("SERVER", user, "Error, invalid query");
		res.sendStatus(403);
	}
};

module.exports = {
	getStack
};