import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({ pinataJWTKey: process.env.PINATA_JWT!, pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud' });

export async function pinMatchData(data: any) {
  const { IpfsHash } = await pinata.pinJSONToIPFS(data, { pinataMetadata: { name: `match-${data.id}-${Date.now()}` } });
  return IpfsHash;
}

export function getMatchViaCID(cid: string) {
  return `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${cid}`;
}