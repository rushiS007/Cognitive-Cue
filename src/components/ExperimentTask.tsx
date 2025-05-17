import { useState, useEffect, useCallback, ErrorInfo, Component, ReactNode, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Add type definitions for vendor prefixed fullscreen API
declare global {
  interface Document {
    mozFullScreenElement?: Element;
    webkitFullscreenElement?: Element;
    msFullscreenElement?: Element;
    mozCancelFullScreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }
  
  interface HTMLElement {
    msRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
  }
}

// Error boundary component to catch rendering errors
class ErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode, fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h3 className="font-bold mb-2">Something went wrong</h3>
          <p className="text-sm mb-4">{this.state.error?.message || "Unknown error"}</p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
            size="sm"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ExperimentTaskProps {
  onComplete: (results: {
    nBackCorrect: number;
    nBackMissed: number;
    nBackFalseAlarms: number;
    pmCueCorrect: number;
    pmCueMissed: number;
  }) => void;
}

// Define images arrays for each category with a full set of 76 images per category
// Generate image paths dynamically to ensure we have 76 images per category
const generateImagePaths = (category: string, count: number = 76) => {
  return Array.from({ length: count }, (_, i) => `/images/${category}/${category}${i + 1}.jpg`);
};

const pleasantImages = generateImagePaths('pleasant');
const neutralImages = generateImagePaths('neutral');
const unpleasantImages = generateImagePaths('unpleasant');

// Define PM cues for each category - just 5 per category to avoid missing files
const pleasantPMCues = [
  {
    id: 'pmcue-pleasant-1',
    type: 'pleasant',
    isPMCue: true,
    src: '/images/pmcues/pleasantcues/pleasantcue1.jpg'
  },
  {
    id: 'pmcue-pleasant-2',
    type: 'pleasant',
    isPMCue: true,
    src: '/images/pmcues/pleasantcues/pleasantcue2.jpg'
  },
  {
    id: 'pmcue-pleasant-3',
    type: 'pleasant',
    isPMCue: true,
    src: '/images/pmcues/pleasantcues/pleasantcue3.jpg'
  },
  {
    id: 'pmcue-pleasant-4',
    type: 'pleasant',
    isPMCue: true,
    src: '/images/pmcues/pleasantcues/pleasantcue4.jpg'
  },
  {
    id: 'pmcue-pleasant-5',
    type: 'pleasant',
    isPMCue: true,
    src: '/images/pmcues/pleasantcues/pleasantcue5.jpg'
  }
];

const neutralPMCues = [
  {
    id: 'pmcue-neutral-1',
    type: 'neutral',
    isPMCue: true,
    src: '/images/pmcues/neutralcues/neutralcue1.jpg'
  },
  {
    id: 'pmcue-neutral-2',
    type: 'neutral',
    isPMCue: true,
    src: '/images/pmcues/neutralcues/neutralcue2.jpg'
  },
  {
    id: 'pmcue-neutral-3',
    type: 'neutral',
    isPMCue: true,
    src: '/images/pmcues/neutralcues/neutralcue3.jpg'
  },
  {
    id: 'pmcue-neutral-4',
    type: 'neutral',
    isPMCue: true,
    src: '/images/pmcues/neutralcues/neutralcue4.jpg'
  },
  {
    id: 'pmcue-neutral-5',
    type: 'neutral',
    isPMCue: true,
    src: '/images/pmcues/neutralcues/neutralcue5.jpg'
  }
];

const unpleasantPMCues = [
  {
    id: 'pmcue-unpleasant-1',
    type: 'unpleasant',
    isPMCue: true,
    src: '/images/pmcues/unpleasantcues/unpleasantcue1.jpg'
  },
  {
    id: 'pmcue-unpleasant-2',
    type: 'unpleasant',
    isPMCue: true,
    src: '/images/pmcues/unpleasantcues/unpleasantcue2.jpg'
  },
  {
    id: 'pmcue-unpleasant-3',
    type: 'unpleasant',
    isPMCue: true,
    src: '/images/pmcues/unpleasantcues/unpleasantcue3.jpg'
  },
  {
    id: 'pmcue-unpleasant-4',
    type: 'unpleasant',
    isPMCue: true,
    src: '/images/pmcues/unpleasantcues/unpleasantcue4.jpg'
  },
  {
    id: 'pmcue-unpleasant-5',
    type: 'unpleasant',
    isPMCue: true,
    src: '/images/pmcues/unpleasantcues/unpleasantcue5.jpg'
  }
];

// Session types
type SessionType = 'pleasant' | 'neutral' | 'unpleasant';
type ExperimentPhase = 'pmCue' | 'trial' | 'blockEnd';

// Prepare a single session's trials
const prepareSessionTrials = (sessionType: SessionType, blockIndex: number) => {
  // Get the appropriate image array and PM cues for this session type
  let imageArray: string[] = [];
  let pmCues: any[] = [];
  
  if (sessionType === 'pleasant') {
    // Get 35 random images from pleasant category
    imageArray = [...pleasantImages].sort(() => Math.random() - 0.5).slice(0, 35);
    
    // Get 5 random PM cues
    const allPMCues = Array.from({ length: 25 }, (_, i) => ({
      id: `pmcue-pleasant-${i + 1}`,
      type: 'pleasant',
      isPMCue: true,
      src: `/images/pmcues/pleasantcues/pleasantcue${i + 1}.jpg`
    }));
    pmCues = [...allPMCues].sort(() => Math.random() - 0.5).slice(0, 5);
  } else if (sessionType === 'neutral') {
    // Get 35 random images from neutral category
    imageArray = [...neutralImages].sort(() => Math.random() - 0.5).slice(0, 35);
    
    // Get 5 random PM cues
    const allPMCues = Array.from({ length: 25 }, (_, i) => ({
      id: `pmcue-neutral-${i + 1}`,
      type: 'neutral',
      isPMCue: true,
      src: `/images/pmcues/neutralcues/neutralcue${i + 1}.jpg`
    }));
    pmCues = [...allPMCues].sort(() => Math.random() - 0.5).slice(0, 5);
  } else if (sessionType === 'unpleasant') {
    // Get 35 random images from unpleasant category
    imageArray = [...unpleasantImages].sort(() => Math.random() - 0.5).slice(0, 35);
    
    // Get 5 random PM cues
    const allPMCues = Array.from({ length: 25 }, (_, i) => ({
      id: `pmcue-unpleasant-${i + 1}`,
      type: 'unpleasant',
      isPMCue: true,
      src: `/images/pmcues/unpleasantcues/unpleasantcue${i + 1}.jpg`
    }));
    pmCues = [...allPMCues].sort(() => Math.random() - 0.5).slice(0, 5);
  }
  
  console.log(`Using PM cues for ${sessionType} block ${blockIndex}:`, pmCues.map(c => c.src));
  
  // Create regular images for trials
  const regularImages = imageArray.map((src, index) => ({
    id: `${sessionType}-${index}-${blockIndex}`,
    type: sessionType,
    isPMCue: false,
    src
  }));
  
  // Create the trials array
  const trials = [];
  
  // First, create a sequence of 35 unique images
  const uniqueImages = [...regularImages];
  
  // Keep track of which images have been used for n-back matches
  const usedForNBack = new Set<number>();
  
  // Create 20 n-back matches by inserting repeats at appropriate positions
  let nBackCount = 0;
  while (nBackCount < 20) {
    // Randomly select a position to insert the repeat (ensuring it's not at the start)
    const insertPosition = Math.floor(Math.random() * (uniqueImages.length - 1)) + 1;
    // Get the image that will be repeated (the one before the insert position)
    const imageToRepeat = uniqueImages[insertPosition - 1];
    const imageIndex = regularImages.findIndex(img => img.id === imageToRepeat.id);
    
    // Only use this image if it hasn't been used for an n-back match before
    if (!usedForNBack.has(imageIndex)) {
      // Insert the repeat
      uniqueImages.splice(insertPosition, 0, { ...imageToRepeat });
      usedForNBack.add(imageIndex);
      nBackCount++;
    }
  }
  
  // Add all images to trials
  trials.push(...uniqueImages);
  
  // Add PM cue trials (distributed randomly)
  // First, create multiple copies of each PM cue
  const pmCueCopies = [];
  for (const pmCue of pmCues) {
    // Add 3 copies of each PM cue to ensure they appear multiple times
    for (let i = 0; i < 3; i++) {
      pmCueCopies.push({ ...pmCue });
    }
  }
  
  // Shuffle the PM cue copies
  const shuffledPMCues = [...pmCueCopies].sort(() => Math.random() - 0.5);
  
  // Insert PM cues at random positions
  for (const pmCue of shuffledPMCues) {
    const insertPosition = Math.floor(Math.random() * (trials.length + 1));
    trials.splice(insertPosition, 0, pmCue);
  }
  
  console.log(`Prepared ${trials.length} trials for ${sessionType} session (block ${blockIndex})`);
  console.log(`Number of n-back matches: ${nBackCount}`);
  console.log(`Number of PM cue presentations: ${pmCueCopies.length}`);
  
  return {
    pmCues,
    trials
  };
};

const ExperimentTask = ({ onComplete }: ExperimentTaskProps) => {
  // Current session and block tracking
  const [currentSession, setCurrentSession] = useState<SessionType>('pleasant');
  const [currentBlock, setCurrentBlock] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<ExperimentPhase>('pmCue');
  
  // PM cues and trials for current block
  const [pmCues, setPMCues] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  
  // Current indices
  const [currentPMCueIndex, setCurrentPMCueIndex] = useState(0);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1);
  
  // Experiment state
  const [showFixation, setShowFixation] = useState(false);
  const [waitingForSpacebar, setWaitingForSpacebar] = useState(false);
  const [responses, setResponses] = useState<{[key: number]: string[]}>({});
  const [results, setResults] = useState({
    nBackCorrect: 0,
    nBackMissed: 0,
    nBackFalseAlarms: 0,
    pmCueCorrect: 0,
    pmCueMissed: 0,
  });
  const [startTime, setStartTime] = useState(0);
  const [isExperimentActive, setIsExperimentActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Reference to the container element for fullscreen
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) {
      // Enter fullscreen
      const docElm = document.documentElement;
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen()
          .then(() => {
            setIsFullScreen(true);
          })
          .catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
            toast.error("Could not enter fullscreen mode");
          });
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
        setIsFullScreen(true);
      } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
        setIsFullScreen(true);
      } else if (docElm.webkitRequestFullscreen) {
        docElm.webkitRequestFullscreen();
        setIsFullScreen(true);
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullScreen(false);
          })
          .catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        setIsFullScreen(false);
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
        setIsFullScreen(false);
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  
  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(
        !!document.fullscreenElement || 
        !!document.mozFullScreenElement || 
        !!document.webkitFullscreenElement || 
        !!document.msFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Initialize first block
  useEffect(() => {
    try {
      if (currentSession && currentBlock >= 0) {
        // Show loading state
        setIsLoading(true);
        
        // Log what's happening for debugging
        console.log(`Initializing ${currentSession} session, block ${currentBlock}`);
        
        // Short timeout to ensure React renders before heavy computation
        setTimeout(() => {
          try {
            const { pmCues: blockPMCues, trials: blockTrials } = prepareSessionTrials(currentSession, currentBlock);
            
            console.log(`Prepared session trials:`, {
              pmCuesCount: blockPMCues.length,
              trialsCount: blockTrials.length
            });

            // Preload images to avoid blank screens
            const imagesToPreload = [
              ...blockPMCues.map(cue => cue.src),
              ...blockTrials.map(trial => trial.src)
            ];

            let loadedImages = 0;
            let successfullyLoaded = 0;

            // Set a limit on waiting for image preloading
            const preloadTimeout = setTimeout(() => {
              console.log(`Preload timeout reached - ${successfullyLoaded}/${imagesToPreload.length} images loaded`);
              finishInitialization();
            }, 5000); // 5-second max wait

            const finishInitialization = () => {
              clearTimeout(preloadTimeout);
              setPMCues(blockPMCues);
              setTrials(blockTrials);
              setCurrentPMCueIndex(0);
              setCurrentTrialIndex(-1);
              setCurrentPhase('pmCue');
              setResponses({}); // Reset responses for the new block
              setInitialized(true);
              setIsLoading(false);
            };

            if (imagesToPreload.length === 0) {
              finishInitialization();
              return;
            }

            imagesToPreload.forEach(src => {
              if (!src) {
                loadedImages++;
                if (loadedImages === imagesToPreload.length) {
                  finishInitialization();
                }
                return;
              }

              const img = new Image();
              img.onload = () => {
                loadedImages++;
                successfullyLoaded++;
                console.log(`Preloaded image: ${src} (${loadedImages}/${imagesToPreload.length})`);
                if (loadedImages === imagesToPreload.length) {
                  finishInitialization();
                }
              };
              img.onerror = () => {
                loadedImages++;
                console.error(`Failed to preload image: ${src}`);
                if (loadedImages === imagesToPreload.length) {
                  finishInitialization();
                }
              };
              img.src = src;
            });
          } catch (err) {
            console.error('Error in session preparation:', err);
            toast.error('Error preparing experiment session. Please try refreshing the page.');
            setIsLoading(false);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error initializing experiment block:', error);
      toast.error('Error initializing experiment. Please try again.');
      setIsLoading(false);
    }
  }, [currentSession, currentBlock]);
  
  // Function to check if current trial is a 1-back match
  const isOneBackMatch = useCallback((index: number) => {
    if (index <= 0 || index >= trials.length) return false;
    return trials[index].id === trials[index - 1].id;
  }, [trials]);
  
  // Handle keypress during experiment
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (isPaused || isLoading) return;
    
    const key = e.key.toLowerCase();
    
    // Handle spacebar press at block end
    if (waitingForSpacebar && key === ' ') {
      setWaitingForSpacebar(false);
      
      // Reset responses for the new block
      setResponses({});
      
      // Move to next block or session
      if (currentBlock < 4) {
        // Move to next block in the same session
        setCurrentBlock(prevBlock => prevBlock + 1);
      } else if (currentSession === 'pleasant') {
        // Move from pleasant to unpleasant
        setCurrentSession('unpleasant');
        setCurrentBlock(0);
      } else if (currentSession === 'unpleasant') {
        // Move from unpleasant to neutral
        setCurrentSession('neutral');
        setCurrentBlock(0);
      } else {
        // End of experiment
        const finalResults = evaluatePerformance();
        setResults(finalResults);
        setIsExperimentActive(false);
        onComplete(finalResults);
      }
      return;
    }
    
    // Handle n and z keypresses during trials with fixation
    if (currentPhase === 'trial' && showFixation && isExperimentActive) {
      if (key === 'n' || key === 'z') {
        setResponses(prev => {
          const trialResponses = prev[currentTrialIndex] || [];
          if (!trialResponses.includes(key)) {
            return { ...prev, [currentTrialIndex]: [...trialResponses, key] };
          }
          return prev;
        });
      }
    }
  }, [
    currentPhase,
    showFixation,
    waitingForSpacebar,
    currentBlock,
    currentSession,
    currentTrialIndex,
    isExperimentActive,
    isPaused,
    isLoading,
    onComplete,
    trials
  ]);
  
  // Set up keypress event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
  
  // Function to evaluate performance at the end
  const evaluatePerformance = useCallback(() => {
    let nBackCorrect = 0;
    let nBackMissed = 0;
    let nBackFalseAlarms = 0;
    let pmCueCorrect = 0;
    let pmCueMissed = 0;
    
    // Combine all responses across all blocks and sessions
    const allResponses = responses;
    
    // Calculate n-back and PM performance
    Object.entries(allResponses).forEach(([trialIdxStr, trialResponses]) => {
      const trialIdx = parseInt(trialIdxStr);
      const blockTrials = trials; // This is simplified - would need session/block context in a real implementation
      
      if (trialIdx > 0 && trialIdx < blockTrials.length) {
        const isMatch = isOneBackMatch(trialIdx);
        const isPMCue = blockTrials[trialIdx - 1]?.isPMCue;
        
        // Evaluate n-back responses
        if (isMatch && trialResponses.includes('n')) {
          nBackCorrect++;
        } else if (isMatch && !trialResponses.includes('n')) {
          nBackMissed++;
        } else if (!isMatch && trialResponses.includes('n')) {
          nBackFalseAlarms++;
        }
        
        // Evaluate PM responses
        if (isPMCue && trialResponses.includes('z')) {
          pmCueCorrect++;
        } else if (isPMCue && !trialResponses.includes('z')) {
          pmCueMissed++;
        }
      }
    });
    
    return {
      nBackCorrect,
      nBackMissed,
      nBackFalseAlarms,
      pmCueCorrect,
      pmCueMissed,
    };
  }, [responses, trials, isOneBackMatch]);
  
  // Effect to manage trial progression
  useEffect(() => {
    if (!initialized || !isExperimentActive || isPaused || waitingForSpacebar || isLoading) {
      return;
    }
    
    // PM Cue phase - showing the 5 PM cues at start of block
    if (currentPhase === 'pmCue') {
      if (currentPMCueIndex < pmCues.length) {
        // Show current PM cue for 3 seconds then move to next
        console.log(`Showing PM cue ${currentPMCueIndex + 1} of ${pmCues.length}`);
        
        const pmCueTimer = setTimeout(() => {
          setCurrentPMCueIndex(prevIndex => prevIndex + 1);
        }, 3000);
        
        return () => clearTimeout(pmCueTimer);
      } else {
        // All PM cues shown, move to trial phase
        console.log('All PM cues shown, moving to trial phase');
        setCurrentPhase('trial');
        setCurrentTrialIndex(0);
        setStartTime(Date.now());
        return;
      }
    }
    
    // Trial phase - the actual experiment with fixation crosses
    if (currentPhase === 'trial') {
      if (currentTrialIndex >= trials.length) {
        // End of block
        console.log('End of block reached');
        setCurrentPhase('blockEnd');
        setWaitingForSpacebar(true);
        return;
      }
      
      if (!showFixation) {
        // Show image for 2000ms, then show fixation cross
        console.log(`Showing trial ${currentTrialIndex + 1} of ${trials.length}`);
        
        const imageTimer = setTimeout(() => {
          setShowFixation(true);
        }, 2000);
        
        return () => clearTimeout(imageTimer);
      } else {
        // Show fixation for random duration, then move to next trial
        const fixationDurations = [1200, 1400, 1600];
        const randomDuration = fixationDurations[Math.floor(Math.random() * fixationDurations.length)];
        
        console.log(`Showing fixation for ${randomDuration}ms before moving to next trial`);
        
        const fixationTimer = setTimeout(() => {
          setShowFixation(false);
          setCurrentTrialIndex(prevIndex => prevIndex + 1);
          
          // Don't inherit responses from any previous trials with same index
          // (in case of wrapping around with many blocks)
          if (currentTrialIndex + 1 < trials.length) {
            setResponses(prev => {
              const newResponses = { ...prev };
              // Clear any existing response for the next trial if it exists
              delete newResponses[currentTrialIndex + 1];
              return newResponses;
            });
          }
        }, randomDuration);
        
        return () => clearTimeout(fixationTimer);
      }
    }
  }, [
    initialized,
    currentPhase,
    currentPMCueIndex,
    pmCues.length,
    currentTrialIndex,
    showFixation,
    trials.length,
    isExperimentActive,
    isPaused,
    waitingForSpacebar,
    isLoading
  ]);
  
  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (!isPaused) {
      toast.info("Experiment paused. Press Continue to resume.");
    }
  };
  
  // Calculate progress based on current session, block, and phase
  const calculateProgress = () => {
    const totalSessions = 3;
    const blocksPerSession = 5;
    
    let sessionProgress = 0;
    if (currentSession === 'pleasant') sessionProgress = 0;
    else if (currentSession === 'unpleasant') sessionProgress = 1;
    else if (currentSession === 'neutral') sessionProgress = 2;
    
    const sessionWeight = 100 / totalSessions;
    let blockProgress = (currentBlock / blocksPerSession) * sessionWeight;
    
    let phaseProgress = 0;
    if (currentPhase === 'pmCue') {
      phaseProgress = (currentPMCueIndex / pmCues.length) * (sessionWeight / blocksPerSession / 2);
    } else if (currentPhase === 'trial') {
      phaseProgress = ((currentTrialIndex + 1) / trials.length) * (sessionWeight / blocksPerSession / 2) + (sessionWeight / blocksPerSession / 2);
    } else if (currentPhase === 'blockEnd') {
      phaseProgress = sessionWeight / blocksPerSession;
    }
    
    return Math.min((sessionProgress * sessionWeight) + blockProgress + phaseProgress, 100);
  };
  
  // Get the current session title
  const getSessionTitle = () => {
    const sessionTitles = {
      pleasant: 'Session 1',
      unpleasant: 'Session 2',
      neutral: 'Session 3'
    };
    return sessionTitles[currentSession];
  };
  
  // Get the current block title
  const getBlockTitle = () => {
    return `Block ${currentBlock + 1}`;
  };
  
  // Add function to end session and show results
  const endSessionAndShowResults = () => {
    const finalResults = evaluatePerformance();
    setResults(finalResults);
    setIsExperimentActive(false);
    onComplete(finalResults);
  };
  
  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl p-6 flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-medium mb-4">Loading Experiment...</h3>
          <div className="h-2 w-40 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
          </div>
          {/* Show additional debug info */}
          <div className="mt-4 text-sm text-left bg-gray-100 p-4 rounded-md overflow-auto max-h-36">
            <p>Session: {currentSession}</p>
            <p>Block: {currentBlock}</p>
            <p>Phase: {currentPhase}</p>
            <p>PM Cues: {pmCues.length}</p>
            <p>Trials: {trials.length}</p>
          </div>
        </div>
      </Card>
    );
  }
  
  // Add a fallback for uninitialized state
  if (!initialized && !isLoading) {
    return (
      <Card className="w-full max-w-3xl p-6 flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-medium mb-4">Starting Experiment...</h3>
          <div className="h-2 w-40 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
          </div>
          {/* Show additional debug info */}
          <div className="mt-4 text-sm text-left bg-gray-100 p-4 rounded-md overflow-auto max-h-36">
            <p>Session: {currentSession}</p>
            <p>Block: {currentBlock}</p>
            <p>Not initialized. Click the button below to manually initialize.</p>
          </div>
          <Button 
            onClick={() => {
              console.log('Manual initialization attempt');
              setIsLoading(true);
              setTimeout(() => {
                try {
                  const { pmCues: blockPMCues, trials: blockTrials } = prepareSessionTrials(currentSession, currentBlock);
                  
                  // Preload images to avoid blank screens
                  const imagesToPreload = [
                    ...blockPMCues.map(cue => cue.src),
                    ...blockTrials.map(trial => trial.src)
                  ];

                  let loadedImages = 0;
                  let successfullyLoaded = 0;

                  // Set a limit on waiting for image preloading
                  const preloadTimeout = setTimeout(() => {
                    console.log(`Preload timeout reached - ${successfullyLoaded}/${imagesToPreload.length} images loaded`);
                    finishInitialization();
                  }, 5000); // 5-second max wait

                  const finishInitialization = () => {
                    clearTimeout(preloadTimeout);
                    setPMCues(blockPMCues);
                    setTrials(blockTrials);
                    setCurrentPMCueIndex(0);
                    setCurrentTrialIndex(-1);
                    setCurrentPhase('pmCue');
                    setResponses({}); // Reset responses for the new block
                    setInitialized(true);
                    setIsLoading(false);
                  };

                  if (imagesToPreload.length === 0) {
                    finishInitialization();
                    return;
                  }

                  imagesToPreload.forEach(src => {
                    if (!src) {
                      loadedImages++;
                      if (loadedImages === imagesToPreload.length) {
                        finishInitialization();
                      }
                      return;
                    }

                    const img = new Image();
                    img.onload = () => {
                      loadedImages++;
                      successfullyLoaded++;
                      console.log(`Preloaded image: ${src} (${loadedImages}/${imagesToPreload.length})`);
                      if (loadedImages === imagesToPreload.length) {
                        finishInitialization();
                      }
                    };
                    img.onerror = () => {
                      loadedImages++;
                      console.error(`Failed to preload image: ${src}`);
                      if (loadedImages === imagesToPreload.length) {
                        finishInitialization();
                      }
                    };
                    img.src = src;
                  });
                } catch (err) {
                  console.error('Error in manual initialization:', err);
                  toast.error('Error initializing. Please refresh the page.');
                  setIsLoading(false);
                }
              }, 100);
            }}
            className="mt-4"
          >
            Click to Initialize
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div 
      className={`w-full max-w-4xl transition-all duration-300 ${
        isFullScreen ? 'max-w-full h-screen p-4 flex flex-col' : ''
      }`} 
      ref={containerRef}
    >
      <ErrorBoundary>
        <Card className={`mb-4 p-6 ${
          isFullScreen ? 'flex-1 flex flex-col' : ''
        }`}>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">{getSessionTitle()}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={toggleFullScreen}
                variant="outline" 
                size="default"
                className="flex items-center gap-1"
              >
                {isFullScreen ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                      <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                      <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    Exit
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <polyline points="9 21 3 21 3 15"></polyline>
                      <line x1="21" y1="3" x2="14" y2="10"></line>
                      <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                    Fullscreen
                  </>
                )}
              </Button>
              <Button 
                onClick={togglePause} 
                variant="outline" 
                size="default"
              >
                {isPaused ? 'Continue' : 'Pause'}
              </Button>
              <Button 
                onClick={endSessionAndShowResults}
                variant="destructive"
                size="default"
                className="flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M12 2v4"></path>
                  <path d="M12 18v4"></path>
                  <path d="m4.93 4.93 2.83 2.83"></path>
                  <path d="m16.24 16.24 2.83 2.83"></path>
                  <path d="M2 12h4"></path>
                  <path d="M18 12h4"></path>
                  <path d="m4.93 19.07 2.83-2.83"></path>
                  <path d="m16.24 7.76 2.83-2.83"></path>
                </svg>
                End Session
              </Button>
            </div>
          </div>
          
          <Progress value={calculateProgress()} className="h-3 mb-8" />
          
          <div className={`min-h-[400px] flex items-center justify-center bg-gray-50 rounded-md border ${
            isFullScreen ? 'flex-1' : ''
          }`}>
            <ErrorBoundary fallback={
              <div className="p-4 text-center">
                <p className="text-red-600 mb-2">Error displaying content</p>
                <Button 
                  onClick={() => window.location.reload()}
                  size="sm"
                >
                  Reload Page
                </Button>
              </div>
            }>
              {isPaused && (
                <div className="text-xl font-semibold text-gray-600">Experiment Paused</div>
              )}
              
              {!isPaused && waitingForSpacebar && (
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="text-xl font-semibold mb-4">Block Complete</div>
                  <div className="text-lg mb-6">
                    Press <span className="font-bold">SPACEBAR</span> to continue to the next block
                  </div>
                </div>
              )}
              
              {!isPaused && !waitingForSpacebar && currentPhase === 'pmCue' && pmCues.length > 0 && currentPMCueIndex < pmCues.length && (
                <div className="p-8 flex flex-col items-center">

                  <div className={`${
                    isFullScreen ? 'h-[50vh] w-[50vh]' : 'h-80 w-80'
                  } flex items-center justify-center border-2 border-gray-300 rounded-md bg-white overflow-hidden`}>
                    {pmCues[currentPMCueIndex]?.src ? (
                      <img 
                        src={pmCues[currentPMCueIndex].src} 
                        alt={`Special image from ${currentSession} category`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          console.error(`Failed to load PM cue image: ${pmCues[currentPMCueIndex].src}`);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('image-error');
                        }}
                      />
                    ) : (
                      <div className="text-lg font-bold text-red-500">
                        
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!isPaused && !waitingForSpacebar && currentPhase === 'trial' && trials.length > 0 && currentTrialIndex >= 0 && currentTrialIndex < trials.length && (
                <>
                  {!showFixation ? (
                    <div className="p-8 flex flex-col items-center">
                      <div className={`${
                        isFullScreen ? 'h-[50vh] w-[50vh]' : 'h-80 w-80'
                      } flex items-center justify-center border-2 border-gray-300 rounded-md bg-white overflow-hidden`}>
                        {trials[currentTrialIndex]?.src ? (
                          <img 
                            src={trials[currentTrialIndex].src} 
                            alt={`${trials[currentTrialIndex].type} image`}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              console.error(`Failed to load trial image: ${trials[currentTrialIndex].src}`);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('image-error');
                            }}
                          />
                        ) : (
                          <div className="text-lg font-bold">
                            {trials[currentTrialIndex]?.isPMCue ? (
                              <span className="text-red-500">Special Image</span>
                            ) : (
                              `${trials[currentTrialIndex]?.type.charAt(0).toUpperCase() + trials[currentTrialIndex]?.type.slice(1)} Image`
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center">
                      <div className={`${
                        isFullScreen ? 'text-8xl' : 'text-7xl'
                      } mb-4`}>+</div>
                    </div>
                  )}
                </>
              )}
            </ErrorBoundary>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="text-base">
              {currentTrialIndex >= 0 && responses[currentTrialIndex]?.length > 0 && showFixation ? (
                <span className="text-green-600">Response recorded</span>
              ) : null}
            </div>
          </div>
        </Card>
      </ErrorBoundary>
    </div>
  );
};

export default ExperimentTask;
