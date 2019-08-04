pragma solidity ^0.5.0;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./TimeChainEternal.sol";

/// @author Hoang Le
/// @notice contract is used to esentially manipulate and store data files. This is where we use the struct from TimeChainEternal contract and save it here.
contract TimeChainLogic is TimeChainEternal, Ownable {
  ///  @notice Designed to support safe math operations. Esentially it just means that it
/// prevents overflow when working with uint. (No underflow since should be an unsigned datatype but SafeMath still accounts for it))
  using SafeMath for uint;
  uint constant maxIPFS = 47;
  /*==========================
            MODIFIERS
  ============================*/

  modifier isActive { require(!stopped, "Contant not active"); _; }

  /// @notice only parties with the onlyOwner modifier (or rather a trusted party) can can pause the contract
      function toggleContractActive() public onlyOwner {
          stopped = !stopped;
          emit PauseToggled(msg.sender, now, stopped);
      }

  /*===========================
            EVENTS
  =============================*/

  /// @notice an event emitted for the use of Pause contract functionality. This is also known as circuit breakers.
  /// Guidelines found here: https://github.com/ethereum/wiki/wiki/Safety#circuit-breakers-pause-contract-functionality
    event PauseToggled(address owner, uint time, bool beenUsed);
  /// @notice an event emitted once a proof (or rather struct) hsa been added to contract
    event proofAdded(address owner, uint timestamp, bytes32 fileHash, bytes32 tags, bytes ipfsHash);

    /*===========================
              Constructor
    =============================*/

    constructor() public {
        owner = msg.sender;
    }

    /*================================
    =            FUNCTIONS           =
    ==================================*/


    ///@notice This is the most important function. This is where we will store all the details
    /// of the file. It will be added into our public smart contract varible mappings users and proofs respectively.
    /// These are public so everything can be seen. Since these are only hashes, the files can't really be searched for.
    /// Think along the lines that each hash is unlisted. Only people with the link can find it.
    function addProof(address callerAddress, uint timestamp, bytes32 fileHash,
        bytes32 tags, bytes memory ipfsHash) public isActive {
          /// Previously used assert here but turns out it uses more gas and can't return an error statement to be used with truffle-assert
        require(proofs[fileHash].ownerAddr == address(0x0), "file already exists");
        require(callerAddress != address(0x0), "Address cannot be empty");
        require(timestamp > 0, "timestamp has to be greater than 0");
        require(fileHash != "", "hash empty");
        require(ipfsHash.length != 0 && ipfsHash.length < 47, "invalid IPFS");
        uint counter = users[callerAddress].proofCounter;
        Proof memory newProof = Proof(callerAddress, timestamp, fileHash, tags, ipfsHash);
        users[callerAddress].userProofs[counter] = newProof;
        users[callerAddress].proofCounter = users[callerAddress].proofCounter + 1;

        proofs[fileHash] = newProof;

        emit proofAdded(callerAddress, timestamp, fileHash, tags, ipfsHash);
    }

    /// @notice Returns the number of files a user has uploaded on the address given.
    function getCounter(address callerAddress) public view returns (uint) {
        return users[callerAddress].proofCounter;
    }

    /// @notice Returns all the details of a proof of an uploaded file.
    function getProof(address callerAddress, uint id) public view returns (uint, bytes32, bytes32, bytes memory) {
            return (users[callerAddress].userProofs[id].timestamp,
            users[callerAddress].userProofs[id].fileHash,
            users[callerAddress].userProofs[id].tags,
            users[callerAddress].userProofs[id].ipfsHash
        );
        }

        /*================================
        =            Helpers           =
        ==================================*/

        /// @notice this is called so we can get the caller of the contract's address via msg.sender
        /// The reason for doing this is so that on the front - end we don't need to specfically add an extra
        /// parameter which is the account. We only want to be sending specfic parameters to conserve on gas.
        /// This function will then esentially only be calling the "addProof" method which does most of the heavy lifting
        /// where it will be checking for poison data etc .. check @notice for said method there.
        function addProofHelper(uint timestamp, bytes32 filehash, bytes32 tags, bytes memory ipfshash) public {
            addProof(msg.sender, timestamp, filehash, tags, ipfshash);
        }
        /// @notice gets the Proof in the proofs array in the storage contract by calling an internal function which returns each property value

        function getProofHelper(uint id) public view returns (uint, bytes32, bytes32, bytes memory) {
            return getProof(msg.sender, id);
        }

        /// @notice gets the number of files uploaded from the user
        function getCounterHelper() public view returns(uint) {
            return getCounter(msg.sender);
        }

}
