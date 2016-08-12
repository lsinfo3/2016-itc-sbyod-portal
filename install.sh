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
sudo sed -i "s|# By default this script does nothing.|(cd /home/vagrant/2016-itc-sbyod-portal/; sudo sh '/home/vagrant/2016-itc-sbyod-portal/
startup.sh')|" /etc/rc.local

#add default route
sudo route add default gw 172.16.37.1 eth1
sudo route del default gw 10.0.2.2
echo "sudo route add default gw 172.16.37.1 eth1" >> /home/vagrant/.profile
echo "sudo route del default gw 10.0.2.2" >> /home/vagrant/.profile

sudo apt-get install nginx -y
#redirect conf file needs to be placed in site-available
echo "server {
	listen 80 default_server;
	return 307 https://portal.s-byod.de;
}" > /etc/nginx/sites-available/redirect

sudo ln -s /etc/nginx/sites-available/redirect /etc/nginx/sites-enabled/

# disable default site
sudo rm /etc/nginx/sites-enabled/default

echo "server {
	listen 443;
	server_name portal.s-byod.de;

	ssl on;
	ssl_certificate /etc/nginx/ssl/cert.pem;
	ssl_certificate_key /etc/nginx/ssl/cert.key;

	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_set_header X-Forwarded-For $remote_addr;
	}
}
" > /etc/nginx/sites-available/portal
sudo ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/

mkdir /etc/nginx/ssl

# manually:
# /etc/nginx/ssl/cert.pem
# /etc/nginx/ssl/cert.key

sudo service nginx restart
