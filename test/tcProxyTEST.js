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


contract("TimeChainProxy", function(accounts) {
    var tcProxy, TimeChainLogicContract, tcLogic;
    var zeroAddress = "0x0";


    beforeEach('Setup', async () => {
        tcProxy = await TimeChainProxy.new();
        TimeChainLogicContract = await TimeChainLogic.new();
    });

    describe("Proxy features", function() {
        it("set Address", async() => {


            const response = await tcProxy.owner.call();

            assert.equal(accounts[0], response, "Owner is not considered as an valid owner");
        });
        it("set implementation address", async() => {

            const tx = await tcProxy.upgradeTo(TimeChainLogicContract.address, {from: accounts[0]});
            truffleAssert.eventEmitted(tx, 'Upgraded', (ev) => {
                return ev.implementation === TimeChainLogicContract.address
            }, "Incorrect event parameters read");
        });
        it("Reject: same address", async() => {


            await tcProxy.upgradeTo(TimeChainLogicContract.address, {from: accounts[0]});

            await truffleAssert.fails(
                tcProxy.upgradeTo(TimeChainLogicContract.address, {from: accounts[0]}),

                truffleAssert.ErrorType.REVERT,
                "need new addr"
            );
        });

        it("New implementation carries over storage", async() => {

            await tcProxy.upgradeTo(TimeChainLogicContract.address, {from: accounts[0]});
            const tcLogic = await TimeChainLogic.at(tcProxy.address);
            const newImplementationLogic = await TimeChainLogic.new();
            const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
            const file = "0xABCDEFGH";
            const tags = "tag1;tag2;tag3";
            const timestamp = moment().unix();
            const callerAddress = accounts[0];
            const ipfsbytes = convertStr2Bytes(ipfsAddr);
            const filebytes32 = convertStr2Bytes(file);
            const tagsbytes32 = convertStr2Bytes(tags);

            await tcLogic.addProof(callerAddress, timestamp, filebytes32, tagsbytes32, ipfsbytes, {from: callerAddress});
            await tcProxy.upgradeTo(newImplementationLogic.address, {from: accounts[0]});
            const logicV2 = await TimeChainLogic.at(tcProxy.address);
            const response = await logicV2.proofs(filebytes32, {from: accounts[1]});

            assert.equal(accounts[0], response.ownerAddr, "Invalid contract data after switching implementations");
            assert.equal(filebytes32.padEnd(66,'0'), response.fileHash, "Invalid contract data after switching implementations");
        });
        it("State should be same for new implementation", async() => {

            await tcProxy.upgradeTo(TimeChainLogicContract.address, {from: accounts[0]});
            const tcLogic = await TimeChainLogic.at(tcProxy.address);
            const newImplementationLogic = await TimeChainLogic.new();

            await tcLogic.toggleContractActive();
            await tcProxy.upgradeTo(newImplementationLogic.address, {from: accounts[0]});
            const logicV2 = await TimeChainLogic.at(tcProxy.address);
            const tx = await logicV2.toggleContractActive();

            truffleAssert.eventEmitted(tx, 'PauseToggled', (ev) => {
                return ev.owner === accounts[0] &&
                    ev.beenUsed === false;
            }, "Incorrect event parameters read");
        });
    });
});
