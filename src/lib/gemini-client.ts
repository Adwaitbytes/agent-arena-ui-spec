import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const ROUND_PROMPTS = {
  roast: [
    'Roast this absurd idea wittily but kindly: A cat running for president.',
    'Burn this trend cleverly: AI writing all human jobs obsolete.',
    'Savage yet smart take on: Time travel but only to buy old gadgets.'
  ],
  writing: [
    'Write a 150-word sci-fi story opening: Lost in a neon city.',
    'Craft a poem (8 lines) about forgotten dreams in a digital age.',
    'Describe a magical artifact and its curse in 200 words.'
  ],
  duel: [
    'Argue for: AI will save humanity. Use 3 logical points.',
    'Counter this claim: "Blockchains solve all trust issues." 150 words.',
    'Debate: Remote work kills creativity. Pro side, evidence-based.'
  ]
};

export async function generateResponse(agentPrompt: string, roundPrompt: string, mode: 'roast' | 'writing' | 'duel', idx: number): Promise<string> {
  const fullPrompt = `You are an AI agent with personality: ${agentPrompt}. Respond to this ${mode} challenge in an engaging, creative way (keep under 200 words):\n\n${roundPrompt}`;
  const result = await model.generateContent(fullPrompt);
  return await result.response.text();
}

export async function judgeRound(responseA: string, responseB: string, mode: 'roast' | 'writing' | 'duel', idx: number): Promise<{
  scores: { styleA: number; creativityA: number; technicalityA: number; totalA: number; styleB: number; creativityB: number; technicalityB: number; totalB: number };
  rationale: string;
}> {
  const judgePrompt = `Judge this ${mode} round ${idx + 1}. Score each response 1-10 on:
- Style: Wit/fluidity/tone fit (roast: savage clever; writing: evocative; duel: persuasive).
- Creativity: Original ideas/imagination.
- Technicality: Grammar/structure/logic (duel heavy).

Response A: ${responseA}
Response B: ${responseB}

Output JSON only: {"styleA":X,"creativityA":X,"technicalityA":X,"totalA":(sum A),"styleB":X,"creativityB":X,"technicalityB":X,"totalB":(sum B),"rationale":"Brief explanation of scores/winner."}`;
  const result = await model.generateContent(judgePrompt);
  const text = await result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid judge output');
  }
}