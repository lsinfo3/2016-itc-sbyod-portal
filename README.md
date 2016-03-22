# S-BYOD Portal

With this web application you can enable and disable BYOD-Services provided by [ONOS].

#### Note
This repository only provides the code for the Web-Portal. To test this application you also need to install the BYOD-plugin for ONOS.

### Installation (OS-X / Linux)

You need [Meteor] installed:
```sh
$ curl https://install.meteor.com/ | sh
```
Clone project:
```sh
$ git clone https://github.com/lsinfo3/2016-itc-sbyod-portal.git
```

### Configuration
Some configuration settings have to be made. For this purpose edit the "settings.json" file in the root folder. This file holds your admin login credentials, the ONOS Rest endpoints and karaf credentials, as well as the polling rate at which the webserver asks ONOS for changes. Check "settings.json" below as example.
```sh
{
 "private": {
    "admin" : {
        "username" : "admin",
        "password" : "password",
        "email" : "yourEmail"
    },
   	"ONOSRestEndpoint" : "http://192.168.0.102:8181/onos",
  	"ONOSByodEndpoint" : "/onos-byod",
  	"onosCredentials" : {
             "username" : "karaf",
  			 "password" : "karaf"
  			},
  	"pollingRate" : "5000"
  }
}
```

### Start Application
```sh
$ meteor --settings settings.json
```
Now open Chrome or any other browser and type:
[https://localhost:3000]

### Meteor
A few important meteor commands:

Reset the project state. Erases the local database.
```sh
$ meteor reset
```
List the packages explicitly used by your project.
```sh
$ meteor list
```
Connect to the Mongo database for the specified site.
```sh
$ meteor mongo
```

### Meteor Packages
If you clone this project there should be all necessary packages installed/removed. For the sake of completeness following packages need to be installed/removed:


Packages to be removed with Meteor:
```sh
$ meteor remove autopublish
$ meteor remove insecure
```
Packages to be installed with Meteor:
```sh
$ meteor add accounts-base
$ meteor add accounts-ui
$ meteor add accounts-password
$ meteor add twbs:bootstrap
$ meteor add http
$ meteor add mizzao:user-status
$ meteor add underscore
```

[https://localhost:3000]: <https://localhost:3000>
[ONOS]: <http://onosproject.org/>
[Meteor]: <https://www.meteor.com/>
