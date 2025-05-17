import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultsSummaryProps {
  results: {
    nBackCorrect: number;
    nBackMissed: number;
    nBackFalseAlarms: number;
    pmCueCorrect: number;
    pmCueMissed: number;
  };
  onRestart: () => void;
}

const ResultsSummary = ({ results, onRestart }: ResultsSummaryProps) => {
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  // Calculate total back-to-back matches
  const totalNBackTargets = results.nBackCorrect + results.nBackMissed;
  
  // Calculate total special images
  const totalPMTargets = results.pmCueCorrect + results.pmCueMissed;
  
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="text-center">
        <CardTitle>Your Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Back-to-back Image Detection:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-600">
                {calculatePercentage(results.nBackCorrect, totalNBackTargets)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Accuracy</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm flex justify-between mb-2">
                <span>Correct detections:</span>
                <span className="font-medium">{results.nBackCorrect} / {totalNBackTargets}</span>
              </div>
              <div className="text-sm flex justify-between mb-2">
                <span>Missed repeats:</span>
                <span className="font-medium">{results.nBackMissed}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>False responses:</span>
                <span className="font-medium">{results.nBackFalseAlarms}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Special Image Detection:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
              <div className="text-2xl font-bold text-green-600">
                {calculatePercentage(results.pmCueCorrect, totalPMTargets)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Detection Rate</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm flex justify-between mb-2">
                <span>Detected special images:</span>
                <span className="font-medium">{results.pmCueCorrect} / {totalPMTargets}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Missed special images:</span>
                <span className="font-medium">{results.pmCueMissed}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-5 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Performance Summary:</h3>
          <p className="text-sm mb-3">
            Your results show how well you were able to detect repeated images 
            while simultaneously remembering to identify special images.
          </p>
          <p className="text-sm">
            This task measures your ability to pay attention to what you're currently seeing
            while also keeping important information in mind.
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <Button onClick={onRestart} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsSummary;
