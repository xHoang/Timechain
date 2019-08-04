const TimeChainProxy = artifacts.require("TimeChainProxy");
const TimeChainLogic = artifacts.require("TimeChainLogic");
TimeChainLogic.numberFormat = 'String';
TimeChainProxy.numberFormat = 'String';
const truffleAssert = require('truffle-assertions');
const assert = require("chai").assert;
const moment = require("moment");
const ethUtil = require('ethereumjs-util');


function convertStr2Bytes(text) {
    return web3.utils.utf8ToHex(text);
}


function convertBytes2Str(bytes) {
    return web3.utils.hexToUtf8(bytes);
}


async function precomputeContractAddress(deployer) {
    const currentNonce = await web3.eth.getTransactionCount(deployer);
    const futureAddress = ethUtil.bufferToHex(ethUtil.generateAddress(deployer, currentNonce));
    return futureAddress;
}


contract("TimeChainLogic", function(accounts) {
    var tcProxy, TimeChainLogicContract, logic;
    var zeroAddress = "0x0000000000000000000000000000000000000000";


    beforeEach('Setup', async () => {
        tcProxy = await TimeChainProxy.new();
        TimeChainLogicContract = await TimeChainLogic.new();
        await tcProxy.upgradeTo(TimeChainLogicContract.address, {from: accounts[0]});
        logic = await TimeChainLogic.at(tcProxy.address);
    });

    describe("Timechain functionality testing", function() {
        describe("Add file to contract", function() {
            it('Store file via addProof directly', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];

                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);
                const tx = await logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress});

                truffleAssert.eventEmitted(tx, 'proofAdded', (ev) => {
                    return convertBytes2Str(ev.ipfsHash) === ipfsAddr &&
                        convertBytes2Str(ev.fileHash) === file &&
                        convertBytes2Str(ev.tags) === tags &&
                        ev.timestamp === timestamp.toString() &&
                        ev.owner === callerAddress;
                }, "Incorrect event parameters read");
            });

            it('store File indirectly via addProofHelper', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];

                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);
                const tx = await logic.addProofHelper(timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress});

                truffleAssert.eventEmitted(tx, 'proofAdded', (ev) => {
                    return convertBytes2Str(ev.ipfsHash) === ipfsAddr &&
                        convertBytes2Str(ev.fileHash) === file &&
                        convertBytes2Str(ev.tags) === tags &&
                        ev.timestamp === timestamp.toString() &&
                        ev.owner === callerAddress;
                }, "Incorrect event parameters read");
            });

            it('Accept: Caller Address is another account number', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[1];

                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);
                const tx = await logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: accounts[0]});

                truffleAssert.eventEmitted(tx, 'proofAdded', (ev) => {
                    return convertBytes2Str(ev.ipfsHash) === ipfsAddr &&
                        convertBytes2Str(ev.fileHash) === file &&
                        convertBytes2Str(ev.tags) === tags &&
                        ev.timestamp === timestamp.toString() &&
                        ev.owner === callerAddress;
                }, "Incorrect event parameters read");
            });

            it('Reject: Address cannot be empty', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();


                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);

                await truffleAssert.fails(
                    logic.addProof(zeroAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: accounts[0]}),

                    truffleAssert.ErrorType.REVERT,
                    "Address cannot be empty"
                );
            });

            it('Reject: IPFS is empty', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes(ipfsAddr + "XXX");
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);

                await truffleAssert.fails(
                    logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress}),

                    truffleAssert.ErrorType.REVERT,
                    "invalid IPFS"
                );
            });

            it('Reject: IPFS hash too long', async () => {

                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes("");
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);

                await truffleAssert.fails(
                    logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress}),

                    truffleAssert.ErrorType.REVERT,
                    "invalid IPFS"
                );
            });

            it('Reject: Don\'t add file as hash is empty', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes("");
                const tagsbytes32 = convertStr2Bytes(tags);

                await truffleAssert.fails(
                    logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress}),

                    truffleAssert.ErrorType.REVERT,
                    "hash empty"
                );
            });

            it('Reject: Timestamp < 0', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = 0;
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);

                await truffleAssert.fails(
                    logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress}),

                    truffleAssert.ErrorType.REVERT,
                    "timestamp has to be greater than 0"
                );
            });

            it('Reject: File already exists in contract', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);

                await logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress}),
                await truffleAssert.fails(
                    logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: accounts[0]}),

                    truffleAssert.ErrorType.REVERT,
                    "file already exists"
                );
            });
        });

        describe("Retirving the files", function() {
            it('Accept: Return all the proof properties and check they are correct', async() => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);
                await logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress});


                const response = await logic.proofs(filebytes32);

                assert.equal(callerAddress, response.ownerAddr)
                assert.equal(ipfsAddr, convertBytes2Str(response.ipfsHash));
                assert.equal(tags, convertBytes2Str(response.tags));
                assert.equal(timestamp, response.timestamp);
            });

            it('Accept: Return empty string', async () => {

                const filebytes32 = convertStr2Bytes("0x123456");

                const response = await logic.proofs(filebytes32);

                assert.equal(zeroAddress, response.ownerAddr);
                assert.equal(null, response.ipfsHash);
                assert.equal('0x0'.padEnd(66,'0'), response.tags);
                assert.equal(0, response.timestamp);
                assert.equal('0x0'.padEnd(66,'0'), response.fileHash);
            });

            it('Accept: Return count', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];

                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const tagsbytes32 = convertStr2Bytes(tags);
                await logic.addProofHelper(timestamp, convertStr2Bytes("0x123456"), tagsbytes32, ipfsbytes, {from: callerAddress});
                const response = await logic.getCounterHelper.call({from: callerAddress});

                assert.equal("1", response)
            });

            it('Accept: Return count of files from two different accounts', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];

                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const tagsbytes32 = convertStr2Bytes(tags);
                await logic.addProof(callerAddress, timestamp, convertStr2Bytes("0xF"), tagsbytes32, ipfsbytes, {from: accounts[0]});
                await logic.addProof(callerAddress, timestamp, convertStr2Bytes("0x123456"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                const response = await logic.getCounter.call(callerAddress, {from: callerAddress});

                assert.equal("2", response);
            });

            it('Accept: Return proof when given ID via helper method ', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];

                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const tagsbytes32 = convertStr2Bytes(tags);
                await logic.addProofHelper(timestamp, convertStr2Bytes("0x123456"), tagsbytes32, ipfsbytes, {from: callerAddress});
                await logic.addProofHelper(timestamp, convertStr2Bytes("0xF"), tagsbytes32, ipfsbytes, {from: callerAddress});
                await logic.addProofHelper(timestamp, convertStr2Bytes("0xB"), tagsbytes32, ipfsbytes, {from: callerAddress});
                const response = await logic.getProofHelper.call(2, {from: callerAddress});

                assert.equal(timestamp, response[0]);
                assert.equal("0xB", convertBytes2Str(response[1]));
                assert.equal(tags, convertBytes2Str(response[2]));
                assert.equal(ipfsAddr, convertBytes2Str(response[3]));
            });

            it('Accept: Return proof when given ID via direct method', async () => {

                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "testing";
                const timestamp = moment().unix();
                const callerAddress = accounts[0];


                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const tagsbytes32 = convertStr2Bytes(tags);
                await logic.addProof(callerAddress, timestamp, convertStr2Bytes("0x123456"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                await logic.addProof(callerAddress, timestamp, convertStr2Bytes("0xF"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                await logic.addProof(callerAddress, timestamp, convertStr2Bytes("0xB"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                const response = await logic.getProofHelper.call(2, {from: callerAddress});


                assert.equal(timestamp, response[0]);
                assert.equal("0xB", convertBytes2Str(response[1]));
                assert.equal(tags, convertBytes2Str(response[2]));
                assert.equal(ipfsAddr, convertBytes2Str(response[3]));
            });
        });

        describe("Pause contract functionality", function (){
            it('Stop adding new files', async() => {

                const callerAddress = accounts[0];
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);

                const tx = await logic.toggleContractActive({from: callerAddress});

                truffleAssert.eventEmitted(tx, 'PauseToggled', (ev) => {
                    return ev.owner === callerAddress &&
                        ev.beenUsed === true;
                }, "Incorrect event parameters read");
                await truffleAssert.fails(
                    logic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress}),

                    truffleAssert.ErrorType.REVERT,
                    "Contant not active"
                );
            });

            it('Don\'t allow other acounts to add stuff on', async() => {

                const callerAddress = accounts[1];
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0x123456";
                const tags = "testing";
                const timestamp = moment().unix();
                const ipfsbytes = convertStr2Bytes(ipfsAddr);
                const filebytes32 = convertStr2Bytes(file);
                const tagsbytes32 = convertStr2Bytes(tags);


                await truffleAssert.fails(
                    logic.toggleContractActive({from: callerAddress}),

                    truffleAssert.ErrorType.REVERT,
                    "You are not the owner"
                );
            });
        });
    });
});
