import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const __dirname = dirname(fileURLToPath(import.meta.url));
const benchmarks = JSON.parse(
  fs.readFileSync(join(__dirname, '../data/climbing-benchmarks.json'), 'utf-8')
);
const BENCHMARKS_JSON = JSON.stringify(benchmarks, null, 2);

const TRAINING_PLAN_TOOL = {
  name: 'create_training_plan',
  description: 'Create a structured weekly training plan for a rock climber based on their weakness profile',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'array',
        items: { type: 'string' },
        description: '3-4 short bullet points summarising the athlete\'s current status and training focus. Each item is one concise sentence.'
      },
      focus_rationale: {
        type: 'array',
        items: { type: 'string' },
        description: '2-3 bullet points explaining why these areas were prioritised. Each item is one concise sentence.'
      },
      weekly_structure: {
        type: 'array',
        items: { type: 'string' },
        description: '2-4 bullet points describing how to structure sessions across the week. Each item is one concise sentence.'
      },
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            metric: { type: 'string', description: 'Which climbing metric this targets' },
            sets: { type: 'number' },
            reps_or_duration: { type: 'string', description: 'e.g. "5 reps" or "7 seconds on / 3 off"' },
            rest: { type: 'string', description: 'Rest period between sets' },
            frequency: { type: 'string', description: 'e.g. "2x/week"' },
            progression: { type: 'string', description: 'How to progress over weeks' },
            rationale: { type: 'string', description: 'Why this exercise for this climber' },
            priority: {
              type: 'string',
              enum: ['priority', 'development', 'maintenance'],
              description: 'priority = biggest grade gap, development = minor weakness, maintenance = already at level'
            }
          },
          required: ['name', 'metric', 'sets', 'reps_or_duration', 'rest', 'frequency', 'progression', 'rationale', 'priority']
        }
      }
    },
    required: ['summary', 'focus_rationale', 'weekly_structure', 'exercises']
  }
};

const buildSystemPrompt = () => `You are an expert rock climbing coach specializing in performance testing and training periodization. You analyze climbers' physical testing data and create precise, science-based training plans.

When given a weakness profile (sorted by grade gap — most grades behind first), you:
1. Prioritize exercises targeting the largest grade gaps (these are the "limiting factors")
2. Include maintenance work for metrics at or above target
3. Balance training load to avoid overuse injuries
4. Give concrete sets/reps with specific rest periods, not vague advice
5. Explain the WHY behind each exercise choice

Here are the complete benchmark tables you use to contextualize scores:

<benchmarks>
${BENCHMARKS_JSON}
</benchmarks>`;

// POST /api/training-plan
router.post('/', async (req, res) => {
  const { weaknesses, targetGrade, gender, messages: prevMessages = [] } = req.body;

  if (!weaknesses || weaknesses.length === 0) {
    return res.status(400).json({ error: 'No weakness data provided' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    const weaknessLines = weaknesses.map(w =>
      `- ${w.metric_name}: score=${w.user_score} ${w.unit}, grade_equivalent=${w.grade_equivalent}, grade_gap=${w.grade_gap.toFixed(2)} grades behind target, is_weakness=${w.is_weakness}`
    ).join('\n');

    const userContent = prevMessages.length === 0
      ? `Climber profile:
- Target grade: ${targetGrade}
- Gender: ${gender}

Weakness analysis (sorted by grade gap, largest first):
${weaknessLines}

Create a complete training plan addressing these weaknesses. Focus your strongest recommendations on metrics with the largest grade gaps.`
      : req.body.feedback;

    const messages = [
      ...prevMessages,
      { role: 'user', content: userContent }
    ];

    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(),
          cache_control: { type: 'ephemeral' }
        }
      ],
      tools: [TRAINING_PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'create_training_plan' },
      messages
    });

    stream.on('inputJson', (delta) => {
      sendEvent('generating', { delta });
    });

    const finalMessage = await stream.finalMessage();

    const toolUse = finalMessage.content.find(b => b.type === 'tool_use');
    const plan = toolUse?.input ?? null;

    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: finalMessage.content }
    ];

    sendEvent('plan', {
      plan,
      messages: updatedMessages,
      usage: {
        input_tokens: finalMessage.usage.input_tokens,
        output_tokens: finalMessage.usage.output_tokens,
        cache_read_input_tokens: finalMessage.usage.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens: finalMessage.usage.cache_creation_input_tokens ?? 0
      }
    });

    res.end();
  } catch (err) {
    console.error('Training plan error:', err);
    sendEvent('error', { message: err.message });
    res.end();
  }
});

export default router;
