#!/bin/sh

#set system to sleep for 10 to prevent too early startup of meteor portal
sleep 10s
sudo meteor --settings settings.json
