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
    pmCueFalseAlarms: number; // Added
    totalImages: number;
    totalPMCues: number;
    totalNBackMatches: number;
    nBackAccuracy: string;
    pmCueAccuracy: string;
  }) => void;
}

// Define images arrays for each category with a full set of 76 images per category
// Generate image paths dynamically to ensure we have 76 images per category
const generateImagePaths = (category: string, count: number = 76) => {
  const paths = [];
  for (let i = 1; i <= count; i++) {
    paths.push(`/images/${category}/${category}${i}.jpg`);
  }
  return paths;
};

const pleasantImages = generateImagePaths('pleasant');
const neutralImages = generateImagePaths('neutral');
const unpleasantImages = generateImagePaths('unpleasant');

console.log('Generated image paths:', {
  pleasant: pleasantImages.length,
  neutral: neutralImages.length,
  unpleasant: unpleasantImages.length,
  sample: pleasantImages.slice(0, 3)
});

// Define PM cues for each category and block - 6 per category per block
const generatePMCuesByBlock = (category: string) => {
  // Create arrays for each block
  const block1Cues = Array.from({ length: 6 }, (_, i) => ({
    id: `pmcue-${category}-block1-${i + 1}`,
    type: category,
    isPMCue: true,
    src: `/images/pmcues/${category}cues/block1/${category}cue${i + 1}.jpg`
  }));
  
  const block2Cues = Array.from({ length: 6 }, (_, i) => ({
    id: `pmcue-${category}-block2-${i + 1}`,
    type: category,
    isPMCue: true,
    src: `/images/pmcues/${category}cues/block2/${category}cue${i + 1}.jpg`
  }));
  
  const block3Cues = Array.from({ length: 6 }, (_, i) => ({
    id: `pmcue-${category}-block3-${i + 1}`,
    type: category,
    isPMCue: true,
    src: `/images/pmcues/${category}cues/block3/${category}cue${i + 1}.jpg`
  }));
  
  return { block1: block1Cues, block2: block2Cues, block3: block3Cues };
};

// Generate PM cues for each category
const pleasantPMCuesByBlock = generatePMCuesByBlock('pleasant');
const neutralPMCuesByBlock = generatePMCuesByBlock('neutral');
const unpleasantPMCuesByBlock = generatePMCuesByBlock('unpleasant');

// For backwards compatibility
const pleasantPMCues = pleasantPMCuesByBlock.block1;
const neutralPMCues = neutralPMCuesByBlock.block1;
const unpleasantPMCues = unpleasantPMCuesByBlock.block1;

// Session types
type SessionType = 'pleasant' | 'neutral' | 'unpleasant';
type ExperimentPhase = 'pmCue' | 'trial' | 'blockEnd' | 'pmCueTransitionToTrial';

// Prepare a single session's trials
const prepareSessionTrials = (sessionType: SessionType, blockIndex: number, isPractice: boolean = false) => {
  try {
    console.log('Starting prepareSessionTrials with:', { sessionType, blockIndex });
    
    // Get the appropriate image array and PM cues for this session type
    let imageArray: string[] = [];
    let pmCuesForCurrentBlock: any[] = [];

    if (sessionType === 'pleasant') {
      console.log('Using pleasant images and cues');
      // Get 70 random images from pleasant category
      imageArray = [...pleasantImages].sort(() => Math.random() - 0.5).slice(0, 70);
      
      // Use different cues for each block from organized folders
      if (blockIndex === 0) {
        pmCuesForCurrentBlock = pleasantPMCuesByBlock.block1;
      } else if (blockIndex === 1) {
        pmCuesForCurrentBlock = pleasantPMCuesByBlock.block2;
      } else {
        pmCuesForCurrentBlock = pleasantPMCuesByBlock.block3;
      }
    } else if (sessionType === 'neutral') {
      console.log('Using neutral images and cues');
      // Get 70 random images from neutral category
      imageArray = [...neutralImages].sort(() => Math.random() - 0.5).slice(0, 70);
      
      // Use different cues for each block from organized folders
      if (blockIndex === 0) {
        pmCuesForCurrentBlock = neutralPMCuesByBlock.block1;
      } else if (blockIndex === 1) {
        pmCuesForCurrentBlock = neutralPMCuesByBlock.block2;
      } else {
        pmCuesForCurrentBlock = neutralPMCuesByBlock.block3;
      }
    } else if (sessionType === 'unpleasant') {
      console.log('Using unpleasant images and cues');
      // Get 70 random images from unpleasant category
      imageArray = [...unpleasantImages].sort(() => Math.random() - 0.5).slice(0, 70);
      
      // Use different cues for each block from organized folders
      if (blockIndex === 0) {
        pmCuesForCurrentBlock = unpleasantPMCuesByBlock.block1;
      } else if (blockIndex === 1) {
        pmCuesForCurrentBlock = unpleasantPMCuesByBlock.block2;
      } else {
        pmCuesForCurrentBlock = unpleasantPMCuesByBlock.block3;
      }
    }
    
    console.log(`Selected ${imageArray.length} images`);
    console.log(`Using block ${blockIndex + 1}, selected PM cues:`, pmCuesForCurrentBlock.map(cue => cue.id));
    
    // If we don't have enough PM cues for the current block, handle the error gracefully
    if (pmCuesForCurrentBlock.length < 6) {
      console.warn(`Not enough PM cues for block ${blockIndex + 1}, using available cues`);
      // Use what we have or fallback to first block's cues
      if (pmCuesForCurrentBlock.length === 0) {
        if (sessionType === 'pleasant') {
          pmCuesForCurrentBlock = pleasantPMCuesByBlock.block1;
        } else if (sessionType === 'neutral') {
          pmCuesForCurrentBlock = neutralPMCuesByBlock.block1;
        } else {
          pmCuesForCurrentBlock = unpleasantPMCuesByBlock.block1;
        }
      }
    }
    
    // Use our new approach
    const pmCues = pmCuesForCurrentBlock;
    
    // Create regular images for trials
    const regularImages = imageArray.map((src, index) => ({
      id: `${sessionType}-${index}-${blockIndex}`,
      type: sessionType,
      isPMCue: false,
      src
    }));
    
    // Create the trials array
    const trials = [];
    
    if (isPractice) {
      console.log('Preparing practice trials');
      // For practice trials, just create 15 random trials with some n-back matches
      const practiceImages = [...regularImages].sort(() => Math.random() - 0.5).slice(0, 15);
      trials.push(...practiceImages);
      
      // Add 5 n-back matches at random positions
      let nBackCount = 0;
      const usedForNBack = new Set<number>();
      
      while (nBackCount < 5) {
        const insertPosition = Math.floor(Math.random() * (trials.length - 1)) + 1;
        const imageToRepeat = trials[insertPosition - 1];
        const imageIndex = practiceImages.findIndex(img => img.id === imageToRepeat.id);
        
        if (!usedForNBack.has(imageIndex)) {
          trials.splice(insertPosition, 0, { ...imageToRepeat });
          usedForNBack.add(imageIndex);
          nBackCount++;
        }
      }
      console.log(`Created ${trials.length} practice trials with ${nBackCount} n-back matches`);
    } else {
      console.log('Preparing main experiment trials');
      
      // Determine number of n-back matches based on block index
      const nBackMatchesPerBlock = [23, 20, 25];
      const nBackMatches = nBackMatchesPerBlock[blockIndex];
      
      // Calculate unique images needed (70 total - PM cues - n-back matches)
      const uniqueImagesNeeded = 70 - 6 - nBackMatches;
      
      // First, create a sequence of unique images
      const uniqueImages = [...regularImages].slice(0, uniqueImagesNeeded);
      
      // Keep track of which images have been used for n-back matches
      const usedForNBack = new Set<number>();
      
      // Create n-back matches by inserting repeats at appropriate positions
      let nBackCount = 0;
      while (nBackCount < nBackMatches) {
        const insertPosition = Math.floor(Math.random() * (uniqueImages.length - 1)) + 1;
        const imageToRepeat = uniqueImages[insertPosition - 1];
        const imageIndex = regularImages.findIndex(img => img.id === imageToRepeat.id);
        
        if (!usedForNBack.has(imageIndex)) {
          uniqueImages.splice(insertPosition, 0, { ...imageToRepeat });
          usedForNBack.add(imageIndex);
          nBackCount++;
        }
      }
      
      // Add all images to trials
      trials.push(...uniqueImages);
      
      // Add exactly 6 PM cues at random positions
      // Shuffle the PM cues
      const shuffledPMCues = [...pmCues].sort(() => Math.random() - 0.5);
      
      // Insert PM cues at random positions, ensuring they don't appear as n-back matches
      for (const pmCue of shuffledPMCues) {
        let insertPosition;
        do {
          insertPosition = Math.floor(Math.random() * (trials.length + 1));
        } while (
          // Don't insert if it would create an n-back match
          (insertPosition > 0 && trials[insertPosition - 1]?.isPMCue) ||
          (insertPosition < trials.length && trials[insertPosition]?.isPMCue)
        );
        trials.splice(insertPosition, 0, pmCue);
      }
      
      console.log(`Created ${trials.length} main trials with ${nBackCount} n-back matches and ${shuffledPMCues.length} PM cues for block ${blockIndex + 1}`);
    }
    
    // Verify n-back matches and PM cues
    const nBackMatches = trials.filter((trial, index) => 
      index > 0 && trial.id === trials[index - 1].id
    );
    const pmCueCount = trials.filter(trial => trial.isPMCue).length;
    
    console.log('Trial verification:', {
      sessionType,
      totalTrials: trials.length,
      nBackMatches: nBackMatches.length,
      pmCues: pmCueCount,
      expectedPMCues: 6,
      blockIndex: blockIndex + 1
    });
    
    return {
      pmCues,
      trials
    };
  } catch (error) {
    console.error('Error in prepareSessionTrials:', error);
    throw error;
  }
};

// Function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ExperimentTask = ({ onComplete }: ExperimentTaskProps) => {
  // Block and session tracking
  const [currentBlock, setCurrentBlock] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [blockSessionOrder] = useState<SessionType[][]>(() => {
    // Create 3 blocks, each containing all session types in random order
    return Array(3).fill(null).map(() => shuffleArray(['pleasant', 'unpleasant', 'neutral']));
  });
  const currentSession = blockSessionOrder[currentBlock][currentSessionIndex];
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
  const [waitingForSpacebarAfterPMCues, setWaitingForSpacebarAfterPMCues] = useState(false); // New state
  const [responses, setResponses] = useState<{[key: number]: string[]}>({});
  
  // Define the type for block results
  type BlockResult = {
    nBackCorrect: number;
    nBackMissed: number;
    nBackFalseAlarms: number;
    pmCueCorrect: number;
    pmCueMissed: number;
    pmCueFalseAlarms: number;
    totalImages: number;
    totalPMCues: number;
    totalNBackMatches: number;
    sessionType: SessionType;
  };

  // Track results for each block
  const [blockResults, setBlockResults] = useState<BlockResult[]>([]);
  
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
    sessionResults: {} as any
  });
  
  const [startTime, setStartTime] = useState(0);
  const [isExperimentActive, setIsExperimentActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
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
    initializeBlock();
  }, [currentSession, currentBlock]);
  
  // Separate initialization function for reuse
  const initializeBlock = useCallback(() => {
    try {
      if (currentSession && currentBlock >= 0) {
        // Show loading state
        setIsLoading(true);
        
        // Log what's happening for debugging
        console.log(`Initializing ${currentSession} session, block ${currentBlock}`);
        
        // Short timeout to ensure React renders before heavy computation
        setTimeout(() => {
          try {
            const { pmCues: blockPMCues, trials: blockTrials } = prepareSessionTrials(
              currentSession, 
              currentBlock,
              false // Always false now since we removed practice
            );
            
            console.log(`Session preparation completed:`, {
              pmCuesCount: blockPMCues.length,
              trialsCount: blockTrials.length,
              pmCues: blockPMCues.map(cue => cue.src),
              firstFewTrials: blockTrials.slice(0, 3).map(trial => trial.src)
            });

            // Preload images to avoid blank screens
            const imagesToPreload = [
              ...blockPMCues.map(cue => cue.src),
              ...blockTrials.map(trial => trial.src)
            ].filter(Boolean);

            console.log(`Images to preload:`, imagesToPreload);

            let loadedImages = 0;
            let successfullyLoaded = 0;

            // Set a limit on waiting for image preloading
            const preloadTimeout = setTimeout(() => {
              console.log(`Preload timeout reached - ${successfullyLoaded}/${imagesToPreload.length} images loaded`);
              finishInitialization();
            }, 5000);

            const finishInitialization = () => {
              clearTimeout(preloadTimeout);
              setPMCues(blockPMCues);
              setTrials(blockTrials);
              setCurrentPMCueIndex(0);
              setCurrentTrialIndex(-1);
              setCurrentPhase('pmCue');
              setResponses({});
              setWaitingForSpacebarAfterPMCues(false); // Reset here
              setInitialized(true);
              setIsLoading(false);
              console.log('Initialization completed successfully');
            };

            if (imagesToPreload.length === 0) {
              console.log('No images to preload, finishing initialization');
              finishInitialization();
              return;
            }

            imagesToPreload.forEach(src => {
              if (!src) {
                loadedImages++;
                console.log(`Skipping null/undefined image source (${loadedImages}/${imagesToPreload.length})`);
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
              img.onerror = (error) => {
                loadedImages++;
                console.error(`Failed to preload image: ${src}`, error);
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
  
  // Function to evaluate block performance
  const evaluateBlockPerformance = (): BlockResult => {
    const blockResults: BlockResult = {
      nBackCorrect: 0,
      nBackMissed: 0,
      nBackFalseAlarms: 0,
      pmCueCorrect: 0,
      pmCueMissed: 0,
      pmCueFalseAlarms: 0,
      totalImages: trials.length,
      totalPMCues: pmCues.length,
      totalNBackMatches: 0,
      sessionType: currentSession
    };

    // Calculate n-back performance
    trials.forEach((trial, index) => {
      if (index >= 2) { // Using 2-back
        const isMatch = trial.src === trials[index - 2].src;
        const trialResponses = responses[index] || [];
        const hasResponse = trialResponses.length > 0;

        if (isMatch) {
          blockResults.totalNBackMatches++;
          if (hasResponse) {
            blockResults.nBackCorrect++;
          } else {
            blockResults.nBackMissed++;
          }
        } else if (hasResponse) {
          blockResults.nBackFalseAlarms++;
        }
      }
    });

    // Calculate PM cue performance
    pmCues.forEach((cue, index) => {
      const trialResponses = responses[index] || [];
      const hasResponse = trialResponses.length > 0;

      if (hasResponse) {
        blockResults.pmCueCorrect++;
      } else {
        blockResults.pmCueMissed++;
      }
    });

    return blockResults;
  };

  // Function to calculate final results
  const calculateFinalResults = useCallback((currentSessionData: BlockResult[]) => {
    let totalNBackCorrect = 0;
    let totalNBackMissed = 0;
    let totalNBackFalseAlarms = 0;
    let totalPMCueCorrect = 0;
    let totalPMCueMissed = 0;
    let totalPMCueFalseAlarms = 0;
    let totalImages = 0;
    let totalPMCues = 0;
    let totalNBackMatches = 0;

    // Process each block's results
    currentSessionData.forEach((block) => {
      totalNBackCorrect += block.nBackCorrect;
      totalNBackMissed += block.nBackMissed;
      totalNBackFalseAlarms += block.nBackFalseAlarms;
      totalPMCueCorrect += block.pmCueCorrect;
      totalPMCueMissed += block.pmCueMissed;
      totalPMCueFalseAlarms += block.pmCueFalseAlarms;
      totalImages += block.totalImages;
      totalPMCues += block.totalPMCues;
      totalNBackMatches += block.totalNBackMatches;
    });

    const nBackAccuracy = totalNBackMatches > 0 ? (totalNBackCorrect / totalNBackMatches * 100).toFixed(2) : '0.00';
    const pmCueAccuracy = totalPMCues > 0 ? (totalPMCueCorrect / totalPMCues * 100).toFixed(2) : '0.00';

    return {
      nBackCorrect: totalNBackCorrect,
      nBackMissed: totalNBackMissed,
      nBackFalseAlarms: totalNBackFalseAlarms,
      pmCueCorrect: totalPMCueCorrect,
      pmCueMissed: totalPMCueMissed,
      pmCueFalseAlarms: totalPMCueFalseAlarms,
      totalImages,
      totalPMCues,
      totalNBackMatches,
      nBackAccuracy,
      pmCueAccuracy,
      sessionResults: currentSessionData
    };
  }, []);
  
  // Function to move to next session or block
  const moveToNextSession = () => {
    if (currentSessionIndex < 2) {
      // Move to next session in current block
      setCurrentSessionIndex(prev => prev + 1);
      setCurrentPhase('pmCue');
    } else if (currentBlock < 2) {
      // Move to first session of next block
      setCurrentBlock(prev => prev + 1);
      setCurrentSessionIndex(0);
      setCurrentPhase('pmCue');
    } else {
      // End of experiment
      const results = calculateFinalResults(blockResults);
      setResults(results);
      setIsExperimentActive(false);
      onComplete(results);
    }
  };
  
  // Handle key press for responses
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (isPaused || isLoading) return;

    const key = e.key.toLowerCase();

    // Handle spacebar press after PM cues
    if (waitingForSpacebarAfterPMCues && key === ' ') {
      setWaitingForSpacebarAfterPMCues(false);
      setShowFixation(true); // Show fixation cross before trials
      setCurrentPhase('pmCueTransitionToTrial');
      return;
    }
    
    // Handle spacebar press at block end
    if (waitingForSpacebar && key === ' ') {
      setWaitingForSpacebar(false);
      
      // Evaluate current session performance
      const currentBlockPerformance = evaluateBlockPerformance();
      
      // Store results for current session
      setBlockResults(prev => [...prev, currentBlockPerformance]);
      
      // Reset responses for the new session
      setResponses({});
      
      // Move to next session or block
      moveToNextSession();
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
        // Keep fixation cross for 500ms after response, then advance
        setTimeout(() => {
          setShowFixation(false);
          setCurrentTrialIndex(prevIndex => prevIndex + 1);
          // Don't inherit responses from any previous trials with same index
          setResponses(prev => {
            const newResponses = { ...prev };
            delete newResponses[currentTrialIndex + 1];
            return newResponses;
          });
        }, 500);
      }
    }
  }, [
    currentPhase,
    showFixation,
    waitingForSpacebar,
    waitingForSpacebarAfterPMCues,
    currentBlock,
    currentSessionIndex,
    currentTrialIndex,
    isExperimentActive,
    isPaused,
    isLoading,
    onComplete,
    evaluateBlockPerformance,
    calculateFinalResults,
    blockResults,
    moveToNextSession
  ]);
  
  // Set up keypress event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
  
  // Effect to manage trial progression
  useEffect(() => {
    if (!initialized || !isExperimentActive || isPaused || waitingForSpacebar || isLoading || waitingForSpacebarAfterPMCues) {
      return;
    }
    
    // PM Cue phase - showing the PM cues at start of block
    if (currentPhase === 'pmCue') {
      if (currentPMCueIndex < pmCues.length) {
        // Show current PM cue for 2 seconds then move to next
        console.log(`Showing PM cue ${currentPMCueIndex + 1} of ${pmCues.length}`);
        
        const pmCueTimer = setTimeout(() => {
          setCurrentPMCueIndex(prevIndex => prevIndex + 1);
        }, 2000);
        
        return () => clearTimeout(pmCueTimer);
      } else {
        // All PM cues shown, wait for spacebar
        console.log('All PM cues shown, waiting for spacebar to proceed to trials.');
        setWaitingForSpacebarAfterPMCues(true);
        // No automatic transition here, handled by spacebar press
        return; 
      }
    }

    // New phase to handle transition from PM Cues to Trials after spacebar
    if (currentPhase === 'pmCueTransitionToTrial') {
      // Show fixation cross for 1 second, then start trials
      console.log('Transitioning to trials after spacebar, showing fixation.');
      // setShowFixation(true) is already set by handleKeyPress
      const fixationTimer = setTimeout(() => {
        setShowFixation(false);
        setCurrentPhase('trial');
        setCurrentTrialIndex(0);
        setStartTime(Date.now());
        console.log('Fixation after PM cues complete, starting trials.');
      }, 1000);
      return () => clearTimeout(fixationTimer);
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
        // Show image for 1500ms for n-back task, 2000ms for PM cues
        const imageDuration = trials[currentTrialIndex]?.isPMCue ? 2000 : 1500;
        console.log(`Showing trial ${currentTrialIndex + 1} of ${trials.length}`);
        
        const imageTimer = setTimeout(() => {
          setShowFixation(true);
        }, imageDuration);
        
        return () => clearTimeout(imageTimer);
      } else {
        // Show fixation for 1500ms then automatically advance to the next trial
        console.log('Showing fixation, will automatically advance after 1500ms');
        
        const fixationTimer = setTimeout(() => {
          setShowFixation(false);
          setCurrentTrialIndex(prevIndex => prevIndex + 1);
          
          // Don't inherit responses from any previous trials with same index
          setResponses(prev => {
            const newResponses = { ...prev };
            delete newResponses[currentTrialIndex + 1];
            return newResponses;
          });
        }, 1500); // Changed from 500ms to 1500ms
        
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
    waitingForSpacebarAfterPMCues, // Added dependency
    isLoading
  ]);
  
  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (!isPaused) {
      toast.info("Experiment paused. Press Continue to resume.");
    }
  };
  
  // Calculate progress based on current block and phase
  const calculateProgress = () => {
    const totalBlocks = 3;
    let blockProgress = (currentBlock / totalBlocks) * 100;
    let phaseProgress = 0;
    if (currentPhase === 'pmCue') {
      phaseProgress = (currentPMCueIndex / pmCues.length) * (100 / totalBlocks / 2);
    } else if (currentPhase === 'trial') {
      phaseProgress = ((currentTrialIndex + 1) / trials.length) * (100 / totalBlocks / 2) + (100 / totalBlocks / 2);
    } else if (currentPhase === 'blockEnd') {
      phaseProgress = 100 / totalBlocks;
    }
    return Math.min(blockProgress + phaseProgress, 100);
  };
  
  // Get the current block/session title
  const getSessionTitle = () => {
    const sessionTitles = {
      pleasant: 'Pleasant',
      unpleasant: 'Unpleasant',
      neutral: 'Neutral'
    };
    return `Block ${currentBlock + 1}, Session ${currentSessionIndex + 1}: ${sessionTitles[currentSession]}`;
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
              initializeBlock();
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
          {/* Title and progress bar removed as requested */}
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
              {/* Main experiment display area */}
              {isPaused && (
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">Experiment Paused</h3>
                  <p className="text-lg">Press the "Continue" button to resume.</p>
                </div>
              )}

              {!isPaused && waitingForSpacebarAfterPMCues && (
                <div className="text-center p-8">
                  <p className="text-lg">Press <strong>SPACEBAR</strong> to continue to the images.</p>
                </div>
              )}

              {!isPaused && !waitingForSpacebarAfterPMCues && currentPhase === 'pmCue' && currentPMCueIndex < pmCues.length && pmCues[currentPMCueIndex] && (
                <div className="flex flex-col items-center justify-center h-full">
                  <img 
                    src={pmCues[currentPMCueIndex].src} 
                    alt={`PM Cue ${currentPMCueIndex + 1}`} 
                    className="max-h-[350px] max-w-full object-contain rounded-lg shadow-md"
                  />
                  
                </div>
              )}
              
              {!isPaused && !waitingForSpacebarAfterPMCues && (currentPhase === 'trial' || currentPhase === 'pmCueTransitionToTrial') && showFixation && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-6xl font-bold text-gray-700">+</div>
                </div>
              )}
              
              {!isPaused && !waitingForSpacebarAfterPMCues && currentPhase === 'trial' && !showFixation && trials.length > 0 && currentTrialIndex < trials.length && trials[currentTrialIndex] && (
                <div className="flex flex-col items-center justify-center h-full">
                  <img 
                    src={trials[currentTrialIndex].src} 
                    alt={`Trial ${currentTrialIndex + 1}`} 
                    className="max-h-[350px] max-w-full object-contain rounded-lg shadow-md" 
                  />
                  {isDebugMode && (
                    <div className="mt-2 text-xs bg-gray-200 p-1 rounded">
                      Trial: {currentTrialIndex + 1}/{trials.length} | ID: {trials[currentTrialIndex].id} | PM: {trials[currentTrialIndex].isPMCue ? 'Yes' : 'No'} | 1-Back: {isOneBackMatch(currentTrialIndex) ? 'Yes' : 'No'}
                    </div>
                  )}
                </div>
              )}
              
              {!isPaused && !waitingForSpacebarAfterPMCues && currentPhase === 'blockEnd' && waitingForSpacebar && (
                <div className="text-center p-8">
                  <h3 className="text-xl font-medium mb-4">Block Complete!</h3>
                  <p className="text-lg">Press <strong>SPACEBAR</strong> to continue to the next block or session.</p>
                </div>
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
          
          {/* Debug Controls (F7 to toggle) */}
          {isDebugMode && (
            <div className="mt-4 p-4 border border-dashed border-yellow-500 rounded-md bg-yellow-50">
              <h3 className="font-bold text-yellow-800 mb-2">Debug Controls</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold mb-1">Session</h4>
                  <div className="flex space-x-2">
                    <Button 
                      variant={currentSession === 'pleasant' ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentBlock(0);
                        setCurrentSessionIndex(0);
                        setCurrentPhase('pmCue');
                        setCurrentPMCueIndex(0);
                        setCurrentTrialIndex(-1);
                        setResponses({});
                        setInitialized(false);
                      }}
                    >
                      Pleasant
                    </Button>
                    <Button 
                      variant={currentSession === 'unpleasant' ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentBlock(0);
                        setCurrentSessionIndex(0);
                        setCurrentPhase('pmCue');
                        setCurrentPMCueIndex(0);
                        setCurrentTrialIndex(-1);
                        setResponses({});
                        setInitialized(false);
                      }}
                    >
                      Unpleasant
                    </Button>
                    <Button 
                      variant={currentSession === 'neutral' ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentBlock(0);
                        setCurrentSessionIndex(0);
                        setCurrentPhase('pmCue');
                        setCurrentPMCueIndex(0);
                        setCurrentTrialIndex(-1);
                        setResponses({});
                        setInitialized(false);
                      }}
                    >
                      Neutral
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Block</h4>
                  <div className="flex space-x-2">
                    <Button 
                      variant={currentBlock === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentBlock(0);
                        setCurrentSessionIndex(0);
                        setCurrentPhase('pmCue');
                        setCurrentPMCueIndex(0);
                        setCurrentTrialIndex(-1);
                        setResponses({});
                        setInitialized(false);
                      }}
                    >
                      Block 1
                    </Button>
                    <Button 
                      variant={currentBlock === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentBlock(1);
                        setCurrentSessionIndex(0);
                        setCurrentPhase('pmCue');
                        setCurrentPMCueIndex(0);
                        setCurrentTrialIndex(-1);
                        setResponses({});
                        setInitialized(false);
                      }}
                    >
                      Block 2
                    </Button>
                    <Button 
                      variant={currentBlock === 2 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentBlock(2);
                        setCurrentSessionIndex(0);
                        setCurrentPhase('pmCue');
                        setCurrentPMCueIndex(0);
                        setCurrentTrialIndex(-1);
                        setResponses({});
                        setInitialized(false);
                      }}
                    >
                      Block 3
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 p-2 rounded text-sm">
                <div><strong>Current State:</strong></div>
                <div>Session: {currentSession}, Block: {currentBlock + 1}, Phase: {currentPhase}</div>
                <div>Trial: {currentTrialIndex + 1}/{trials.length}, PM Cue: {currentPMCueIndex + 1}/{pmCues.length}</div>
                <div>Initialized: {initialized ? 'Yes' : 'No'}, Active: {isExperimentActive ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
        </Card>
      </ErrorBoundary>
    </div>
  );
}

export default ExperimentTask;
