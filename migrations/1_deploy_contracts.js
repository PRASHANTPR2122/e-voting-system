// filepath: scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const EVoting = await ethers.getContractFactory("EVoting");
  const eVoting = await EVoting.deploy();
  await eVoting.deployed();

  console.log("EVoting contract deployed to:", eVoting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });