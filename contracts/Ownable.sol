pragma solidity ^0.5.0;
// THIS CODE WAS WRITTEN BY OpenZeppelin
// https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-solidity/be5ed7364b93daccbb74a09e3f5ec1be6c458097/contracts/ownership/Ownable.sol
/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () public  {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
    }

    /**
     * @return the address of the owner.
     */
    /* function owner() public view returns (address) {
        return owner;
    } */

    /**
     * @dev Throws if called by any account other than the owner.
     */
     modifier onlyOwner() {
         require(msg.sender == owner, "You are not the owner");
         _;
     }



    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    /* function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    } */

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
