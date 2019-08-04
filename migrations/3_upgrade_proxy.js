const TimeChainProxy = artifacts.require("./TimeChainProxy.sol");
const TimeChainLogic = artifacts.require("./TimeChainLogic.sol");

module.exports = async function(deployer) {
    const proxy = await TimeChainProxy.deployed();
    const logic = await TimeChainLogic.deployed();
    await proxy.upgradeTo(logic.address);
};
