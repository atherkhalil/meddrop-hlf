# MedDrop Hyperledger Fabric Blockchain

This project is the MedDrop Blockchain developed on Hyperledger Fabric.

## Getting started

To get started with deploying the HLF Blockchain Network, first you have to install the HLF binaries and docker images.

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.1 1.4.9
```
Now clone this repository into a directory.

```bash
git clone https://github.com/Mate-Sol/MedDrop-HLF.git
```
## Deploy Fabric Network

To deploy the Fabric Network, navigate to the root directory

### Clean Network

Clean the network first to avoid any previous running containers messing with the new containers.

```bash
./dn.sh
```
### Start Network

Start the Fabric Network.

```bash
./up.sh 
```

This will get your Fabric network up & running with all the chaincode deployed on the network & also the API server will start listening.

## Deploy Node API Service Manually

To start the node API service manually, first install the dependencies.

```bash
cd API
npm install
```

### Enroll Admin & Register User

```bash
node enrollAdmin
node registerUser
```
### Run Node API

```bash
node app
```

The Blockchain Network, Chaincode and the Node API is running.
The API is listening at:
```bash
http://localhost:4000
```
