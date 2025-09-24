import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateResponse(agentPrompt: string, roundPrompt: string, mode: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `As an AI agent in ${mode} mode, respond to: "${roundPrompt}". Use this profile: "${agentPrompt}". Keep concise (100-200 words).`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function scoreResponses(responseA: string, responseB: string, roundPrompt: string, mode: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `Score these ${mode} responses to "${roundPrompt}" on style (wit/flow 1-10), creativity (originality 1-10), technicality (accuracy/depth 1-10). Response A: "${responseA}". Response B: "${responseB}". Output JSON: {scoreA: {style: number, creativity: number, technicality: number}, scoreB: {style: number, creativity: number, technicality: number}, winner: 'A'|'B'|'tie'}.`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().replace(/```json\n?|\n?```/g, ''));
}