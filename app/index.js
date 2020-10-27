const express = require("express");
const stack = require("./libraries/stack");
const install = require("./libraries/install");
const logging = require("./libraries/logging");

const port = 17705;
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());


function main() {

	app.get("/", stack.getStack);
	app.post("/", install.run);

	app.listen(port, () => logging.writeLog("SERVER", "SERVER", "Application Deployment Server v2.0 Listening on Port " + port + "!"));

}

main();