import React, { useState } from 'react';
import { apiClient } from '../api/client';
import type { QuestionDetail, AIValidationResult } from '../types';
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  Loader2,
  Play,
  Sliders,
  Sparkles,
  XCircle
} from 'lucide-react';

export const QualityInspectorPage: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState('ml.optimization.gradient_descent');
  const [difficulty, setDifficulty] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
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
      setGenerateError(null);
      const q = await apiClient.generateQuestion({
        concept_id: selectedConcept,
        subject: 'Machine Learning',
        topic: 'Optimization',
        difficulty: difficulty
      });
      setGeneratedQuestion(q);
    } catch (err: any) {
      setGenerateError(err.message || 'Error generating AI question');
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
    <div className="p-6 md:p-10 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Question Quality & Pedagogical Validator
        </h1>
        <p className="text-xs text-[#7f8ba0] mt-1">
          Internal heuristic engine verifying ExamBuddy bias detection (option length bias, lazy distractors, duplicates).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Validation Tester */}
        <div className="p-5 rounded-lg bg-[#11141c] border border-[#202738] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>ExamBuddy Rule Verification</span>
            </h2>
            <span className="text-[10px] text-[#556379] font-mono">Pedagogical Guard</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-[#738096]">Load test scenario preset:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loadPreset('valid')}
                className="p-2 text-left text-xs bg-[#161a25] hover:bg-[#1f2638] border border-[#263146] rounded-md text-[#cfd7e5] transition-colors"
              >
                ✓ Valid Question
              </button>
              <button
                type="button"
                onClick={() => loadPreset('length_anomaly')}
                className="p-2 text-left text-xs bg-[#161a25] hover:bg-[#1f2638] border border-[#263146] rounded-md text-rose-300 transition-colors"
              >
                ⚠ Length Anomaly
              </button>
              <button
                type="button"
                onClick={() => loadPreset('lazy_distractors')}
                className="p-2 text-left text-xs bg-[#161a25] hover:bg-[#1f2638] border border-[#263146] rounded-md text-rose-300 transition-colors"
              >
                ⚠ Lazy Distractors
              </button>
              <button
                type="button"
                onClick={() => loadPreset('duplicate_options')}
                className="p-2 text-left text-xs bg-[#161a25] hover:bg-[#1f2638] border border-[#263146] rounded-md text-rose-300 transition-colors"
              >
                ⚠ Duplicate Options
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="custom-json-editor" className="block text-xs font-semibold text-[#8c98ad] mb-1 flex items-center gap-1">
              <FileJson className="w-3.5 h-3.5 text-blue-400" />
              <span>Question Payload (JSON)</span>
            </label>
            <textarea
              id="custom-json-editor"
              rows={8}
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              className="w-full bg-[#0a0d13] border border-[#222938] rounded-md p-3 font-mono text-xs text-[#a5b4fc] focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleValidateCustom}
            disabled={validating}
            className="w-full py-2.5 bg-[#1b2230] hover:bg-[#252f44] text-xs font-medium text-white border border-[#2b364c] rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {validating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running pedagogical validator...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-blue-400" />
                <span>Run Validation Heuristics</span>
              </>
            )}
          </button>

          {validationResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                validationResult.is_valid
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {validationResult.is_valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Passed: Clean Pedagogical Structure</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Rejected ({validationResult.errors.length} quality violations detected)</span>
                  </>
                )}
              </div>
              {!validationResult.is_valid && (
                <ul className="list-disc list-inside space-y-1 text-rose-200/90 pl-1">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Panel 2: Pipeline Fallback Tester */}
        <div className="p-5 rounded-lg bg-[#11141c] border border-[#202738] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Generation Pipeline & Fallback</span>
            </h2>
            <span className="text-[10px] text-[#556379] font-mono">Groq API</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="inspector-concept-select" className="block text-xs font-medium text-[#738096] mb-1">
                Target Concept
              </label>
              <select
                id="inspector-concept-select"
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                className="w-full bg-[#0a0d13] border border-[#222938] rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ml.optimization.gradient">Gradient</option>
                <option value="ml.optimization.learning_rate">Learning Rate</option>
                <option value="ml.optimization.gradient_descent">Gradient Descent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#738096] mb-1">Difficulty Level</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1.5 text-xs rounded-md border capitalize font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-[#151a24] text-[#8c98ad] border-[#252e3e] hover:bg-[#1a212e]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating & validating via Groq...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Generate Validated MCQ</span>
                </>
              )}
            </button>

            {generateError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{generateError}</span>
              </div>
            )}
          </div>

          {generatedQuestion && (
            <div className="p-4 bg-[#0a0d13] border border-[#1f2638] rounded-lg text-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#718096]">
                <span className="font-semibold text-[#8e9bb0]">Generated Question Preview</span>
                <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 uppercase font-mono text-[10px]">
                  {generatedQuestion.difficulty}
                </span>
              </div>

              <div className="font-semibold text-white leading-relaxed">
                {generatedQuestion.question_text}
              </div>

              <div className="space-y-1.5">
                {generatedQuestion.options.map((o) => (
                  <div
                    key={o.id}
                    className={`p-2 rounded-md flex items-center justify-between ${
                      o.id === generatedQuestion.correct_option
                        ? 'bg-emerald-950/40 text-emerald-300 font-medium border border-emerald-800/50'
                        : 'text-[#7e8aa0] bg-[#11141c]'
                    }`}
                  >
                    <span>{o.id}. {o.text}</span>
                    {o.id === generatedQuestion.correct_option && (
                      <span className="text-[10px] text-emerald-400 uppercase font-bold">
                        Correct Answer
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-[#788599] pt-1 leading-relaxed border-t border-[#1a2130]">
                <strong className="text-[#a0adc2]">Explanation:</strong> {generatedQuestion.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
