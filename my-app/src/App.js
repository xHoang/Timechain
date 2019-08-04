
import {Icon, Heading, Link, Text, Button, ToastMessage, Loader, Table, Field, OutlineButton, Input} from 'rimble-ui'
import React, { Component } from "react";
import TimeChainLogic from "./build/TimeChainLogic.json";
import TimeChainProxy from "./build/TimeChainProxy.json"
import NavBar from './components/navBar.js'
import {CopyToClipboard} from 'react-copy-to-clipboard';
import CryptoJS from "crypto-js";
import moment from "moment";
import "./App.css";
import IpfsAPI from "ipfs-api";
import getWeb3 from "./getWeb3";
import Dropzone from 'react-dropzone'
class App extends Component {

  /*=================================
=            CONFIGURABLES            =
===================================*/
  state = {
    contractAddr: "0x0",
    web3: null,
    allAccounts: null,
    contract: null,
    tags: '',
    ipfsAPI: null,
    checkedFile: null,
    ipfsUrl: '',
    networkType: '',
    myFiles: null,
    fileUploaded: null,
    maxFileSize: 10485760,
    ///@notice File properies
    fileHash: '',
    fileName: '',
    fileContent: '',
    fileHashToCheck: '', // This one is to check if the check hash button has been clicked
    ///@notice testing picture
    imgSrc: 'https://i.imgur.com/uWImmsv.jpg',
    toggleUpload: false,
    getFilesLoading: false,
    searchHashLoading: false,
  }

  /*=================================
=            Constructor            =
===================================*/
  constructor (props) {
    super(props);
     this.handleClick = this.handleClickUpload.bind(this);
    this.handleClick = this.handleClickCheck.bind(this);
  }


///@notice this is invoked immedidantly once it has run.
/// Further information seen here: https://reactjs.org/docs/react-component.html
  componentDidMount = async () => {
    try {
      console.log(this.state.maxFileSize);
      const web3 = await getWeb3();
      const allAccounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const networkType = await web3.eth.net.getNetworkType();
      const deployed = TimeChainLogic.networks[networkId];
      const proxy = TimeChainProxy.networks[networkId];
      if(!deployed || !proxy){
          this.setState({ web3 });
          alert('No deployed contracts for this network');
          alert('Change network in MetaMask');
          return;
      }
      const instance = new web3.eth.Contract(
          TimeChainLogic.abi,
          deployed && proxy.address,
      );
      /// @notice only configured to work on local host otherwise it doesn't work.
      const ipfsAPI = IpfsAPI({ host: 'localhost', port: '5001', protocol: 'http' });

      this.setState({ web3, allAccounts, ipfsAPI, contract: instance, contractAddr: instance.options.address, networkType: networkType });
    } catch (error) {
        alert('Failed to load web3, accounts, or contract. Check console for details.');
        console.error(error);
        alert(error);
    }
  };


  /*=================================
  =            Main functions            =
  ===================================*/
  /// @notice https://react-dropzone.netlify.com/
  /// filesparams.rejectedfiles fileparams.acceptedFile
  fileDropped = async (acceptedFiles, rejectedFiles, captured) => {
    if(rejectedFiles.length > 0 && rejectedFiles[0].size > this.state.maxFileSize){
      window.toastProvider.addMessage('File is too large!', {
        secondaryMessage: "A limit of 10MB is in place. Please choose a smaller file",
        variant: 'failure'
      });
      return;
    }

    acceptedFiles.forEach(file => {
      if(captured){
        this.setState({
          toggleUpload: true,
        });
      } else {
        this.setState({
          toggleUpload: true,
          fileName: file.name
        });
      }

      const reader = new FileReader();

      reader.onerror = (err) => {
        window.toastProvider.addMessage('Failed to read the file!', {
          secondaryMessage: "Check console for details",
          variant: 'failure'
        });
        this.setState({
          isUploadLoading: false,
        });
        alert(err);
      }

      reader.onload = async () => {
        const fileAsArrayBuffer = reader.result;
        this.setState({
          fileContent: fileAsArrayBuffer
        });

       this.setState({
         toggleUpload: false
       });
      };

      reader.readAsArrayBuffer(file);
    });
  };
///check if the hash is available
  hashCheck = async (acceptedFiles, rejectedFiles) => {
    if(rejectedFiles.length > 0 && rejectedFiles[0].size > this.state.maxFileSize){
      window.toastProvider.addMessage('File is too large!', {
        secondaryMessage: "Only up to 10MB files can be uploaded!",
        variant: 'failure'
      });
      return;
    }

    acceptedFiles.forEach(file => {
      this.setState({
          searchHashLoading: true,
      });
      const reader = new FileReader();

      reader.onerror = (err) => {
        this.setState({
            searchHashLoading: false,
        });
        window.toastProvider.addMessage('Error! File cannot be read', {
          secondaryMessage: "Please press F12 to look at the console error",
          variant: 'failure'
        });
        alert(err);
      }

      reader.onload = async () => {
        const fileAsArrayBuffer = reader.result;
        this.setState({
          fileContent: fileAsArrayBuffer,
          searchHashLoading: false
        });
        const hash = await this.getFileHashFromContent();

        this.setState({
          fileHashToCheck: hash
        });
        window.toastProvider.addMessage('Success! Hash available', {
          secondaryMessage: 'Please click search to check',
          icon: 'InfoOutline'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  addProof = async() => {
    this.setState({
      toggleUpload: true
    });
    this.saveProof();
  }


///@notice in the saveProof function we will upload our file to the IPFS and then save the corrospoding details onto
/// the smart contract that was deployed (TimeChainEternal). In doing so, files uploaded can now be viewed through the
/// mapping users and proofs.
  saveProof = async() => {
    const allAccounts = this.state.allAccounts;
    const contract = this.state.contract;
    var fileUploaded;

    try{
      const owner = allAccounts;
      const fileHash = await this.getFileHashFromContent();
      const epochTime = Math.round(moment().format('X'));
      console.log(moment().format('X'));

      const fileIPFS = await this.state.ipfsAPI.files.add(Buffer.from(this.state.fileContent));
      console.log('Added to ipfs : ' + fileIPFS[0].hash);


      console.log('fileHash : ' + fileHash);
      var tags = this.convertStr2Bytes(this.state.tags).padEnd(66, '0');
      var data = await contract.methods.addProofHelper(epochTime, fileHash, tags, this.convertStr2Bytes(fileIPFS[0].hash)).send({from: owner[0]});

      fileUploaded = {
        tx: data.transactionHash,
        ipfs: fileIPFS[0].hash,
        filehash: fileHash,
        tags: this.convertBytes2Str(data.events.proofAdded.returnValues.tags)
      }
      window.toastProvider.addMessage('File has been added!', {
        secondaryMessage: "tx: "+ data.transactionHash,
        variant: 'success'
      });
    } catch (err) {
      window.toastProvider.addMessage('Failed to add file!', {
        secondaryMessage: "Check console for details",
        variant: 'failure'
      });
      alert(err);
      console.log(err);
    } finally {
      this.setState({
        fileUploaded: fileUploaded,
        toggleUpload: false
      });
    }
  }

///@notice checks if the file's hash uploaded is inside the contract
  getFile = async() => {
    const { fileHashToCheck, contract } = this.state;

    if(fileHashToCheck.length !== 66){
      window.toastProvider.addMessage('Hash is invalid', {
        secondaryMessage: 'Hash should be EXACTLY 66 chracters',
        variant: 'failure'
      });
      return;
    }
    this.setState({
        searchHashLoading: true,
    });
    var data = await contract.methods.proofs(fileHashToCheck).call();

    if(data.ipfsHash === null){
      window.toastProvider.addMessage('File not found.', {
        secondaryMessage: 'File is not in contract',
        variant: 'failure'
      });
      this.setState({
          searchHashLoading: false,
      });
      return;
    }

    this.setState({
      checkedFile: data,
      ipfsUrl: this.getIPFSURL(this.convertBytes2Str(data.ipfsHash)),
      searchHashLoading: false
    })
    window.toastProvider.addMessage('File found!', {
      variant: 'success'
    });
  }

  getMyFiles = async() => {
    const { allAccounts, contract } = this.state;
    this.setState({
      getFilesLoading: true
    });

    var numberOfFiles = await contract.methods.getCounterHelper().call({from: allAccounts[0]});
    numberOfFiles = parseInt(numberOfFiles);
    var myFiles = [];
    ///@notice loop through all the files inside our mapping. We then want to put that into a local array.
    /// We CANOOT directly loop through our mapping because it acts akin to a HashMap
    /// Therefore the only way to get it is either store the details into an external array e.g. mongoDB
    /// or just iterate through all the files in the mapping
    for(var i = 0; i < numberOfFiles; i++){
      var response = await contract.methods.getProofHelper(i).call({from: allAccounts[0]});
      myFiles.push(response);
      //console.log(response);
    }
///@notice use moment here in order to convert timestamp property into an actual timestam
/// the getProofHelper returns in TimeChainEternal as it determines what is in the first
    myFiles = myFiles.map((myFiles,n) =>
      <tr key={n+1}>
        <td style={{width: '10%'}}>{n+1}</td>
        <td style={{width: '10%'}}>{moment.unix(myFiles[0]).format('DD-MM-YYYY HH:mm:ss')}</td>
        <td style={{wordBreak: 'break-all', width: '50%'}}>
          {myFiles[1]}
        </td>
        <td style={{width: '10%'}}>
          <CopyToClipboard text={myFiles[1]}
            onCopy={() => window.toastProvider.addMessage('Copy to clipboard', {  secondaryMessage: 'You can now paste the hash!',  icon: 'InfoOutline'  })}>
                <Link href='#!' onClick={this.onClick}>
                    <Icon name="ContentCopy" color="primary" size="16" />
                </Link>
          </CopyToClipboard>
        </td>
      </tr>
    );

    this.setState({
      getFilesLoading: false,
      myFiles: myFiles,
      numberOfMyFiles: numberOfFiles
    })
    window.toastProvider.addMessage('Files displayed', {
      secondaryMessage: 'Your files are listed',
      variant: 'success'
    });
  }

/*=================================
           Helpers
===================================*/

///@notice convert String --> Bytes
  convertStr2Bytes = (text) => {
      return this.state.web3.utils.utf8ToHex(text);
  }
///@notice convert Bytes --> String
  convertBytes2Str = (bytes) => {
      return this.state.web3.utils.hexToUtf8(bytes);
  }

///@notice generic gandler since I have several variables vound in to the state of the current componenet.
  handleChange = e => this.setState({ [e.target.name]: e.target.value });

///@notice bind the upload and checkHash buttons. the .opn() will open the file dialog which can then be accessed normally.
  handleClickUpload = (e) => {this.setState({toggleUpload: true});this.refs.dropzoneUpload.open();}

  handleClickCheck = (e) => {  this.setState({    searchHashLoading: true});
    this.refs.dropzoneCheck.open();
  }

  ///@notice Get the hash of the file so that it can stored later on.
  getFileHashFromContent = async () => {
    const actualFile = this.state.fileContent;
    const conwordArr = CryptoJS.lib.WordArray.create(actualFile);
    const fileHash = await this.state.web3.utils.soliditySha3(conwordArr).toString();
    return fileHash;
  }

  getIPFSURL = (ipfsHash) => {
    const ipfsLink = "http://127.0.0.1:8080/ipfs/";
    return ipfsLink + (ipfsHash);
  }





  /*=================================
       Webpage front-end render
  ===================================*/
  render() {
    /// @notice This is really important. If you remove this then the application will try to render the states
    /// but this takes time and so it will be reading null. We need a delay so that the code can render.
    if (this.state.web3 === false) {
      return <div>Loading Components</div>;
    } else if (!this.state.contract) {
      return <div>Wrong network -- Change metamask </div>;
    }
    ///@notice
    return (
      <div>
      <NavBar />
        <Heading.h1>Timechain</Heading.h1>
        <Heading.h5>Mark your files for all of eternity</Heading.h5>
        <hr id="divider"/>
        <Text
        caps
        fontSize={0}
        fontWeight={4}
        mb={3}
        display={'flex'}
        alignItems={'center'}
        >
          Your address: {this.state.allAccounts[0]}
        </Text>

        <div className="TimeChain">
                  <Heading>Upload File</Heading>
                  <Text mb={4}>
                    Select your file to be uploaded to IPFS. Your details will then be stored in the smart contract.
                  </Text>

                  {this.state.fileName === '' ?
                    (<div>
                        <Button onClick={this.handleClickUpload.bind(this)} mr={3}  style={{width: '100%'}}>
                        Select file
                        <Dropzone onDrop={(acceptedFiles, rejectedFiles) => this.fileDropped(acceptedFiles, rejectedFiles, false)}
                        ref="dropzoneUpload"
                        maxSize={this.state.maxFileSize}>
                        {({getRootProps, getInputProps}) => (
                          <section>
                          <div {...getRootProps()}>
                          <input {...getInputProps()} />
                          </div>
                          </section>
                        )}
                        </Dropzone>
                          </Button>
                    </div>) :
                    !this.state.fileUploaded ?
                    (<div>
                      <Text mb={4}>
                        Selected file: <b>{this.state.fileName}</b>
                      </Text>
                      {this.state.toggleUpload === false ?
                        <div>
                          <Field label='Adding tags are optional'>
                            <Input type='text' name='tags' maxLength="32" value={this.state.tags} style={{width: '100%'}} onChange={this.handleChange} placeholder='add tags'/>
                          </Field>
                          <Button onClick={this.addProof} mr={3}>Upload selected</Button>
                        </div>
                        :
                        <div>
                          <Field label='Adding tags are optional'>
                            <Input disabled type='text' name='tags' maxLength="32" value={this.state.tags} style={{width: '100%'}} placeholder='Add tags'/>
                          </Field>
                          <Button style={{marginBottom: '16px'}} disabled>
                            <Loader color="white" size="24px" bg="primary" />
                          </Button>
                        </div>
                      }
                    </div>) :
                    (<div style={{wordBreak: 'break-all', marginTop: '32px'}}>
                        <Table>
                        <tbody>
                          <tr>
                            <td style={{width: '30%'}}><b>File name:</b></td>
                            <td>{this.state.fileName}</td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>IPFS address:</b></td>
                            <td><a href={this.getIPFSURL(this.state.fileUploaded.ipfs)} className="alert-link" target="_blank" rel="noopener noreferrer">
                             {this.state.fileUploaded.ipfs}</a></td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>File hash:</b></td>
                            <td>{this.state.fileUploaded.filehash}</td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>File tags:</b></td>
                            <td>{this.state.fileUploaded.tags}</td>
                          </tr>
                          </tbody>
                        </Table>
                      </div>)
                  }





                  <Heading>Check if file exists</Heading>
                  <Text mb={4}>
                    Paste the soliditySha3 file hash or upload a file. Click search and check if your file is stored inside the contract.
                  </Text>
                      <OutlineButton  onClick={this.handleClickCheck.bind(this)} mr={3} style={{width: '100%'}}>
                    Select file to Hash
                    <Dropzone onDrop={(acceptedFiles, rejectedFiles) => this.hashCheck(acceptedFiles, rejectedFiles, false)}
                    ref="dropzoneCheck"
                    maxSize={this.state.maxFileSize}>
                    {({getRootProps, getInputProps}) => (
                      <section>
                      <div {...getRootProps()}>
                      <input {...getInputProps()} />

                      </div>
                      </section>
                    )}
                    </Dropzone>
                    </OutlineButton>
                  <div style={{height: '10px'}}></div>
                  <Field label='or paste hash here'>
                    <div style={{
                      display: 'inline-flex',
                      width: '100%'
                    }}>
                      <Input type='text' name='fileHashToCheck' minLength="66" maxLength="66" value={this.state.fileHashToCheck} style={{width: '100%'}} onChange={this.handleChange}/>
                      {this.state.searchHashLoading === false ?
                        <Button onClick={this.getFile} id="searchbtn">Search</Button>
                        :
                        <Button disabled>
                          <Loader color="white" size="24px" bg="primary" />
                        </Button>
                      }
                    </div>
                  </Field>
                  {this.state.checkedFile !== null &&
                    <Table>
                      <tbody>
                        <tr>
                          <td style={{width: '20%'}}><b>Date:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{moment.unix(this.state.checkedFile.timestamp).format('DD-MM-YYYY HH:mm:ss')}</td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>IPFS:</b></td>
                          <td style={{wordBreak: 'break-word'}}><a href={this.state.ipfsUrl} className="alert-link" target="_blank" rel="noopener noreferrer">
                            {this.convertBytes2Str(this.state.checkedFile.ipfsHash)}</a>
                            &nbsp;(click to visit)
                          </td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>Owner:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{this.state.checkedFile.ownerAddr}</td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>Hash:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{this.state.checkedFile.fileHash}</td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>Tags:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{this.convertBytes2Str(this.state.checkedFile.tags)}</td>
                        </tr>
                      </tbody>
                    </Table>
                    }





                  <Heading>Your Files</Heading>
                  <Text mb={4}>
                    Check all the files currently uploaded to the deployed contract (if recently uploaded click button again)
                  </Text>
                  {this.state.getFilesLoading === false ?
                    <Button onClick={this.getMyFiles}  style={{marginBottom: '16px'}}>
                      Generate Files
                    </Button> :
                    <Button style={{marginBottom: '16px'}} disabled>
                      <Loader color="white" size="24px" bg="primary" />
                    </Button>
                  }
                  {this.state.myFiles &&
                      <Table>
                        <tbody>
                          <tr>
                            <td style={{width: '10%'}}><b>Account:</b></td>
                            <td style={{wordBreak: 'break-all'}}>{this.state.allAccounts[0]}</td>
                          </tr>
                          <tr>
                            <td style={{width: '10%'}}><b>Files owned:</b></td>
                            <td>{this.state.numberOfMyFiles}</td>
                          </tr>
                        </tbody>
                      </Table>
                    }
                    {this.state.myFiles && this.state.myFiles.length > 0 &&
                      <Table style={{marginTop: '32px'}}>
                        <thead>
                        <tr>
                          <th style={{width: '10%'}}>#</th>
                          <th style={{width: '20%'}}>Date</th>
                          <th style={{width: '55%'}}>Hash</th>
                          <th style={{width: '15%'}}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.myFiles}
                        </tbody>
                      </Table>
                    }


          <ToastMessage.Provider ref={node => window.toastProvider = node} />
        </div>

      </div>
    );
  }
}

export default App;
