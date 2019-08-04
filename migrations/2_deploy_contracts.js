const TimeChainProxy = artifacts.require("./TimeChainProxy.sol");
const TimeChainLogic = artifacts.require("./TimeChainLogic.sol");

module.exports = async function(deployer) {
    const proxy = await deployer.deploy(TimeChainProxy);
    const logic = await deployer.deploy(TimeChainLogic);
};
