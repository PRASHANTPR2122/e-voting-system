import { useState, useEffect } from 'react';

declare global {
  interface Window {
    ethereum: any;
  }
}
import { ethers } from 'ethers';
import EVotingArtifact from '../artifacts/contracts/EVoting.sol/EVoting.json';
import React from 'react';

export default function Home() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [voterInfo, setVoterInfo] = useState<any>(null);
  interface Candidate {
    id: number;
    name: string;
    party: string;
    constituency: string;
    voteCount: string;
  }
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [constituency, setConstituency] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [votingStarted, setVotingStarted] = useState(false);
  const [votingEnded, setVotingEnded] = useState(false);

  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        
        const contract = new ethers.Contract(
          'YOUR_CONTRACT_ADDRESS_HERE',
          EVotingArtifact.abi,
          signer
        );

        setContract(contract);
        
        // Check if current user is admin
        const owner = await contract.owner();
        setIsAdmin(owner.toLowerCase() === accounts[0].toLowerCase());

        // Get voting status
        const votingStarted = await contract.votingStarted();
        const votingEnded = await contract.votingEnded();
        setVotingStarted(votingStarted);
        setVotingEnded(votingEnded);

        // Get voter info
        const voterInfo = await contract.voters(accounts[0]);
        setVoterInfo(voterInfo);

        // Get candidates
        const candidateCount = await contract.candidates.length;
        const candidatesData: Candidate[] = [];
        for (let i = 0; i < candidateCount; i++) {
          const candidate = await contract.candidates(i);
          candidatesData.push({
            id: i,
            name: candidate.name,
            party: candidate.party,
            constituency: candidate.constituency.toString(),
            voteCount: candidate.voteCount.toString()
          });
        }
        setCandidates(candidatesData);

      } catch (error) {
        console.error('Error initializing Web3:', error);
      }
    }
  };

  const registerVoter = async () => {
    try {
      const aadharHash = ethers.keccak256(ethers.toUtf8Bytes(aadharNumber));
      await contract?.registerVoter(parseInt(constituency), aadharHash);
      alert('Voter registered successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error registering voter:', error);
      alert('Error registering voter');
    }
  };

  const castVote = async (candidateId: number) => {
    try {
      await contract?.castVote(candidateId);
      alert('Vote cast successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Error casting vote');
    }
  };

  const startVoting = async () => {
    try {
      await contract?.startVoting();
      setVotingStarted(true);
      alert('Voting started!');
    } catch (error) {
      console.error('Error starting voting:', error);
      alert('Error starting voting');
    }
  };

  const endVoting = async () => {
    try {
      await contract?.endVoting();
      setVotingEnded(true);
      alert('Voting ended!');
    } catch (error) {
      console.error('Error ending voting:', error);
      alert('Error ending voting');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold mb-8">E-Voting System</h1>
                
                {!account && (
                  <button
                    onClick={initializeWeb3}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}

                {account && (
                  <div>
                    <p className="mb-4">Connected Account: {account}</p>
                    {isAdmin && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Admin Controls</h2>
                        <button
                          onClick={startVoting}
                          disabled={votingStarted}
                          className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          Start Voting
                        </button>
                        <button
                          onClick={endVoting}
                          disabled={!votingStarted || votingEnded}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          End Voting
                        </button>
                      </div>
                    )}

                    {!voterInfo?.isRegistered && !votingStarted && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Register to Vote</h2>
                        <div className="space-y-4">
                          <input
                            type="number"
                            placeholder="Constituency Number"
                            value={constituency}
                            onChange={(e) => setConstituency(e.target.value)}
                            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Aadhar Number"
                            value={aadharNumber}
                            onChange={(e) => setAadharNumber(e.target.value)}
                            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={registerVoter}
                            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                          >
                            Register
                          </button>
                        </div>
                      </div>
                    )}

                    {voterInfo?.isRegistered && votingStarted && !votingEnded && !voterInfo?.hasVoted && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>
                        <div className="space-y-4">
                          {candidates
                            .filter(candidate => candidate.constituency === voterInfo.constituency.toString())
                            .map(candidate => (
                              <div key={candidate.id} className="p-4 border rounded-lg bg-white">
                                <h3 className="font-bold">{candidate.name}</h3>
                                <p className="text-gray-600">{candidate.party}</p>
                                <button
                                  onClick={() => castVote(candidate.id)}
                                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                  Vote
                                </button>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {votingEnded && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Results</h2>
                        <div className="space-y-4">
                          {candidates.map(candidate => (
                            <div key={candidate.id} className="p-4 border rounded-lg bg-white">
                              <h3 className="font-bold">{candidate.name}</h3>
                              <p className="text-gray-600">{candidate.party}</p>
                              <p className="text-gray-600">Constituency: {candidate.constituency}</p>
                              <p className="font-bold text-blue-600">Votes: {candidate.voteCount}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}