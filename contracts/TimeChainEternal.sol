pragma solidity ^0.5.0;
/// @author Hoang le
/// Followed tutorial found here https://hackernoon.com/how-to-make-smart-contracts-upgradable-2612e771d5a2
contract TimeChainEternal {
    ///@notice the variable which determines the address of the Logic (TimeChain Logic.sol) solidity contract.
    address public implementation;
    bool internal stopped = false; /// internal variable which is esentially allows the contract to be paused or rather stooped.
    /// Set as false on default in order for the contract to rule.

  /// @notice Two mappings users and proofs respectively. One holding all the proofs of their uploaded files
  // It will also store a counter to store the number of proofs currently in that proof given.
    mapping(address => UserProof) public users;
    mapping(bytes32 => Proof) public proofs;

    /// @notice Store the details of a single proof.
    struct Proof {
        address ownerAddr;
        uint timestamp;
        bytes32 fileHash;
        bytes32 tags;
        bytes ipfsHash;
    }
    /// @notice Struct (abstract var) where it will store each unique user's proofs
    struct UserProof {
        uint proofCounter;
        mapping(uint => Proof) userProofs;
    }


}
