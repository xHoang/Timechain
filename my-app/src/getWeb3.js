import Web3 from "web3";
// Using some tutorials to run Web3
/// https://medium.com/coinmonks/react-web-dapp-with-metamask-web3-sotp-part-4-f252ebe8d07f

const getWeb3 = () =>
  new Promise((resolve, reject) => {
      window.addEventListener("load", async () =>{
        // Modern dapp browsers...
              if (window.ethereum) {
                const web3 = new Web3(window.ethereum);
                try {
                  // Request account access if needed
                  await window.ethereum.enable();
                  // reload page when address in MetaMask has changed
                  resolve(web3);
                } catch (error) {
                  reject(error);
                }
              }
              // Legacy dapp browsers...
              else if (window.web3) {
                // Use Mist/MetaMask's provider.
                const web3 = window.web3;
                console.log("Injected web3 detected.");
                resolve(web3);
              }
              // Fallback to localhost; use dev console port by default...
              else {
                /// Change from loc
                const provider = new Web3.providers.HttpProvider(  "http://127.0.0.1:8545");
                const web3 = new Web3(provider);
                console.log("No web3 instance injected, using Local web3.");
                resolve(web3);
              }

      });
  });

export default getWeb3;
