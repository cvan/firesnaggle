#!/usr/bin/env bash

pushd lib/packages > /dev/null

echo "console.log('SlimerJS installed OK'); slimer.exit();" > test_slimerjs.js

if [ $(uname) == "Darwin" ]
then
    slimerjs/slimerjs test_slimerjs.js
else
    sudo xvfb-run slimerjs/slimerjs test_slimerjs.js
fi

rm test_slimerjs.js

popd > /dev/null

XVFB=/usr/bin/Xvfb
XVFBARGS=":0 -screen 0 1024x768x24 -ac +extension GLX +render -noreset"
PIDFILE=/var/run/xvfb.pid
sudo start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile --background --exec $XVFB -- $XVFBARGS
