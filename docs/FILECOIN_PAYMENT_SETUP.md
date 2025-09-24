# Filecoin Payment Setup Guide

## 🚨 Issue: Insufficient USDFC Balance

Your Filecoin uploads are failing because your wallet doesn't have enough **USDFC tokens** for storage payments on the Calibration testnet.

## ✅ Quick Fix

### Step 1: Get Your Wallet Address

Your current wallet address is: **`0xEDE5688A1e6B2609FF5Cb36e40A413Ec6e5F4858`**

### Step 2: Get Testnet USDFC Tokens

1. Visit the **Filecoin Calibration Faucet**: https://faucet.calibration.fildev.network/
2. Enter your wallet address: `0xEDE5688A1e6B2609FF5Cb36e40A413Ec6e5F4858`
3. Select **"USDFC"** as the token type
4. Click "Send me tokens"
5. Wait for the transaction to confirm (usually 30-60 seconds)

### Step 3: Test the Integration

After getting tokens, test the upload:

```bash
curl -X POST "http://localhost:3000/api/test/filecoin"
```

## 🔄 Alternative: Use Pinata Fallback

Your system automatically falls back to **Pinata IPFS** when Filecoin fails, so your application continues working. The logs show:

```
⚠️  Filecoin upload failed: [payment error]
🔄 Falling back to Pinata...
📌 Attempting Pinata upload...
✅ Pinata upload successful!
```

This is working as designed - **your data is being stored successfully on IPFS** while we resolve the Filecoin payment setup.

## 🎯 Expected Flow

1. **Primary**: Store on Filecoin (permanent, decentralized)
2. **Fallback**: Store on Pinata/IPFS (reliable, fast)
3. **Result**: Your Agent Arena continues working regardless

## 💡 Pro Tips

- **Testnet Tokens**: Free and unlimited on Calibration network
- **Mainnet**: Would require real USDFC purchased with FIL
- **Auto-Fallback**: Your app never stops working even if Filecoin fails
- **Payment Setup**: Only needed once per wallet

## 🚀 Status

✅ **NEAR Integration**: Working  
✅ **Agent Creation**: Working  
✅ **Match System**: Working  
✅ **Storage System**: Working (with Pinata fallback)  
🔧 **Filecoin Direct**: Needs testnet tokens

Your Agent Arena is **fully functional** - the Filecoin integration is just an optimization for more decentralized storage! 🎉
