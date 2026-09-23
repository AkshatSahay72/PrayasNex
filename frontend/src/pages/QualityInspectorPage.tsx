import React, { useState } from 'react';
import { apiClient } from '../api/client';
import type { QuestionDetail, AIValidationResult } from '../types';

export const QualityInspectorPage: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState('ml.optimization.gradient_descent');
  const [difficulty, setDifficulty] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<QuestionDetail | null>(null);

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
    <div className="p-6 md:p-10 max-w-5xl space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Question Quality & Validation Inspector</h1>
        <p className="text-xs text-[#7f8ba0] mt-1">
          Internal testing tool to verify ExamBuddy failure detection (option length bias, lazy distractors, duplicates).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Validation Tester */}
        <div className="p-5 rounded-lg bg-[#11151e] border border-[#222938] space-y-4">
          <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            ExamBuddy Rule Verification
          </h2>

          <div className="space-y-1">
            <span className="text-xs text-[#738096]">Load test scenario:</span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => loadPreset('valid')}
                className="p-2 text-left text-xs bg-[#161a24] hover:bg-[#1f2533] border border-[#273042] rounded text-[#cfd7e5]"
              >
                Valid question
              </button>
              <button
                onClick={() => loadPreset('length_anomaly')}
                className="p-2 text-left text-xs bg-[#161a24] hover:bg-[#1f2533] border border-[#273042] rounded text-rose-300"
              >
                Length anomaly
              </button>
              <button
                onClick={() => loadPreset('lazy_distractors')}
                className="p-2 text-left text-xs bg-[#161a24] hover:bg-[#1f2533] border border-[#273042] rounded text-rose-300"
              >
                Lazy distractors
              </button>
              <button
                onClick={() => loadPreset('duplicate_options')}
                className="p-2 text-left text-xs bg-[#161a24] hover:bg-[#1f2533] border border-[#273042] rounded text-rose-300"
              >
                Duplicate options
              </button>
            </div>
          </div>

          <div>
            <textarea
              rows={7}
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              className="w-full bg-[#0c0f16] border border-[#222938] rounded p-2.5 font-mono text-xs text-[#a5b4fc] focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleValidateCustom}
            disabled={validating}
            className="w-full py-2 bg-[#1b2230] hover:bg-[#252f44] text-xs font-medium text-white border border-[#2b364c] rounded transition-colors"
          >
            {validating ? 'Running validator...' : 'Run validation checks'}
          </button>

          {validationResult && (
            <div
              className={`p-3 rounded border text-xs space-y-1.5 ${
                validationResult.is_valid
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <div className="font-semibold">
                {validationResult.is_valid
                  ? 'Passed: Valid pedagogical structure'
                  : `Rejected (${validationResult.errors.length} errors)`}
              </div>
              {!validationResult.is_valid && (
                <ul className="list-disc list-inside space-y-0.5 text-rose-200">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Panel 2: Pipeline Fallback Tester */}
        <div className="p-5 rounded-lg bg-[#11151e] border border-[#222938] space-y-4">
          <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            Generation Pipeline & Fallback
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#738096] mb-1">Concept</label>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                className="w-full bg-[#0c0f16] border border-[#222938] rounded p-2 text-xs text-white"
              >
                <option value="ml.optimization.gradient">Gradient</option>
                <option value="ml.optimization.learning_rate">Learning Rate</option>
                <option value="ml.optimization.gradient_descent">Gradient Descent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#738096] mb-1">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1 text-xs rounded border capitalize ${
                      difficulty === d
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-[#151a24] text-[#8c98ad] border-[#252e3e]'
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
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition-colors"
            >
              {generating ? 'Processing...' : 'Fetch / generate validated question'}
            </button>
          </div>

          {generatedQuestion && (
            <div className="p-3 bg-[#0c0f16] border border-[#1f2635] rounded text-xs space-y-2">
              <div className="font-semibold text-white">
                {generatedQuestion.question_text}
              </div>
              <div className="space-y-1">
                {generatedQuestion.options.map((o) => (
                  <div
                    key={o.id}
                    className={`p-1.5 rounded ${
                      o.id === generatedQuestion.correct_option
                        ? 'bg-emerald-950/40 text-emerald-300 font-medium'
                        : 'text-[#7e8aa0]'
                    }`}
                  >
                    {o.id}. {o.text}
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-[#6d7b91] pt-1">
                Explanation: {generatedQuestion.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
