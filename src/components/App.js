import React, { Component } from 'react'
import Navbar from './Navbar'
import Main from "./Main"
import './App.css'
import Web3 from 'web3'
import DaiToken from "../abis/DaiToken.json"
import DappToken from "../abis/DappToken.json"
import TokenFarm from "../abis/TokenFarm.json"

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      daiToken: {},
      dappToken: {},
      tokenFarm: {},
      daiTokenBalance: '0',
      dappTokenBalance: '0',
      stakingBalance: '0',
      loading: true
    }
    this.registerMDai = this.registerMDai.bind(this)
    this.registerDAPP = this.registerMDai.bind(this)
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3

    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    const networkId = await web3.eth.net.getId()

    const daiTokenData = DaiToken.networks[networkId]
    console.log(daiTokenData)
    if (daiTokenData) {
      const daiToken = new web3.eth.Contract(DaiToken.abi, daiTokenData.address)
      console.log(daiToken)
      this.setState({ daiToken })
      let daiTokenBalance = await daiToken.methods.balanceOf(this.state.account).call()
      this.setState({ daiTokenBalance: daiTokenBalance.toString() })
    } else {
      window.alert("DaiToken contract not deployed to the detected network")
    }

    const dappTokenData = DappToken.networks[networkId]
    console.log(dappTokenData)
    if (dappTokenData) {
      const dappToken = new web3.eth.Contract(DappToken.abi, dappTokenData.address)
      console.log(dappToken);
      this.setState({ dappToken })
      let dappTokenBalance = await dappToken.methods.balanceOf(this.state.account).call()
      this.setState({ dappTokenBalance: dappTokenBalance.toString() })
    } else {
      window.alert("DappToken contract not deployed to the detected network")
    }

    const tokenFarmData = TokenFarm.networks[networkId]
    console.log(tokenFarmData)
    if (tokenFarmData) {
      const tokenFarm = new web3.eth.Contract(TokenFarm.abi, tokenFarmData.address)
      console.log(tokenFarm)
      this.setState({ tokenFarm })
      let stakingBalance = await tokenFarm.methods.stakingBalance(this.state.account).call()
      this.setState({ stakingBalance: stakingBalance.toString() })
    } else {
      window.alert("DappToken contract not deployed to the detected network")
    }

    this.setState({ loading: false })
  }

  async registerToken(options) {
    console.log('registering token', options)
    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: options.address, // The address that the token is at.
            symbol: options.symbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: options.decimals, // The number of decimals in the token
            // image: options.image, // A string url of the token logo
          },
        },
      });
    
      if (wasAdded) {
        console.log('Thanks for your interest!');
      } else {
        console.log('Your loss!');
      }
    } catch (error) {
      console.log(error);
    }
  }

  async registerMDai() {
    this.registerToken({
      address: this.state.daiToken._address,
      symbol: await this.state.daiToken.methods.symbol().call(),
      decimals: await this.state.daiToken.methods.decimals().call(),
    })
  }

  async registerDAPP() {
    this.registerToken({
      address: this.state.dappToken._address,
      symbol: await this.state.dappToken.methods.symbol().call(),
      decimals: await this.state.dappToken.methods.decimals().call(),
    })
  }

  stakeTokens = (amount) => {
    this.setState({ loading: true })
    this.state.daiToken.methods.approve(this.state.tokenFarm._address, amount)
    .send({ from: this.state.account })
    .on("transactionHash", (hash) => {
      this.state.tokenFarm.methods.stakeTokens(amount).send({ from: this.state.account })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  unstakeTokens = () => {
    this.setState({ loading: true })
    this.state.tokenFarm.methods.unstakeTokens()
    .send({ from: this.state.account })
    .on("transactionHash", (hash) => {
      this.setState({ loading: false })
    })

  }

  render() {
    let content
    if (this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main 
        daiTokenBalance={this.state.daiTokenBalance}
        dappTokenBalance={this.state.dappTokenBalance}
        stakingBalance={this.state.stakingBalance}
        stakeTokens={this.stakeTokens}
        unstakeTokens={this.unstakeTokens}
        registerMDai={this.registerMDai}
        registerDAPP={this.registerDAPP}
      />
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.studio10b.nyc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                {content}

              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
