# Filecoin Integration for Agent Arena

This document describes the Filecoin integration that replaces Pinata/IPFS storage with decentralized Filecoin storage using the Synapse SDK.

## 🌟 Key Benefits

- **Decentralized Storage**: True decentralization with cryptographic storage proofs
- **Guaranteed Storage**: Automated payment streams ensure your data stays available
- **Content Addressing**: Verifiable data integrity through PieceCIDs
- **Seamless Migration**: Automatic fallback to Pinata during transition
- **Cost Efficient**: Competitive pricing with transparent cost structure

## 📋 Prerequisites

1. **Node.js 18+** and **pnpm**
2. **Filecoin Account**: Private key for transactions
3. **Tokens**:
   - **FIL**: For transaction gas fees
   - **USDFC**: For storage payments (stablecoin)

### Getting Test Tokens (Calibration Network)

For development and testing:

- **Test FIL**: https://faucet.calibnet.chainsafe-fil.io/funds.html
- **Test USDFC**: https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc

## 🚀 Quick Setup

### 1. Install Dependencies

The Filecoin Synapse SDK is already installed in your project:

```bash
# Already included in package.json
@filoz/synapse-sdk
ethers
```

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Filecoin configuration
FILECOIN_PRIVATE_KEY=0x1234567890abcdef... # Your private key
FILECOIN_NETWORK=calibration              # 'mainnet' or 'calibration'

# Legacy Pinata (fallback)
PINATA_JWT=your_pinata_jwt_token
```

### 3. Generate Private Key & Setup

Use the setup script to generate a private key and configure payments:

```bash
# Run the setup script
npx ts-node scripts/setup-filecoin.ts

# Follow the interactive prompts:
# 1. Choose network (calibration for testing)
# 2. Generate or enter private key
# 3. Fund your account with FIL and USDFC
# 4. Set up payment approvals
```

### 4. Manual Setup (Alternative)

If you prefer manual setup:

```javascript
import { ethers } from "ethers";
import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";

// 1. Generate private key
const wallet = ethers.Wallet.createRandom();
console.log("Private Key:", wallet.privateKey);
console.log("Address:", wallet.address);

// 2. Fund the address with FIL and USDFC tokens

// 3. Set up payments
const synapse = await Synapse.create({
  privateKey: wallet.privateKey,
  rpcURL: RPC_URLS.calibration.websocket,
  withCDN: true,
});

// Deposit USDFC for storage
await synapse.payments.deposit(ethers.parseUnits("100", 18));

// Approve storage service
const warmStorageAddress = await synapse.getWarmStorageAddress();
await synapse.payments.approveService(
  warmStorageAddress,
  ethers.parseUnits("10", 18), // Rate allowance
  ethers.parseUnits("1000", 18), // Lockup allowance
  BigInt(86400) // Max lockup period
);
```

## 🔧 Usage

### Smart Storage System

The application now uses a smart storage system that tries Filecoin first, then falls back to Pinata:

```javascript
import { smartUpload, smartDownload } from "@/lib/storage";

// Upload data (tries Filecoin first, falls back to Pinata)
const result = await smartUpload(data, {
  name: "my-file.json",
  description: "Agent match data",
  matchId: "123",
});

console.log(result.hash); // PieceCID (Filecoin) or IPFS hash (Pinata)
console.log(result.type); // 'filecoin' or 'ipfs'

// Download data (works with both Filecoin and IPFS)
const data = await smartDownload(result.hash, result.type);
```

### Direct Filecoin Usage

```javascript
import { uploadJSON, downloadJSON } from "@/lib/filecoin";

// Upload to Filecoin
const result = await uploadJSON(data, {
  name: "agent-response.json",
  description: "AI agent response data",
});

console.log("PieceCID:", result.pieceCid);
console.log("Size:", result.size);
console.log("Network:", result.network);

// Download from Filecoin
const data = await downloadJSON(result.pieceCid);
```

## 📊 Monitoring

### Storage Status API

Check the health of your storage services:

```bash
GET /api/storage/status
```

Response:

```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "preferredStorage": "filecoin",
    "services": {
      "filecoin": {
        "configured": true,
        "healthy": true,
        "info": {
          "balance": "95.5",
          "network": "calibration",
          "pricing": {
            "perTiBPerMonth": "2.0"
          }
        }
      },
      "pinata": {
        "configured": true,
        "healthy": true
      }
    },
    "recommendations": [
      "🚀 Both Filecoin and Pinata are configured. Filecoin will be used as primary with Pinata as fallback."
    ]
  }
}
```

### Balance Monitoring

```javascript
import { getStorageInfo } from "@/lib/filecoin";

const info = await getStorageInfo();
console.log("USDFC Balance:", info.balance);
console.log("Pricing per TiB/month:", info.pricing.perTiBPerMonth);
```

## 🔄 Migration from Pinata

### Automatic Migration

The system automatically handles the migration:

1. **New uploads**: Use Filecoin by default, fall back to Pinata if needed
2. **Existing data**: Remains accessible through IPFS gateways
3. **Gradual transition**: No disruption to existing functionality

### Manual Migration

Migrate specific items:

```javascript
import { migrateSingleItem, migrateBatch } from "@/lib/storage";

// Migrate a single item
const result = await migrateSingleItem("QmYourIPFSHash", {
  name: "migrated-item",
  description: "Migrated from IPFS",
});

// Batch migration
const items = [
  { hash: "QmHash1", metadata: { name: "item1" } },
  { hash: "QmHash2", metadata: { name: "item2" } },
];
const results = await migrateBatch(items);
```

## 💰 Costs

### Filecoin Storage Costs

- **Storage (no CDN)**: 2 USDFC per TiB/month
- **Storage (with CDN)**: 2.5 USDFC per TiB/month
- **Dataset creation**: 0.1 USDFC (one-time)
- **Gas fees**: ~0.001-0.01 FIL per transaction

### Cost Example

For a typical Agent Arena deployment:

- **100 matches/day** × **~1KB per match** = **36.5 MB/year**
- **Annual cost**: ~$0.0001 USDFC (essentially free for this data volume)
- **Setup cost**: ~1 USDFC for testing, 10-100 USDFC for production

## 🔍 Technical Details

### Storage Architecture

```
Smart Storage Layer
├── Primary: Filecoin (via Synapse SDK)
│   ├── Cryptographic storage proofs (PDP)
│   ├── Automated payments (FilecoinPay)
│   ├── Content addressing (PieceCID)
│   └── CDN acceleration (optional)
└── Fallback: Pinata/IPFS
    ├── Traditional IPFS pinning
    └── Gateway access
```

### Data Format

**Filecoin PieceCID**: `bafkzcibcd4bd...` (64-65 characters)
**IPFS Hash**: `QmYourHash...` or `bafybeihash...`

### Database Schema

The `rounds` table now includes:

```sql
ALTER TABLE rounds ADD storage_type TEXT(16); -- 'filecoin' or 'ipfs'
```

## 🛠 Development

### Local Development

1. Use **Calibration testnet** for development
2. Get free test tokens from faucets
3. Set `FILECOIN_NETWORK=calibration`

### Production Deployment

1. Switch to `FILECOIN_NETWORK=mainnet`
2. Fund account with real FIL and USDFC
3. Monitor balance and storage costs
4. Set up automated balance monitoring

### Environment Variables

```env
# Required
FILECOIN_PRIVATE_KEY=0x...    # Private key for transactions
FILECOIN_NETWORK=calibration  # Network selection

# Optional (fallback)
PINATA_JWT=eyJhbGciOi...      # Pinata API token

# Other existing vars
TURSO_CONNECTION_URL=...
GEMINI_API_KEY=...
```

## 🔐 Security

### Private Key Management

- **Never commit** private keys to version control
- Use **environment variables** for all secrets
- Consider using **key management services** for production
- **Rotate keys** periodically

### Network Security

- Filecoin transactions are **publicly visible**
- Data content is **encrypted** before storage (if needed)
- PieceCIDs provide **content verification**

## 🚨 Troubleshooting

### Common Issues

1. **"Filecoin not configured"**
   - Check `FILECOIN_PRIVATE_KEY` in `.env`
   - Ensure private key starts with `0x`

2. **"Insufficient balance"**
   - Check FIL balance for gas fees
   - Check USDFC balance for storage payments
   - Run `/api/storage/status` to see balances

3. **"Failed to connect to Filecoin"**
   - Check network connectivity
   - Verify `FILECOIN_NETWORK` setting
   - Try switching RPC endpoints

4. **"Storage upload failed"**
   - Check both FIL and USDFC balances
   - Verify payment service approvals
   - Check file size limits (65 bytes - 200 MiB)

### Debug Commands

```bash
# Check storage status
curl localhost:3000/api/storage/status

# Check environment
echo $FILECOIN_PRIVATE_KEY
echo $FILECOIN_NETWORK

# Check balances (in node console)
const { getStorageInfo } = require('./src/lib/filecoin');
getStorageInfo().then(console.log);
```

## 📚 Resources

- **Synapse SDK**: https://github.com/FilOzone/synapse-sdk
- **Example dApp**: https://github.com/FIL-Builders/fs-upload-dapp
- **Filecoin Docs**: https://docs.filecoin.io/
- **USDFC Token**: https://docs.secured.finance/usdfc-stablecoin/
- **Support**: Filecoin Slack #fil-services channel

## 🎯 Next Steps

1. ✅ **Set up Filecoin** using the setup script
2. ✅ **Test uploads** in development
3. ✅ **Monitor storage** costs and balance
4. 🔄 **Migrate existing data** (optional)
5. 🚀 **Deploy to production** with mainnet

---

**Need Help?**

- Check `/api/storage/status` for system health
- Review the setup script output
- Join the Filecoin Slack for community support
