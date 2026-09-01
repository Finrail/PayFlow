const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const STELLAR_NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const SECRET_KEY = process.env.CONTRACT_DEPLOYER_SECRET;

if (!SECRET_KEY) {
  console.error('CONTRACT_DEPLOYER_SECRET environment variable is required');
  process.exit(1);
}

async function deploy() {
  console.log('Building contract...');
  try {
    execSync('cargo build --target wasm32-unknown-unknown --release', {
      cwd: __dirname,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }

  console.log('Contract built successfully');

  const wasmPath = path.join(__dirname, '..', 'target', 'wasm32-unknown-unknown', 'release', 'payflow_contract.wasm');
  
  if (!fs.existsSync(wasmPath)) {
    console.error('WASM file not found at:', wasmPath);
    process.exit(1);
  }

  console.log('WASM file found at:', wasmPath);

  // For now, we'll document the manual deployment steps
  // In production, this would use the Stellar SDK to deploy
  console.log('\n=== Manual Deployment Instructions ===');
  console.log('1. Install Soroban CLI:');
  console.log('   cargo install soroban-cli');
  console.log('\n2. Deploy the contract:');
  console.log(`   soroban contract deploy --wasm ${wasmPath} --source ${SECRET_KEY} --rpc-url ${STELLAR_RPC_URL} --network-passphrase "${STELLAR_NETWORK_PASSPHRASE}"`);
  console.log('\n3. Initialize the contract:');
  console.log('   soroban contract invoke --id <CONTRACT_ID> --source <SECRET> --rpc-url <RPC_URL> --network-passphrase "<PASSPHRASE>" initialize --owner <OWNER_ADDRESS>');
  console.log('\n4. Record the contract address and deployment transaction hash');
  console.log('5. Update the CONTRACT_ADDRESS in your .env file');
  console.log('6. Update the README with the deployment information');
}

deploy().catch(console.error);
