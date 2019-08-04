pragma solidity ^0.5.0;

import "./TimeChainEternal.sol";

import "./Ownable.sol";

/// Followed and used some code from here: https://blog.zeppelinos.org/smart-contract-upgradeability-using-eternal-storage/
/// Source : https://github.com/zeppelinos/zos/blob/master/packages/lib/contracts/upgradeability/Proxy.sol
contract TimeChainProxy is TimeChainEternal, Ownable {
  // Address
    event Upgraded(address indexed implementation);


    constructor() public {
        owner = msg.sender;
    }

    /**
     * @dev Fallback function allowing to perform a delegatecall
     * to the given implementation.
     * @return This function will return
     * whatever the implementation call returns
     */
    function () external payable {
        address impl = implementation;
        require(impl != address(0));
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, impl, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }


    function upgradeTo(address newImp) external onlyOwner
    {
        require(implementation != newImp, "need new addr");
        setImplementation(newImp);
        emit Upgraded(newImp);
    }



    function setImplementation(address newImp) internal {
        implementation = newImp;
    }
}
