# Blockchain-based E-Voting System

A secure and transparent e-voting system built on Ethereum blockchain, designed for Indian elections. This system leverages blockchain technology to ensure tamper-proof voting while integrating with Aadhaar for voter verification.

## Features

- Secure voter registration with Aadhaar verification
- Constituency-based voting system
- Real-time vote counting
- Transparent and immutable voting records
- Prevention of double voting
- Role-based access control

## Prerequisites

- Node.js (v14 or higher)
- Truffle Suite
- Ganache for local blockchain development
- MetaMask wallet

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Ganache and ensure it's running on port 7545
4. Compile and deploy smart contracts:
   ```bash
   npm run compile
   npm run migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Smart Contract Structure

- `EVoting.sol`: Main contract handling voting logic
  - Voter registration and verification
  - Candidate management
  - Vote casting and counting
  - Constituency management

## Security Features

- Aadhaar hash-based voter verification
- One vote per registered voter
- Constituency-based access control
- Prevention of reentrancy attacks
- Admin-only candidate registration

## License

MIT License