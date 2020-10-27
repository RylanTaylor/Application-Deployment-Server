const fs = require("fs");
const { exec } = require("child_process");
const logging = require("./logging");

function getStatus(asset, location = "") {
	return new Promise((resolve) => {
		let link = "\\\\" + asset + "\\c$\\" + location;
		fs.access(link, fs.F_OK, (err) => {
			if (err) {
				resolve(false);
			}
			else {
				resolve(true);
			}
		});
	});
}

function getStack(stack) {
	return new Promise((resolve, reject) => {
		fs.readFile("./app/data/tools/software.json", "utf8", (err, contents) => {
			if (err) reject({500: err});
			let current_stack = JSON.parse(contents)["Software Stacks"]["Defaults"];
			let full_stack = JSON.parse(contents)["Software Stacks"][stack];
			for (let item in full_stack) {
				current_stack.push(JSON.parse(contents)["Software Stacks"][stack][item]);
			}
			let programs = {};
			for (let item in current_stack) {
				let install_name = current_stack[item];
				programs[install_name] = JSON.parse(contents)["Programs"][install_name];
			}
			resolve(programs);
		});
	});
}

function copyInstaller(asset, installer) {
	return new Promise((resolve) => {
		fs.readdir("./app/data/files/" + installer, (err, files) => {
			if (err) resolve(err);
			files.forEach(file => {
				let source = "./app/data/files/" + installer + "/" + file;
				let dest = "\\\\" + asset + "/c$/Temp/" + file;
				fs.copyFile(source, dest, (err) => {
					if (err) resolve(false);
				});
			});
			resolve(true);
		});
	});
}

function copyPsExec(asset) {
	return new Promise((resolve) => {
		let source = "./app/data/tools/psexec.exe";
		let dest = "./app/data/tools/ps_files/" + asset + ".exe";
		fs.copyFile(source, dest, (err) => {
			if (err) resolve(false);
		});
		resolve(true);
	});
}

function delPsExec(asset) {
	return new Promise((resolve) => {
		let dest = "./app/data/tools/ps_files/" + asset + ".exe";
		fs.unlink(dest, (err) => {
			if (err) resolve(true); //Meh, if it fails just leave it I guess ¯\_(ツ)_/¯
		});
		resolve(true);
	});
}

function deleteInstaller(asset, installer) {
	return new Promise((resolve) => {
		fs.readdir("./app/data/files/" + installer, (err, files) => {
			if (err) resolve(err);
			files.forEach(file => {
				let dest = "\\\\" + asset + "/c$/Temp/" + file;
				fs.unlink(dest, (err) => {
					if (err) resolve(false);
				});
			});
			resolve(true);
		});
	});
}

function installPrograms(asset, installer, installArgs) {
	return new Promise((resolve) => {
		let runPath = "\"./app/data/tools/ps_files/" + asset + ".exe\" /accepteula -s \\\\" + asset + " \"" + installer + "\" " + installArgs;
		exec(runPath, (error) => {
			if (error) {
				if (error.code == 3010) {
					resolve(0);
				}
				else {
					resolve(error.message);
				}
			}
			else {
				resolve(0);
			}
		});
	});
}

function tempFolder(asset) {
	return new Promise((resolve) => {
		getStatus(asset, "Temp\\").then((status) => {
			if (status == false) {
				fs.mkdir("\\\\" + asset + "/c$/Temp", (err) => {
					if (err) {
						resolve(false);
					}
				});
				resolve("Created \"Temp\" folder successfully!");
			}
			else {
				resolve("\"Temp\" folder already exists.");
			}
		});
	});
}

async function install(asset, user, program_stack, requser) {

	let failed = "";

	await logging.writeLog(asset, requser, "Starting software installs for user: " + user + ".");
	
	let makeTemp = await tempFolder(asset);
	
	if (!makeTemp) {
		await logging.writeLog(asset, requser, "Error: Unable to create temp folder!");
		return [206, "Unable to create temp folder."];
	}
	else {
		await logging.writeLog(asset, requser, makeTemp);
	}

	for (let item in program_stack) {
		let program = program_stack[item];

		let installStatus = await getStatus(asset, program[0]);
		if (installStatus == false) {
			let psexecCop = copyPsExec(asset);
			if (psexecCop) {
				let resCopy = await copyInstaller(asset, program[1]);
				if (resCopy) {
					let result = await installPrograms(asset, program[2], program[3]);
					if (result == 0 || result == 3010) {
						let message = item + " installed successfully.";
						await logging.writeLog(asset, requser, message);
					}
					else {
						let message = item + " installation failed with error: " + result;
						failed += item + ", ";
						await logging.writeLog(asset, requser, message);
					}
					let del = await deleteInstaller(asset, program[1]);
					if (!del) {
						let message = item + " failed deleting files.";
						await logging.writeLog(asset, requser, message);
					}
				}
				else {
					let message = "Unable to copy " + item + " installer.";
					await logging.writeLog(asset, requser, message);
				}
			}
			else {
				let message = item + " uanble to create PsExec for asset...";
				await logging.writeLog(asset, requser, message);
			}
		}
		else {
			let message = item + " is already installed, skipping...";
			await logging.writeLog(asset, requser, message);
		}
	}

	await delPsExec(asset);

	if (failed != "") {
		failed = failed.substring(0, failed.length - 2); //Remove the last comma
		return [206, failed];
	}

	else {
		return 0;
	}

}

let run = async function(req, res) {
	let data = req.body;

	if("asset" in data && "stack" in data && "user" in data) {

		let requser = null;
		if ("requser" in data) {
			requser = data["requser"];
		}
		else {
			requser = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //Set user to IP if not specified, mostly for backwards compatability
		}

		if (await getStatus(data["asset"])) {
			let stackInfo = await getStack(data["stack"]);
			if (500 in stackInfo || stackInfo.length == 0) { //If there is an error getting the stack info
				await logging.writeLog(data["asset"], requser, stackInfo[500]);
				res.status(500);
				res.send(stackInfo[500]);
			}
			
			let status = await install(data["asset"], data["user"], stackInfo, requser);

			if (status == 0) {
				let message = "All Programs successfully installed";
				await logging.writeLog(data["asset"], requser, message);
				res.status(200);
				res.send(message);
			}

			else if (typeof status == "object") {
				let message = "Programs installed with errors. The following were unable to install: " + status[1];
				await logging.writeLog(data["asset"], requser, message);
				res.status(206);
				res.send(message);
			}

			else {
				let message = "Error running installs: " + status;
				await logging.writeLog(data["asset"], requser, message);
				res.status(500);
				res.send(message);
			}

		}
		else {
			let message = "Could not access computer: " + data["asset"];
			await logging.writeLog(data["asset"], requser, message);
			res.status(404);
			res.send(message);
		}
	}
	else {
		res.sendStatus(400);
	}
};

module.exports = {
	run,
	install,
	copyInstaller,
	getStatus,
	getStack
};