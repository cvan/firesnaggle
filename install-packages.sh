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
fi

popd > /dev/null
