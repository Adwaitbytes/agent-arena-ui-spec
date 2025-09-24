# Gemini Model Configuration

This document outlines the Gemini model usage across the agent arena application.

## Model Assignment Strategy

### Normal Agent Operations

- **Model**: `gemini-1.5-flash`
- **API Key**: `GEMINI_API_KEY`
- **Use Cases**:
  - Individual agent response generation (`/api/generate`)
  - Agent battle responses in match orchestration (`/api/match/orchestrate`)
  - Standard agent personality interactions

### Superagent Operations (AI Judge)

- **Model**: `gemini-2.0-flash-exp` (Gemini 2.0 Flash Experimental)
- **API Key**: `SUPERAGENT_GEMINI_KEY`
- **Use Cases**:
  - Advanced AI judging of agent battles (`superagentJudge` function)
  - Test judging endpoint (`/api/test-judge`)
  - Complex evaluation and scoring tasks

## Implementation Details

### Files Updated:

1. `/src/app/api/generate/route.ts` - Normal agent responses
2. `/src/app/api/match/orchestrate/route.ts` - Match battles and superagent judging
3. `/src/app/api/test-judge/route.ts` - Test judging functionality

### Rationale:

- **Gemini 1.5 Flash**: Fast, efficient, cost-effective for high-volume agent interactions
- **Gemini 2.0 Flash Experimental**: Latest capabilities for sophisticated judging and evaluation tasks

## Environment Variables Required:

```env
GEMINI_API_KEY=<key-for-normal-agents>
SUPERAGENT_GEMINI_KEY=<key-for-superagent-judge>
```

## Performance Characteristics:

- Normal agents prioritize speed and consistency for user interactions
- Superagent prioritizes advanced reasoning and nuanced evaluation capabilities
