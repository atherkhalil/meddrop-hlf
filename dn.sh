#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -ex

# Bring the network down
pushd ./network
./network.sh down
popd

# Clean out any old identites in the wallets
rm -rf API/wallet/*
