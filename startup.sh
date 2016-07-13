#!/bin/sh

#set system to sleep for 10 to prevent too early startup of meteor portal
sleep 10s
HTTP_FORWARDED_COUNT=1 meteor -p 3000 --settings settings.json
