# Rylan's Application Deployment Server

This program is meant to distribute many types of applications to Windows machines using PSExec. This will work with any client that is Windows 7+, though modification may allow earlier versions of Windows.

## Requirements
This requires NodeJS and has only been tested on version 12.19. The latest version of NodeJS is recommended to use this software. Along with this, all libraries included in the "Packages.json" file are required to run this. Installation of these libraries are included in the installation guide.

## Installation

Download the latest release on GitHub then run the following commands in the downloaded folder:

```bash
npm install
node index.js
```

This will start the server and allow connections using the Application Deployment Client found here:

>[https://github.com/RylanTaylor/ApplicationDeploymentClient](https://github.com/RylanTaylor/ApplicationDeploymentClient)

The default port is "177055" but this may be changed in the "./app/index.js" folder.



## Usage
Open "./app/files/" and create a folder (no spaces) titled the name of your program. Drag and drop all required files for the installation of this program into that folder.

Download PSTools from Microsoft's website:
>[https://docs.microsoft.com/en-us/sysinternals/downloads/pstools](https://docs.microsoft.com/en-us/sysinternals/downloads/pstools)

Move the PSExec.exe file into the "./app/data/tools/" folder of the application.


Edit "./app/data/tools/software.json" to reflect the installation arguments, files, and install folder. Replace "Example" with the name of the software, the first position in the array to the default install folder (to check if it's already installed, this can be either a file or a folder), the second position to the name of the folder in the "./app/files/" folder to pull the files from for the installation,  the third position to the executable of the installer, and the fourth position to any arguments the installer may take.

Software stacks are different groups of applications that may be installed on different types of computer. The "Defaults" application stack will be installed on every computer but adding to the "Stacks" object will allow different groups of applications to be installed to allow for a variety of applications to be installed for many use cases.

Example:

```bash
{
    "Programs": {
		"Slack": [
            "Program Files\\Slack\\",
            "slack",
            "msiexec.exe",
            "/i “slack-standalone-x.x.x.msi” /qn /norestart"
        ],
        "Google Chrome": [
            "Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            "chrome",
            "msiexec.exe",
            "/i \"C:\\Temp\\googlechromestandaloneenterprise64.msi\" /QN ALLUSERS=1"
        ],
		"Microsoft Teams": [
            "Program Files (x86)\\Teams Installer",
            "teams",
            "msiexec.exe",
            "/I C:\\Temp\\Teams_windows_x64.msi /QN ALLUSERS=1"
        ]
    },
    "Software Stacks": {
        "Defaults": [ 
            "Slack"
        ],
        "Chrome Users": [ 
            "Google Chrome"
        ],
        "Teams Users": [ 
            "Microsoft Teams"
        ]
    }
}
```

In the above example, every software stack will receive Slack, while Google Chrome and Microsoft Teams will only be installed with their specific stack.

 
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is under the MIT license, please refer to the "LICENSE" file for additional information.