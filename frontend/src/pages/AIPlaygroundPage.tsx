import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { QuestionDetail, AIValidationResult } from '../types';

export const AIPlaygroundPage: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState('ml.optimization.gradient_descent');
  const [difficulty, setDifficulty] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<QuestionDetail | null>(null);

  // Custom question validation test
  const [customJson, setCustomJson] = useState(`{
  "question": "What happens if learning rate is too large in gradient descent?",
  "options": [
    {"id": "A", "text": "The loss oscillates violently and diverges away from minimum"},
    {"id": "B", "text": "All of the above"},
    {"id": "C", "text": "Both A and B"},
    {"id": "D", "text": "None of these"}
  ],
  "correct_option": "A",
  "explanation": "A large alpha overshoots the minimum.",
  "concept_id": "ml.optimization.learning_rate",
  "difficulty": "medium"
}`);

  const [validationResult, setValidationResult] = useState<AIValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const q = await apiClient.generateQuestion({
        concept_id: selectedConcept,
        subject: 'Machine Learning',
        topic: 'Optimization',
        difficulty: difficulty
      });
      setGeneratedQuestion(q);
    } catch (err: any) {
      alert('Error generating: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleValidateCustom = async () => {
    try {
      setValidating(true);
      const parsed = JSON.parse(customJson);
      const res = await apiClient.validateQuestion(parsed);
      setValidationResult(res);
    } catch (e: any) {
      setValidationResult({
        is_valid: false,
        errors: [`JSON Syntax Error: ${e.message}`]
      });
    } finally {
      setValidating(false);
    }
  };

  const loadPreset = (presetType: 'valid' | 'length_anomaly' | 'lazy_distractors' | 'duplicate_options') => {
    if (presetType === 'valid') {
      setCustomJson(`{
  "question": "In standard Gradient Descent, what does the learning rate alpha determine?",
  "options": [
    {"id": "A", "text": "The step size taken along the negative gradient direction"},
    {"id": "B", "text": "The total number of parameters in the deep network"},
    {"id": "C", "text": "The curvature of the level curves at the origin"},
    {"id": "D", "text": "The batch size utilized for parallel GPU matrix calculation"}
  ],
  "correct_option": "A",
  "explanation": "Alpha scales the gradient vector to control how far weights jump per iteration.",
  "concept_id": "ml.optimization.learning_rate",
  "difficulty": "medium"
}`);
    } else if (presetType === 'length_anomaly') {
      setCustomJson(`{
  "question": "What is the role of learning rate?",
  "options": [
    {"id": "A", "text": "A crucial scaling factor and step size hyperparameter that dictates exactly how far model parameter weights jump along the negative gradient vector at every step to prevent diverging or overshooting the optimal global loss minimum"},
    {"id": "B", "text": "A loss metric"},
    {"id": "C", "text": "An activation function"},
    {"id": "D", "text": "A dataset split"}
  ],
  "correct_option": "A",
  "explanation": "Learning rate is the step size.",
  "concept_id": "ml.optimization.learning_rate",
  "difficulty": "easy"
}`);
    } else if (presetType === 'lazy_distractors') {
      setCustomJson(`{
  "question": "Why do we minimize the loss function?",
  "options": [
    {"id": "A", "text": "To improve model prediction accuracy on target tasks"},
    {"id": "B", "text": "To format memory buffers into arrays"},
    {"id": "C", "text": "All of the above"},
    {"id": "D", "text": "None of these"}
  ],
  "correct_option": "A",
  "explanation": "Minimizing loss reduces prediction errors.",
  "concept_id": "ml.optimization.gradient_descent",
  "difficulty": "medium"
}`);
    } else if (presetType === 'duplicate_options') {
      setCustomJson(`{
  "question": "What is the gradient vector update direction?",
  "options": [
    {"id": "A", "text": "Negative gradient direction"},
    {"id": "B", "text": "Negative gradient direction"},
    {"id": "C", "text": "Positive gradient direction"},
    {"id": "D", "text": "Zero vector direction"}
  ],
  "correct_option": "A",
  "explanation": "Descent requires stepping in the negative gradient direction.",
  "concept_id": "ml.optimization.gradient",
  "difficulty": "easy"
}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>AI Service & ExamBuddy Quality Inspector</span>
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Validate that AI-generated questions strictly comply with schema & pedagogical quality standards,
          preventing answer leaks, option length anomalies, and lazy distractors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Generate & Fallback Test */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Question Pipeline & Fallback</span>
            </h2>
            <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30">
              Resilient AI Layer
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Concept</label>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ml.optimization.gradient">ml.optimization.gradient (Gradient)</option>
                <option value="ml.optimization.learning_rate">ml.optimization.learning_rate (Learning Rate)</option>
                <option value="ml.optimization.gradient_descent">ml.optimization.gradient_descent (Gradient Descent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty</label>
              <div className="flex items-center gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                      difficulty === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Generate / Retrieve Validated Question</span>
            </button>
          </div>

          {/* Generated Question Display */}
          {generatedQuestion && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validation: PASSED</span>
                </span>
                <span className="font-mono text-slate-500">{generatedQuestion.id}</span>
              </div>

              <h4 className="font-semibold text-white text-sm">{generatedQuestion.question_text}</h4>

              <div className="space-y-1.5">
                {generatedQuestion.options.map((o) => (
                  <div
                    key={o.id}
                    className={`p-2 rounded-lg border ${
                      o.id === generatedQuestion.correct_option
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong>{o.id}.</strong> {o.text}
                  </div>
                ))}
              </div>

              <p className="text-slate-400 pt-1">
                <strong>Explanation:</strong> {generatedQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Section 2: ExamBuddy Quality Inspector */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>ExamBuddy Failure Tester</span>
            </h2>
            <span className="text-[11px] font-semibold bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/30">
              Live Validator
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400">Load Test Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => loadPreset('valid')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium text-left"
              >
                ✅ Valid Standard Question
              </button>
              <button
                onClick={() => loadPreset('length_anomaly')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 text-[11px] font-medium text-left"
              >
                ❌ Problem 1: Long Option Clue
              </button>
              <button
                onClick={() => loadPreset('lazy_distractors')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 text-[11px] font-medium text-left"
              >
                ❌ Problem 2/3: Lazy Distractors
              </button>
              <button
                onClick={() => loadPreset('duplicate_options')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 text-[11px] font-medium text-left"
              >
                ❌ Problem 4: Duplicate Options
              </button>
            </div>
          </div>

          {/* JSON Textarea */}
          <div>
            <textarea
              rows={8}
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleValidateCustom}
            disabled={validating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Run ExamBuddy Quality Checks</span>
          </button>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                validationResult.is_valid
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {validationResult.is_valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Question Passed All Pedagogical Checks</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Question Rejected ({validationResult.errors.length} rule failures)</span>
                  </>
                )}
              </div>

              {!validationResult.is_valid && (
                <ul className="list-disc list-inside space-y-1 pl-1 text-rose-200">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
