import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";

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

interface ExperimentIntroProps {
  onStart: () => void;
}

const ExperimentIntro = ({ onStart }: ExperimentIntroProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
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

  return (
    <Card className={`w-full ${isFullScreen ? 'max-w-full h-screen' : 'max-w-3xl'} transition-all duration-300`} ref={containerRef}>
      <CardHeader className={isFullScreen ? 'pt-12' : ''}>
        <CardTitle className={`${isFullScreen ? 'text-3xl' : 'text-xl'} text-center`}>Task Instructions</CardTitle>
        <CardDescription className={`text-center ${isFullScreen ? 'text-xl' : ''}`}>
          Please read carefully before beginning
        </CardDescription>
      </CardHeader>
      <CardContent className={`space-y-6 ${isFullScreen ? 'flex flex-col flex-1 justify-center' : ''}`}>
        <div className={`space-y-4 ${isFullScreen ? 'max-w-3xl mx-auto text-lg' : ''}`}>
          <p>
            In this task, you will see images. Each image will be shown for a few seconds. It will be followed by a cross in the centre of the screen. You need to decide if you saw the same image being displaced back to back. This is called n=1 back task.
          </p>
          
          <p>
            If you see the image being repeated, you press the "n" key.
          </p>
          
          <p>
            In the beginning, few images will be shown that you have to remember and identify. If you see the images during the task, press the "z" key.
          </p>
          
          <p>
            Make sure to make a response only when the cross appears.
          </p>
        </div>

        <div className={`flex justify-center gap-4 ${isFullScreen ? 'pt-12' : 'pt-4'}`}>
          <Button 
            onClick={toggleFullScreen} 
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center gap-1"
            size="lg"
          >
            {isFullScreen ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                  <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                </svg>
                Exit Fullscreen
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
                Enter Fullscreen
              </>
            )}
          </Button>
          <Button 
            onClick={onStart} 
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperimentIntro;
