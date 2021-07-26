import { useEffect, useState } from 'react';
import Head from 'next/head'
import axios from 'axios';
import getBlockchain from '../lib/ethereum.js';
import Poll from '../lib/Poll.js';

export default function Home() {
  const [web3, setWeb3] = useState(undefined);
  const [address, setAddress] = useState(undefined);
  const [poll, setPoll] = useState(undefined);
  const [selectedProposalId, setSelectedProposalId] = useState(undefined);
  const [message, setMessage] = useState({
    payload: 'loading', 
    type: 'primary'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { web3, address } = await getBlockchain();
        //const response = await axios.get('/api/get-latest-poll');
        const response = await axios.get('/api/get-latest-poll');
        //console.log(response);
        setWeb3(web3);
        setAddress(address);
        setPoll(response.data.poll);
        setSelectedProposalId(response.data.poll.proposals[0]._id);
        setMessage({payload: undefined, type: undefined});
        //console.log(response.data.poll);
        console.log(response.data.poll.proposals[0]);
      } catch(e) {
        console.log(e);
        setMessage({
          payload: `Ooops... There was a problem when loading the app: ${e}`, 
          type: 'danger'
        });
      }
    };
    init();
  }, []);

  //when clicking submit button to vote for next video, sign the msg ${poll_id}-{choice_id}, signed with metamask
  const createVote = async e => {
    e.preventDefault();
    //console.log(e.target.elements);
    console.log(selectedProposalId);
    const response = await axios.post('/api/create-vote', {
      address,
      pollId: poll._id,
      proposalId: selectedProposalId
    });
    console.log("create-vote response:", response);
    updatePollResults();
    //sign message
    /*
    signMessage()
    */
    
  };

  function signMessage() {
    const msgParams = JSON.stringify({
      domain: {
        chainId: 1,
        name: 'Ether Mail',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1'
      },
      message: {
        contents: 'Hello, Bob!',
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
          ]
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000'
            ]
          }
        ]
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Group: [{ name: 'name', type: 'string' }, { name: 'members', type: 'Person[]' }],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' }
        ],
        Person: [{ name: 'name', type: 'string' }, { name: 'wallets', type: 'address[]' }]
      }
    });
  
    var from = web3.eth.accounts[0]
  
    var params = [from, msgParams]
    var method = 'eth_signTypedData_v4'
  
    web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, function (err, result) {
      if (err) return console.dir(err)
      if (result.error) {
        alert(result.error.message)
      }
      if (result.error) return console.error('ERROR', result)
      console.log('TYPED SIGNED:' + JSON.stringify(result.result))
  
      const recovered = sigUtil.recoverTypedSignature_v4({ data: JSON.parse(msgParams), sig: result.result })
  
      if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
        alert('Successfully recovered signer as ' + from)
      } else {
        alert('Failed to verify signer when comparing ' + result + ' to ' + from)
      }

    })
  }

  //useEffect(() => {
  //  updatePollResults();

 // }, []);


  async function updatePollResults() {
    const response = await axios.get('/api/get-latest-poll');
    setPoll(response.data.poll);

  }

  return (
    <div className='container'>
      <Head>
        <title>Eat The Blocks DAO</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mb-4 mt-4 bg-light rounded-3">
        <div className="container-fluid py-5">
          <h1 className='display-5 fw-bold text-center'>Eat The Blocks Dao</h1>
        </div>
      </div>

      {typeof message.payload === 'undefined' ? null : (
        <div className='row'>
          <div className='col'>
            <div className={`mt-4 alert alert-${message.type}`} role="alert">
              {message.payload}
            </div>
          </div>
        </div>
      )}

      {typeof poll === 'undefined' ? null : (
        <Poll poll={poll} />
      )}

      {typeof poll === 'undefined' 
        || typeof selectedProposalId === 'undefined' ? null : (
        <div className='row'>
          <div className='col'>
            <div className="card">
              <h5 className="card-header">{poll.name}</h5>
              <div className="card-body">
                <h5 className="card-title">
                  Vote ends on {(new Date(parseInt(poll.end))).toLocaleString()}
                </h5>
                <p className="card-text">Vote for your favorite proposal:</p>
                <form onSubmit={e => createVote(e)}>
                  {poll.proposals.map(proposal => (
                    <div className="form-check" key={proposal._id}> 
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name='proposal'
                        value={proposal._id}
                        id={proposal._id}
                        onChange={e => setSelectedProposalId(e.target.value)} 
                        checked={proposal._id === selectedProposalId ? true : false}
                      />
                      <label className="form-check-label" htmlFor={proposal._id}>
                        {proposal.name}
                      </label>
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary mt-4">Submit</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
