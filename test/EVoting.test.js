const EVoting = artifacts.require("EVoting");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract("EVoting", (accounts) => {
    const [admin, voter1, voter2] = accounts;
    let evoting;

    beforeEach(async () => {
        evoting = await EVoting.new({ from: admin });
    });

    describe("Candidate Management", () => {
        it("should allow admin to add candidates", async () => {
            await evoting.addCandidate("John Doe", "Party A", 1, { from: admin });
            const candidate = await evoting.candidates(0);
            assert.equal(candidate.name, "John Doe");
            assert.equal(candidate.party, "Party A");
            assert.equal(candidate.constituency.toNumber(), 1);
        });

        it("should not allow non-admin to add candidates", async () => {
            await expectRevert(
                evoting.addCandidate("John Doe", "Party A", 1, { from: voter1 }),
                "Ownable: caller is not the owner"
            );
        });
    });

    describe("Voter Registration", () => {
        it("should allow voters to register", async () => {
            await evoting.addCandidate("John Doe", "Party A", 1, { from: admin });
            const aadharHash = web3.utils.keccak256("123456789");
            await evoting.registerVoter(1, aadharHash, { from: voter1 });
            const voterInfo = await evoting.getVoterInfo(voter1);
            assert.equal(voterInfo.isRegistered, true);
            assert.equal(voterInfo.hasVoted, false);
            assert.equal(voterInfo.constituency.toNumber(), 1);
        });

        it("should not allow double registration", async () => {
            await evoting.addCandidate("John Doe", "Party A", 1, { from: admin });
            const aadharHash = web3.utils.keccak256("123456789");
            await evoting.registerVoter(1, aadharHash, { from: voter1 });
            await expectRevert(
                evoting.registerVoter(1, aadharHash, { from: voter1 }),
                "Voter already registered"
            );
        });
    });

    describe("Voting Process", () => {
        beforeEach(async () => {
            await evoting.addCandidate("John Doe", "Party A", 1, { from: admin });
            const aadharHash = web3.utils.keccak256("123456789");
            await evoting.registerVoter(1, aadharHash, { from: voter1 });
        });

        it("should allow registered voter to cast vote", async () => {
            await evoting.startVoting({ from: admin });
            await evoting.castVote(0, { from: voter1 });
            const candidate = await evoting.candidates(0);
            assert.equal(candidate.voteCount.toNumber(), 1);
        });

        it("should not allow double voting", async () => {
            await evoting.startVoting({ from: admin });
            await evoting.castVote(0, { from: voter1 });
            await expectRevert(
                evoting.castVote(0, { from: voter1 }),
                "Already voted"
            );
        });

        it("should not allow voting before start", async () => {
            await expectRevert(
                evoting.castVote(0, { from: voter1 }),
                "Voting is not active"
            );
        });
    });

    describe("Results", () => {
        beforeEach(async () => {
            await evoting.addCandidate("John Doe", "Party A", 1, { from: admin });
            await evoting.addCandidate("Jane Smith", "Party B", 1, { from: admin });
            const aadharHash1 = web3.utils.keccak256("123456789");
            const aadharHash2 = web3.utils.keccak256("987654321");
            await evoting.registerVoter(1, aadharHash1, { from: voter1 });
            await evoting.registerVoter(1, aadharHash2, { from: voter2 });
        });

        it("should correctly count votes", async () => {
            await evoting.startVoting({ from: admin });
            await evoting.castVote(0, { from: voter1 });
            await evoting.castVote(1, { from: voter2 });

            const [candidateIds, voteCounts] = await evoting.getConstituencyResults(1);
            assert.equal(candidateIds.length, 2);
            assert.equal(voteCounts[0].toNumber(), 1);
            assert.equal(voteCounts[1].toNumber(), 1);
        });
    });
});