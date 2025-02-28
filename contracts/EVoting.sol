// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";



contract EVoting is Ownable, ReentrancyGuard {
    // Structs
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 constituency;
        bytes32 aadharHash;
    }

    struct Candidate {
        string name;
        string party;
        uint256 constituency;
        uint256 voteCount;
    }

    // State variables
    mapping(address => Voter) public voters;
    Candidate[] public candidates;
    mapping(uint256 => bool) public constituencyExists;
    
    bool public votingStarted;
    bool public votingEnded;

    // Events
    event VoterRegistered(address indexed voter, uint256 constituency);
    event VoteCast(address indexed voter, uint256 constituency);
    event CandidateAdded(uint256 indexed candidateId, string name, string party, uint256 constituency);
    event VotingStarted();
    event VotingEnded();

    constructor() {
        votingStarted = false;
        votingEnded = false;
    }

    // Modifiers
    modifier votingNotStarted() {
        require(!votingStarted, "Voting has already started");
        _;
    }

    modifier duringVoting() {
        require(votingStarted && !votingEnded, "Voting is not active");
        _;
    }

    // Admin functions
    function addCandidate(string memory _name, string memory _party, uint256 _constituency) 
        external 
        onlyOwner 
        votingNotStarted 
    {
        candidates.push(Candidate({
            name: _name,
            party: _party,
            constituency: _constituency,
            voteCount: 0
        }));
        constituencyExists[_constituency] = true;
        emit CandidateAdded(candidates.length - 1, _name, _party, _constituency);
    }

    function startVoting() external onlyOwner votingNotStarted {
        votingStarted = true;
        emit VotingStarted();
    }

    function endVoting() external onlyOwner duringVoting {
        votingEnded = true;
        emit VotingEnded();
    }

    // Voter functions
    function registerVoter(uint256 _constituency, bytes32 _aadharHash) 
        external 
        votingNotStarted 
    {
        require(!voters[msg.sender].isRegistered, "Voter already registered");
        require(constituencyExists[_constituency], "Invalid constituency");
        
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            constituency: _constituency,
            aadharHash: _aadharHash
        });

        emit VoterRegistered(msg.sender, _constituency);
    }

    function castVote(uint256 _candidateId) 
        external 
        duringVoting 
        nonReentrant
    {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        require(!voters[msg.sender].hasVoted, "Already voted");
        require(_candidateId < candidates.length, "Invalid candidate");
        require(candidates[_candidateId].constituency == voters[msg.sender].constituency, 
                "Candidate not in voter's constituency");

        voters[msg.sender].hasVoted = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, voters[msg.sender].constituency);
    }

    // View functions
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getConstituencyResults(uint256 _constituency) 
        external 
        view 
        returns (uint256[] memory candidateIds, uint256[] memory voteCounts) 
    {
        require(constituencyExists[_constituency], "Invalid constituency");

        uint256 constituencyCount = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].constituency == _constituency) {
                constituencyCount++;
            }
        }

        candidateIds = new uint256[](constituencyCount);
        voteCounts = new uint256[](constituencyCount);

        uint256 index = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].constituency == _constituency) {
                candidateIds[index] = i;
                voteCounts[index] = candidates[i].voteCount;
                index++;
            }
        }

        return (candidateIds, voteCounts);
    }

    function getVoterInfo(address _voter) 
        external 
        view 
        returns (bool isRegistered, bool hasVoted, uint256 constituency) 
    {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.constituency);
    }
}