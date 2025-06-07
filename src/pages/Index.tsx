import { useState } from 'react';
import ExperimentIntro from '@/components/ExperimentIntro';
import ExperimentTask from '@/components/ExperimentTask';
import ResultsSummary from '@/components/ResultsSummary';

// Main experiment page
const Index = () => {
  // Track experiment phase
  const [phase, setPhase] = useState<'intro' | 'task' | 'results'>('intro');
  // Store experiment results
  const [results, setResults] = useState({
    nBackCorrect: 0,
    nBackMissed: 0,
    nBackFalseAlarms: 0,
    pmCueCorrect: 0,
    pmCueMissed: 0,
    pmCueFalseAlarms: 0, // Added
    totalImages: 0,
    totalPMCues: 0,
    totalNBackMatches: 0,
    nBackAccuracy: '0.00',
    pmCueAccuracy: '0.00',
    sessionResults: {}
  });

  const startExperiment = () => {
    setPhase('task');
  };

  const endExperiment = (experimentResults: typeof results) => {
    console.log('Received experiment results:', experimentResults);
    setResults(experimentResults);
    setPhase('results');
  };

  const restartExperiment = () => {
    setPhase('intro');
    setResults({
      nBackCorrect: 0,
      nBackMissed: 0,
      nBackFalseAlarms: 0,
      pmCueCorrect: 0,
      pmCueMissed: 0,
      pmCueFalseAlarms: 0, // Added
      totalImages: 0,
      totalPMCues: 0,
      totalNBackMatches: 0,
      nBackAccuracy: '0.00',
      pmCueAccuracy: '0.00',
      sessionResults: {}
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-8 px-4">
      {phase === 'intro' && <h1 className="text-3xl font-bold mb-8 text-center">Welcome</h1>}
      
      {phase === 'intro' && <ExperimentIntro onStart={startExperiment} />}
      {phase === 'task' && <ExperimentTask onComplete={endExperiment} />}
      {phase === 'results' && <ResultsSummary results={results} onRestart={restartExperiment} />}
    </div>
  );
};

export default Index;
