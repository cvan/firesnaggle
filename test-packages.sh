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
