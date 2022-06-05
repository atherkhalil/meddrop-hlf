#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -e
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CC_SRC_LANGUAGE=${1:-"go"}
CC_SRC_LANGUAGE=`echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:]`
CC_SRC_PATH1="../chaincode/order/go/"
CC_SRC_PATH2="../chaincode/payment/go/"
CC_SRC_PATH3="../chaincode/product/go/"
CC_SRC_PATH4="../chaincode/route/go/"



# Launch Network, Create Channel and Join Peer to Channel
pushd ./network

./network.sh up createChannelMedDrop -ca -s couchdb

./network.sh deployCCOrder -c medrop -ccn order -ccv 1 -cci initLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH1}
./network.sh deployCCOrder -c medrop -ccn payment -ccv 1 -cci initLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH2}
./network.sh deployCCOrder -c medrop -ccn product -ccv 1 -cci initLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH3}
./network.sh deployCCOrder -c medrop -ccn route -ccv 1 -cci initLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH4}


popd

cat <<EOF

// ************************************************************************************ //

         This is your captain speaking...

         Hyperledger Fabric Network & API are Up & Running!

         Total setup execution time: $(($(date +%s) - starttime)) seconds.. Sweet!

// ************************************************************************************ //

EOF

pushd ./API

node enrollAdmin

node registerUser

pm2 start ./app.js

popd