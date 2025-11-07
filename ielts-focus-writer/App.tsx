import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, EssayData, GeminiFeedback } from './types';
import { STAGE_CONFIGS, STAGE_ORDER, RECIPIENT_EMAIL } from './constants';
import { fetchIELTSPrompt, getEssayFeedback } from './services/geminiService';
import Timer from './components/Timer';
import { Loader2, Send, CheckCircle2, AlertCircle, BookOpen, ArrowRight, RotateCcw, List } from 'lucide-react';

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.Initial);
  const [timeLeft, setTimeLeft] = useState(0);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [essayData, setEssayData] = useState<EssayData>({
    outline: "",
    introduction: "",
    body1: "",
    body2: "",
    conclusion: "",
  });
  const [feedback, setFeedback] = useState<GeminiFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const timerInterval = useRef<number | null>(null);

  const startStage = useCallback((newStage: Stage) => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setStage(newStage);
    setTimeLeft(STAGE_CONFIGS[newStage].durationSeconds);
  }, []);

  useEffect(() => {
    if (stage !== Stage.Initial && stage !== Stage.Finished && timeLeft > 0) {
      timerInterval.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
            }
            // Move to next stage automatically
            const currentIndex = STAGE_ORDER.indexOf(stage);
            if (currentIndex < STAGE_ORDER.length - 1) {
              startStage(STAGE_ORDER[currentIndex + 1]);
            } else {
              startStage(Stage.Finished);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [stage, startStage, timeLeft]);

  const handleStartApp = async () => {
    setIsLoading(true);
    const fetchedPrompt = await fetchIELTSPrompt();
    setPrompt(fetchedPrompt);
    setIsLoading(false);
    startStage(Stage.Outline);
  };

  const handleRedo = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setStage(Stage.Initial);
    setTimeLeft(0);
    setPrompt("");
    setIsLoading(false);
    setEssayData({
      outline: "",
      introduction: "",
      body1: "",
      body2: "",
      conclusion: "",
    });
    setFeedback(null);
    setIsGeneratingFeedback(false);
  };

  const handleSkipStage = () => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      startStage(STAGE_ORDER[currentIndex + 1]);
    } else {
      startStage(Stage.Finished);
    }
  };

  const updateEssayPart = (part: keyof EssayData, text: string) => {
    setEssayData((prev) => ({ ...prev, [part]: text }));
  };

  const compileFullEssay = () => {
    const parts = [
      essayData.introduction,
      essayData.body1,
      essayData.body2,
      essayData.conclusion
    ];
    return parts.filter(Boolean).join('\n\n');
  };

  const generateMailtoLink = () => {
    const subject = encodeURIComponent("IELTS Writing Task 2 Practice Submission");
    const body = encodeURIComponent(
      `Prompt: ${prompt}\n\n` +
      `Outline:\n${essayData.outline}\n\n` +
      `Full Essay:\n${compileFullEssay()}`
    );
    return `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const getAIReport = async () => {
    if (isGeneratingFeedback || feedback) return;
    setIsGeneratingFeedback(true);
    try {
      const fb = await getEssayFeedback(prompt, compileFullEssay());
      setFeedback(fb);
    } catch (e) {
      console.error("Could not fetch feedback", e);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // Trigger feedback generation upon finishing
  useEffect(() => {
    if (stage === Stage.Finished) {
      getAIReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);


  const renderInputStage = () => {
    let currentPartKey: keyof EssayData | null = null;
    let readOnlyParts: { label: string; text: string }[] = [];

    if (stage === Stage.Outline) {
      currentPartKey = 'outline';
    } else if (stage === Stage.Introduction) {
      readOnlyParts = [{ label: 'Outline', text: essayData.outline }];
      currentPartKey = 'introduction';
    } else if (stage === Stage.Body1) {
      readOnlyParts = [
        { label: 'Outline', text: essayData.outline },
        { label: 'Introduction', text: essayData.introduction }
      ];
      currentPartKey = 'body1';
    } else if (stage === Stage.Body2) {
      readOnlyParts = [
        { label: 'Outline', text: essayData.outline },
        { label: 'Introduction', text: essayData.introduction },
        { label: 'Body Paragraph 1', text: essayData.body1 }
      ];
      currentPartKey = 'body2';
    } else if (stage === Stage.Conclusion) {
      readOnlyParts = [
        { label: 'Outline', text: essayData.outline },
        { label: 'Introduction', text: essayData.introduction },
        { label: 'Body Paragraph 1', text: essayData.body1 },
        { label: 'Body Paragraph 2', text: essayData.body2 }
      ];
      currentPartKey = 'conclusion';
    } else if (stage === Stage.Review) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Review & Edit Your Full Essay (5:00)
          </h3>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
             <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <span className="block text-sm font-bold text-slate-500">OUTLINE PLAN (For reference)</span>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-1">{essayData.outline}</p>
             </div>
             
             {/* Editable sections */}
             <div className="space-y-4">
               <div>
                 <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Introduction</label>
                 <textarea
                   className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-base leading-relaxed resize-none transition-all"
                   rows={5}
                   value={essayData.introduction}
                   onChange={(e) => updateEssayPart('introduction', e.target.value)}
                 />
               </div>
               <div>
                 <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Body Paragraph 1</label>
                 <textarea
                   className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-base leading-relaxed resize-none transition-all"
                   rows={7}
                   value={essayData.body1}
                   onChange={(e) => updateEssayPart('body1', e.target.value)}
                 />
               </div>
               <div>
                 <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Body Paragraph 2</label>
                 <textarea
                   className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-base leading-relaxed resize-none transition-all"
                   rows={7}
                   value={essayData.body2}
                   onChange={(e) => updateEssayPart('body2', e.target.value)}
                 />
               </div>
               <div>
                 <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Conclusion</label>
                 <textarea
                   className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-base leading-relaxed resize-none transition-all"
                   rows={5}
                   value={essayData.conclusion}
                   onChange={(e) => updateEssayPart('conclusion', e.target.value)}
                 />
               </div>
             </div>
           </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Read-only Reference Section */}
        {readOnlyParts.length > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 space-y-4 border border-slate-200 dark:border-slate-700">
            {readOnlyParts.map((part, idx) => (
              <div key={idx} className="opacity-75">
                <h4 className="text-xs uppercase font-bold text-slate-500 mb-1">{part.label}</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap pl-2 border-l-2 border-slate-300 dark:border-slate-600">
                  {part.text || <span className="italic text-slate-400">Nothing written</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Active Input Section */}
        {currentPartKey && (
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-slate-800 dark:text-white flex justify-between items-center">
              <span>{STAGE_CONFIGS[stage].label}</span>
              <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                 {Math.floor(STAGE_CONFIGS[stage].durationSeconds / 60)} mins
              </span>
            </label>
            <textarea
              className="w-full h-80 p-5 rounded-xl border-2 border-blue-100 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-base leading-relaxed transition-all shadow-sm resize-none"
              placeholder={`Start writing your ${STAGE_CONFIGS[stage].label.toLowerCase()} here...`}
              value={essayData[currentPartKey]}
              onChange={(e) => updateEssayPart(currentPartKey!, e.target.value)}
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  if (stage === Stage.Initial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">IELTS Task 2 Trainer</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Simulate real exam pressure with a structured 40-minute guided session.
            Break down your essay into manageable timed stages.
          </p>
          <button
            onClick={handleStartApp}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Start Practice Session'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header & Timer */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-xl hidden sm:block">IELTS Task 2</h1>
          {stage !== Stage.Finished && (
             <div className="flex gap-4 items-center w-full sm:w-auto justify-between sm:justify-end">
               <Timer secondsLeft={timeLeft} totalSeconds={STAGE_CONFIGS[stage].durationSeconds} />
                <button onClick={handleSkipStage} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                   Next <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          )}
          {stage === Stage.Finished && (
            <button
              onClick={handleRedo}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2 transition-colors ml-auto sm:ml-0"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Prompt */}
        <div className="mb-8 p-6 bg-blue-50 dark:bg-slate-800/50 rounded-xl border border-blue-100 dark:border-slate-700">
          <h2 className="text-xs uppercase font-bold text-blue-500 mb-2">Writing Prompt</h2>
          <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{prompt}</p>
        </div>

        {/* Progress Steps */}
        {stage !== Stage.Finished && (
           <div className="mb-8 flex gap-1 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {STAGE_ORDER.map((s) => {
              const isActive = s === stage;
              const isPast = STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(stage);
              return (
                <div
                  key={s}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive
                      ? `${STAGE_CONFIGS[s].color} text-white`
                      : isPast
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {isPast && <CheckCircle2 className="w-4 h-4" />}
                  {STAGE_CONFIGS[s].label}
                </div>
              );
            })}
          </div>
        )}

        {/* Stage Content */}
        {stage !== Stage.Finished ? (
          <div className="transition-all duration-300">
            {renderInputStage()}
          </div>
        ) : (
          /* Finished View */
          <div className="space-y-8 animate-fade-in">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Time's up! Great job.</h2>
                <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  You've completed the full 40-minute structured practice. Review your essay below and send it for records. We're also analyzing it with AI.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4">
               <a
                  href={generateMailtoLink()}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-md transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Email to {RECIPIENT_EMAIL}
                </a>
                <button
                  onClick={handleRedo}
                  className="px-6 py-3 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 shadow-md border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Start Over (Redo)
                </button>
            </div>


            {/* AI Feedback Loading/Display */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                     <h3 className="text-lg font-semibold flex items-center gap-2">
                       AI Assessment
                     </h3>
                     {isGeneratingFeedback && (
                       <div className="flex items-center gap-2 text-sm text-blue-500">
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating analysis...
                       </div>
                     )}
                </div>
                <div className="p-6">
                    {isGeneratingFeedback ? (
                        <div className="space-y-4 animate-pulse">
                           <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                           <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                           <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded"></div>
                        </div>
                    ) : feedback ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{feedback.bandScore}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Estimated<br/>Band Score</div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4"/> Strengths
                                    </h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                        {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                        <AlertCircle className="w-4 h-4"/> Weaknesses
                                    </h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                        {feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <h4 className="font-medium mb-2">Improved Version Suggestion (Partial)</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feedback.improvedVersion}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500">Feedback unavailable. Check API key configuration.</p>
                    )}
                </div>
            </div>

            {/* Suggested Outline Display */}
            {feedback?.suggestedOutline && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-700/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                   <List className="w-5 h-5 text-blue-600" />
                   <h3 className="font-semibold text-slate-700 dark:text-slate-200">Suggested Model Outline</h3>
                </div>
                <div className="p-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
                    {feedback.suggestedOutline}
                </div>
              </div>
            )}

            {/* Final Essay Display */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-700/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                 <h3 className="font-semibold text-slate-700 dark:text-slate-200">Your Final Submission</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500">Outline</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{essayData.outline}</p>
                </div>
                 <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500">Full Essay</span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-serif text-lg">
                      {compileFullEssay()}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
