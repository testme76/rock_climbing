import { useState } from 'react';
import { streamTrainingPlan } from '../services/api';

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
};

const Bullets = ({ items, textClass = 'text-gray-700', dotClass = 'bg-gray-400' }) => (
  <ul className="space-y-1.5">
    {toArray(items).map((s, i) => (
      <li key={i} className={`flex gap-2 text-sm ${textClass}`}>
        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />
        {s}
      </li>
    ))}
  </ul>
);

const PRIORITY_STYLES = {
  priority: {
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    label: 'Priority'
  },
  development: {
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    label: 'Development'
  },
  maintenance: {
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    label: 'Maintenance'
  }
};

function ExerciseCard({ exercise }) {
  const style = PRIORITY_STYLES[exercise.priority] ?? PRIORITY_STYLES.development;
  return (
    <div className={`bg-white border-2 ${style.border} rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-base">{exercise.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{exercise.metric}</p>
        </div>
        <span className={`${style.badge} text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap`}>
          {style.label}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Sets</p>
          <p className="font-semibold">{exercise.sets}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Reps / Duration</p>
          <p className="font-semibold">{exercise.reps_or_duration}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Rest</p>
          <p className="font-semibold">{exercise.rest}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Frequency</p>
          <p className="font-semibold">{exercise.frequency}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="text-xs text-gray-600 leading-relaxed"><span className="font-medium">Progression:</span> {exercise.progression}</p>
        <p className="text-xs text-gray-600 leading-relaxed"><span className="font-medium">Why:</span> {exercise.rationale}</p>
      </div>
    </div>
  );
}

function PlanView({ plan, usage }) {
  console.log('PlanView received plan:', JSON.stringify(plan, null, 2));

  const byPriority = {
    priority: plan.exercises.filter(e => e.priority === 'priority'),
    development: plan.exercises.filter(e => e.priority === 'development'),
    maintenance: plan.exercises.filter(e => e.priority === 'maintenance')
  };

  return (
    <div className="space-y-6">
      {/* Cache stats */}
      {usage && usage.cache_read_input_tokens > 0 && (
        <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-3 py-1.5 w-fit">
          <span>Cache hit:</span>
          <span className="font-semibold">{usage.cache_read_input_tokens.toLocaleString()} tokens saved</span>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
        <Bullets items={plan.summary} textClass="text-blue-900" dotClass="bg-blue-400" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Weekly Structure</h4>
          <Bullets items={plan.weekly_structure} color="gray" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Focus Rationale</h4>
          <Bullets items={plan.focus_rationale} color="gray" />
        </div>
      </div>

      {['priority', 'development', 'maintenance'].map(tier => {
        const exercises = byPriority[tier];
        if (exercises.length === 0) return null;
        const style = PRIORITY_STYLES[tier];
        return (
          <div key={tier}>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-3">
              {style.label} ({exercises.length})
            </h3>
            <div className="space-y-3">
              {exercises.map((ex, i) => <ExerciseCard key={i} exercise={ex} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrainingPlan({ weaknesses, targetGrade, gender }) {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);

  const generate = async (isRegenerate = false) => {
    setGenerating(true);
    setGeneratingText('');
    setError(null);

    try {
      await streamTrainingPlan(
        { weaknesses, targetGrade, gender, messages: isRegenerate ? messages : [], feedback: isRegenerate ? feedback : undefined },
        (delta) => setGeneratingText(prev => prev + delta),
        (result) => {
          console.log('SSE plan event received:', JSON.stringify(result, null, 2));
          setPlan(result.plan);
          setUsage(result.usage);
          setMessages(result.messages);
          setGenerating(false);
          setFeedback('');
        },
        (errMsg) => {
          setError(errMsg);
          setGenerating(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  };

  if (!plan && !generating) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">AI Training Plan</h2>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4 text-sm">
            Generate a personalized training plan based on your weakness profile.
            Uses Claude AI with structured output and prompt caching.
          </p>
          <button
            onClick={() => generate(false)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Generate Training Plan
          </button>
        </div>
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  if (generating) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">AI Training Plan</h2>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 font-medium">Claude is building your plan...</span>
          </div>
          {generatingText && (
            <pre className="text-xs text-gray-500 bg-gray-50 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-40 font-mono">
              {generatingText}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">AI Training Plan</h2>
        <button
          onClick={() => { setPlan(null); setMessages([]); setUsage(null); }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset
        </button>
      </div>

      <PlanView plan={plan} usage={usage} />

      {/* Multi-turn feedback */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Refine your plan</h3>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder='e.g. "I can only train 3x/week" or "I have a finger injury, avoid crimping"'
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => generate(true)}
            disabled={!feedback.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Regenerate with Feedback
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
