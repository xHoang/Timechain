-----------------------------------------------------
## Timechain - A proof of Existence dApp (w/ IPFS) 
-----------------------------------------------------

### Project Description:
Showing you own an idea, or a piece of property is hard to prove. You either have to
go through a third party which can vouch for your story or hope the person you’re
talking to believe you. Through the use of Proof of Existence, I am able to code a
decentralised Ethereum application. This application showcases the use of Proof of
Existence by returning an uploading hashes of files to a blockchain.
These hashes can then be verified on the blockchain along with their timestamp to
say they had existed at that point in time. However, these solutions already exist. My
application explores content – addressable searching where you can search with a
file hash to a group of nodes on the IPFS (interplanetary file system) and if there is a
match will be returned with the file.

###Overview:
The decentralised application has three main components:

- [Bootstrapped React application](https://github.com/facebook/create-react-app) which allows clients to add almost anytype of media (size limit) and allows clients to search files via their hashes.
- Implemented Smart Contracts that perform the same function as a record would and additonal metadata like their owner and time when uploaded.
- IPFS (InterPlanetary FileSystem) acts the the "primary database" where the files can be recovered.


### Installation:
---



#### Prerequisities:
Make sure that you are using a browser that has MetaMask installed. In my example I use chrome. Brave and firefox are both great browsers that can be used. You then want to have truffle (ganache-cli) installed and IPFS installed and configured properly. In order to do this open your command line interface (I will be using Linux sub system). Make sure you have Nodejs already installed as well.


- truffle
```
npm install -g truffle
```
- ganache-cli
https://www.trufflesuite.com/ganache 
Install ganache with the above link
- IPFS
https://github.com/ipfs/go-ipfs#install

#### Running the dApp locally
Open up two terminals: Here I used Windows Powershell and Linux Subshell:

Terminal 1:
```
ipfs daemon
```
![alt text](https://i.imgur.com/Ss2FmTg.png)

Terminal 2:
```
1. npm i
2. truffle compile
3. truffle migrate
4. cd my-app
5. npm i
6. npm start / yarn start
![linux-subsystem-pic](https://i.imgur.com/Yy3ybV9.png)
```

#### Troubleshooting:
-If you are trying to run this program locally then you may encounter this error:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:5001/api/v0/add?stream-channels=true. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing).
```
- If this is the case you need to configure the API permissions of the IPFS configuration as shown belown. **ONCE DONE RESTART THE DAEMON**
```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '[\"*\"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '[\"PUT\",\"GET\", \"POST\"]'

```

### Languages / Resources used:
---
- Ethereum blockchain (Ganache-cli)
- Solidity
- Truffle, web3.js
- React, Rimble-ui
- Javascript,
- HTML5, CSS3
- //TODO Add Testnet (Infura)
