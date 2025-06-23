import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultsSummaryProps {
  results: {
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
    sessionResults: any;
    sessionWiseResults: any;
  };
  onRestart: () => void;
}

const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdaAVQfT1IXTU4RJ2mD5PogBnsCTs3H88dzD2D766GtxVg_pQ/formResponse';

const fieldNames = {
  section: 'entry.688735894',
  nBackCorrect: 'entry.2086394992',
  nBackMissed: 'entry.2291087'
};

const sendRowToGoogleForm = async (row) => {
  const formData = new FormData();
  formData.append(fieldNames.section, row.section);
  formData.append(fieldNames.nBackCorrect, row.nBackCorrect);
  formData.append(fieldNames.nBackMissed, row.nBackMissed);
  // formData.append(fieldNames.nBackFalseAlarms, row.nBackFalseAlarms);
  // formData.append(fieldNames.pmCueCorrect, row.pmCueCorrect);
  // formData.append(fieldNames.pmCueMissed, row.pmCueMissed);
  // formData.append(fieldNames.pmCueFalseAlarms, row.pmCueFalseAlarms);

  await fetch(GOOGLE_FORM_ACTION_URL, {
    method: 'POST',
    mode: 'no-cors', // Important for CORS!
    body: formData,
  });
};

const ResultsSummary = ({ results, onRestart }: ResultsSummaryProps) => {
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  // Calculate total back-to-back matches
  const totalNBackTargets = results.totalNBackMatches || (results.nBackCorrect + results.nBackMissed);
  
  // Calculate total special images
  const totalPMTargets = results.totalPMCues || (results.pmCueCorrect + results.pmCueMissed);
  
  // Calculate totals for the section-wise table
  const totalRow = ['pleasant', 'neutral', 'unpleasant'].reduce(
    (acc, section) => {
      const s = results.sessionWiseResults[section] || {};
      acc.nBackCorrect += s.nBackCorrect || 0;
      acc.nBackMissed += s.nBackMissed || 0;
      acc.nBackFalseAlarms += s.nBackFalseAlarms || 0;
      acc.pmCueCorrect += s.pmCueCorrect || 0;
      acc.pmCueMissed += s.pmCueMissed || 0;
      acc.pmCueFalseAlarms += s.pmCueFalseAlarms || 0;
      return acc;
    },
    {
      nBackCorrect: 0,
      nBackMissed: 0,
      nBackFalseAlarms: 0,
      pmCueCorrect: 0,
      pmCueMissed: 0,
      pmCueFalseAlarms: 0,
    }
  );

  const handleSendToGoogleForm = async () => {
    const rows = ['pleasant', 'neutral', 'unpleasant', 'Total'].map(section => {
      if (section === 'Total') {
        return {
          section: 'Total',
          nBackCorrect: totalRow.nBackCorrect,
          nBackMissed: totalRow.nBackMissed,
          nBackFalseAlarms: totalRow.nBackFalseAlarms,
          pmCueCorrect: totalRow.pmCueCorrect,
          pmCueMissed: totalRow.pmCueMissed,
          pmCueFalseAlarms: totalRow.pmCueFalseAlarms,
        };
      }
      const s = results.sessionWiseResults[section] || {};
      return {
        section,
        nBackCorrect: s.nBackCorrect || 0,
        nBackMissed: s.nBackMissed || 0,
        nBackFalseAlarms: s.nBackFalseAlarms || 0,
        pmCueCorrect: s.pmCueCorrect || 0,
        pmCueMissed: s.pmCueMissed || 0,
        pmCueFalseAlarms: s.pmCueFalseAlarms || 0,
      };
    });

    for (const row of rows) {
      await sendRowToGoogleForm(row);
    }
    alert('Results sent to Google Sheet via Google Form!');
  };

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
                {results.nBackAccuracy || calculatePercentage(results.nBackCorrect, totalNBackTargets)}
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
                {results.pmCueAccuracy || calculatePercentage(results.pmCueCorrect, totalPMTargets)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Detection Rate</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm flex justify-between mb-2">
                <span>Detected special images:</span>
                <span className="font-medium">{results.pmCueCorrect} / {totalPMTargets}</span>
              </div>
              <div className="text-sm flex justify-between mb-2">
                <span>Missed special images:</span>
                <span className="font-medium">{results.pmCueMissed}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>False responses :</span>
                <span className="font-medium">{results.pmCueFalseAlarms}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section-wise results table */}
        {results.sessionWiseResults && (
          <div className="bg-gray-50 p-5 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Section-wise Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 border">Section</th>
                    <th className="px-2 py-1 border" colSpan={3}>N-Back</th>
                    <th className="px-2 py-1 border" colSpan={3}>Special Image</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 border"></th>
                    <th className="px-2 py-1 border">Correct</th>
                    <th className="px-2 py-1 border">Missed</th>
                    <th className="px-2 py-1 border">False</th>
                    <th className="px-2 py-1 border">Correct</th>
                    <th className="px-2 py-1 border">Missed</th>
                    <th className="px-2 py-1 border">False</th>
                  </tr>
                </thead>
                <tbody>
                  {['pleasant', 'neutral', 'unpleasant'].map(section => (
                    <tr key={section}>
                      <td className="px-2 py-1 border font-medium capitalize">{section}</td>
                      <td className="px-2 py-1 border">{results.sessionWiseResults[section]?.nBackCorrect ?? 0}</td>
                      <td className="px-2 py-1 border">{results.sessionWiseResults[section]?.nBackMissed ?? 0}</td>
                      <td className="px-2 py-1 border">{results.sessionWiseResults[section]?.nBackFalseAlarms ?? 0}</td>
                      <td className="px-2 py-1 border">{results.sessionWiseResults[section]?.pmCueCorrect ?? 0}</td>
                      <td className="px-2 py-1 border">{results.sessionWiseResults[section]?.pmCueMissed ?? 0}</td>
                      <td className="px-2 py-1 border">{results.sessionWiseResults[section]?.pmCueFalseAlarms ?? 0}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-200 font-semibold">
                    <td className="px-2 py-1 border">Total</td>
                    <td className="px-2 py-1 border">{totalRow.nBackCorrect}</td>
                    <td className="px-2 py-1 border">{totalRow.nBackMissed}</td>
                    <td className="px-2 py-1 border">{totalRow.nBackFalseAlarms}</td>
                    <td className="px-2 py-1 border">{totalRow.pmCueCorrect}</td>
                    <td className="px-2 py-1 border">{totalRow.pmCueMissed}</td>
                    <td className="px-2 py-1 border">{totalRow.pmCueFalseAlarms}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        <div className="flex justify-center mt-6">
          <Button onClick={handleSendToGoogleForm} className="bg-green-600 hover:bg-green-700 mt-4">
            Send to Google Sheet (via Google Form)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsSummary;
