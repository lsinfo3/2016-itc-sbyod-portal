#!/bin/bash

#update and install
sudo apt-get update
sudo apt-get install -y git
sudo apt-get install -y curl

#install meteor
curl https://install.meteor.com/ | sh

#clone repository
git clone https://github.com/lsinfo3/2016-itc-sbyod-portal.git

#make startup script executable
chmod +x /home/vagrant/2016-itc-sbyod-portal/startup.sh

#edit rc.local
sed -i "s|# By default this script does nothing.|(cd /home/vagrant/2016-itc-sbyod-portal/; sudo sh '/home/vagrant/2016-itc-sbyod-portal/startup.sh')|" /etc/rc.local

echo "You will now be prompted for login credentials and the IP, ONOS is running at."
# user name, password, email and onosIP dialog
if [ -z ${INPUT_USERNAME+1} ]; then
  echo -n "Enter admins username: "
  read INPUT_USERNAME
fi
if [ -z ${INPUT_PASSWORD+1} ]; then
  echo -n "Enter admins password (hidden input): "
  read -sr INPUT_PASSWORD
  echo
fi
if [ -z ${INPUT_ONOS_IP+1} ]; then
  echo -n "Enter ONOS IP: "
  read INPUT_ONOS_IP
fi
echo "[OK]"

#write admins credentials and ONOS IP in settings file
sed -i "s/: \"admin\"/: \"$INPUT_USERNAME\"/" ~/2016-itc-sbyod-portal/settings.json
sed -i "0,/: \"password\"/s//: \"$INPUT_PASSWORD\"/" ~/2016-itc-sbyod-portal/settings.json
sed -i "s|/.*:|//$INPUT_ONOS_IP:|" ~/2016-itc-sbyod-portal/settings.json
