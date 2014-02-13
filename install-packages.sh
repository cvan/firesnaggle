#!/usr/bin/env bash

if [ ! -e "lib/packages" ]
then
    echo "Creating 'lib/packages' directory"
    mkdir lib/packages
fi

pushd lib/packages > /dev/null

if [ -e "slimerjs" ]
then
    echo "Already installed 'slimerjs'"
else
    echo "Downloading 'slimerjs'"

    SLIMER_VER_MINOR=v0.9
    SLIMER_VER=0.9.0

    if [ $(uname) == "Darwin" ]
    then
        SLIMER_FN=slimerjs-$SLIMER_VER-mac.tar.bz2
    else
        sudo apt-get --yes --force-yes update
        sudo apt-get --yes --force-yes install xvfb

        if [ $(uname -m) == "x86_64" ]
        then
            SLIMER_FN=slimerjs-$SLIMER_VER-linux-x86_64.tar.bz2
        else
            SLIMER_FN=slimerjs-$SLIMER_VER-linux-i686.tar.bz2
        fi
    fi

    curl -k -O http://download.slimerjs.org/$SLIMER_VER_MINOR/$SLIMER_VER/$SLIMER_FN
    tar -xjpvf $SLIMER_FN
    rm $SLIMER_FN
    mv slimerjs-$SLIMER_VER slimerjs
    echo "console.log('SlimerJS installed OK'); slimer.exit();" > test_slimerjs.js

    if [ $(uname) == "Darwin" ]
    then
        slimerjs/slimerjs test_slimerjs.js
    else
        sudo xvfb-run slimerjs/slimerjs test_slimerjs.js
    fi

    rm test_slimerjs.js
fi

if [ -e "casperjs" ]
then
    echo "Already installed 'casperjs'"
else
    echo "Downloading 'casperjs'"
    git clone git://github.com/n1k0/casperjs.git
    pushd casperjs
    git checkout -b '1.1-beta3'
    popd

    echo "console.log('CasperJS installed OK'); casper.exit();" > test_casperjs.js
    casperjs/bin/casperjs test test_casperjs.js
    rm test_casperjs.js
fi

popd > /dev/null
