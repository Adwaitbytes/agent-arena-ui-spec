import { GolemBaseClient } from 'golem-base-sdk';
import { ethers } from 'ethers'; // Assuming SDK uses ethers under the hood

let client: GolemBaseClient | null = null;

export const getGolemClient = async () => {
  if (client) return client;
  
  const rpcUrl = process.env.GOLEM_TESTNET_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!rpcUrl || !privateKey) {
    throw new Error('Missing Golem env vars: GOLEM_TESTNET_RPC_URL and PRIVATE_KEY');
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  client = new GolemBaseClient({ wallet, chainId: 11155111 }); // Testnet chain ID, adjust if needed
  
  return client;
};

export const createMatchEntity = async (matchData: {
  id: number;
  mode: string;
  agents: { id: number; name: string; }[];
  winner: number;
  scores: { a: number; b: number; };
  summary?: string;
}) => {
  const golem = await getGolemClient();
  
  // Schema for matches entity - adjust based on Golem schema
  const entity = {
    schema: 'matches',
    data: {
      matchId: matchData.id,
      mode: matchData.mode,
      agentA: matchData.agents[0].id,
      agentB: matchData.agents[1].id,
      winner: matchData.winner,
      scoreA: matchData.scores.a,
      scoreB: matchData.scores.b,
      summary: matchData.summary,
      timestamp: Date.now(),
    },
    // TTL or other params if needed
  };
  
  const tx = await golem.entities.create(entity);
  return { txHash: tx.hash, entityId: tx.entityId };
};