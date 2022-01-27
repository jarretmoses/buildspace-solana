import {
  useEffect,
  useRef,
  useState
} from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Create a keypair for the account that will hold the GIF data.
// let baseAccount = Keypair.generate();

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
};


const ConnectButton = ({connectWallet}) => {
  return (
      <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )
};

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [gifs, setGifs] = useState([]);
  const gifInputRef = useRef();

  const sendGif = async () => {
    const input = gifInputRef.current;
    const url = input.value;

    if (url.length === 0) {
      console.log("No gif link given!")
      return
    }

    console.log('Gif link:', url);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('👾👾👾:::', program.rpc);
      await program.rpc.addGif(url, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      input.value = ''
      console.log("GIF successfully sent to program", url)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };


  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log("Got the account", account)
      setGifs(account.gifList)

    } catch (error) {
      if (error.message.includes('Account does not exist')) {
        createGifAccount()
      } else {
        console.log("Error in getGifList: ", error.message)
        setGifs([]);
      }
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );

    return provider;
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana?.isPhantom) {
        console.log('Phantom wallet found!');

        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(
          'Connected with Public Key:',
          response.publicKey.toString()
        );

        setWalletAddress(response.publicKey.toString());
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderConnectedContainer = () => (
    <div className="connected-container">
      {/* Go ahead and add this input and button to start */}
      <form
        onSubmit={(event) => {
          event.preventDefault();

          sendGif();
        }}
      >
        <input ref={gifInputRef} type="text" placeholder="Enter gif link!" />
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      <div className="gif-grid">
        {gifs.map((gif) => (
          <div className="gif-item" key={gif}>
            <img src={gif.gifLink} alt={gif.gifLink} />
            <p style={{color: 'white'}}>Address: {String(gif.userAddress)}</p>
          </div>
        ))}
      </div>
    </div>
  );



  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
  }, [walletAddress]); // eslint-disable-line

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };

    window.addEventListener('load', onLoad);

    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal (Testnet)</p>
          <p className="sub-text">
            Dragonball Super GIF collection ✨
          </p>
          {walletAddress && renderConnectedContainer()}
          {!walletAddress && <ConnectButton connectWallet={connectWallet}/>}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
