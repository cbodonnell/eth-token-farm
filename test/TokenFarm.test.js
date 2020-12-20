const { assert } = require('chai')

const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether')
}

contract('TokenFarm', ([owner, investor]) => {
    let dappToken, daiToken, tokenFarm

    before(async () => {
        // Load contracts
        dappToken = await DappToken.new()
        daiToken = await DaiToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all Dapp tokens to TokenFarm
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        // Send tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    })

    describe('Mock Dai deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })

    describe('TokenFarm deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result

            // Check investor balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock Dai wallet balance correct before staking')

            // Stake Mock Dai tokens
            // Investor must approve the address that will tranfer tokens on its behalf (done client-side)
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            await tokenFarm.stakeTokens(tokens('100'), { from: investor })

            // Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock Dai wallet balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investory staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status correct after staking')

            // Check balance after issuance
            await tokenFarm.issueTokens({ from: owner })
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Dapp Token wallet balance correct after issuance')

            await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

            // Unstake the tokens
            await tokenFarm.unstakeTokens({ from: investor })

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock Dai wallet balance correct after unstaking')
            
            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock Dai wallet balance correct after investor unstaking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens("0"), 'investor staking balance zero after unstaking')
            
            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status correct after unstaking')
        })
    })
})