'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EligibleScheme } from '@/ai/schemas';
import { getDocumentReadiness } from '@/app/actions';
import type { DocumentReadinessOutput } from '@/ai/flows/document-readiness-checker';
import { Checkbox } from '@/components/ui/checkbox';
import { Bot, FileCheck, FileX, ShieldQuestion, Lightbulb } from 'lucide-react';

const commonDocuments = [
  'Aadhaar Card',
  'PAN Card',
  'Bank Passbook / Bank Account Details',
  'Land Ownership Documents (e.g., 7/12 extract, RoR)',
  'Passport Size Photograph',
  'Voter ID Card',
  'Ration Card',
  'Income Certificate',
  'Caste Certificate (if applicable)',
  'Domicile Certificate (Nivasi Praman Patra)',
  'Mobile Number linked to Aadhaar',
  'Soil Health Card',
];

type DocumentReadinessCheckerProps = {
  eligibleSchemes: EligibleScheme[];
};

const LoadingSkeleton = () => (
    <div className="result-card animate-pulse mt-8" style={{border: '1px solid rgba(130, 220, 180, 0.4)', background: 'linear-gradient(135deg, rgba(10, 70, 50, 0.7), rgba(20, 90, 70, 0.5))'}}>
        <div className="h-7 w-1/2 rounded-md bg-white/10 mb-6"></div>
        <div className="h-5 w-full rounded-md bg-white/10 mb-3"></div>
        <div className="h-5 w-5/6 rounded-md bg-white/10 mb-6"></div>
        <div className="h-5 w-full rounded-md bg-white/10 mb-3"></div>
        <div className="h-5 w-full rounded-md bg-white/10 mb-3"></div>
        <div className="h-5 w-4/6 rounded-md bg-white/10"></div>
    </div>
);


function ReadinessResults({ results }: { results: DocumentReadinessOutput }) {
    const getStatusColor = (status: string) => {
        if (status.toLowerCase().includes('ready')) return 'text-green-300';
        if (status.toLowerCase().includes('almost')) return 'text-amber-300';
        return 'text-red-300';
    }

    return (
        <div className="guide-container space-y-8 pt-6">
            <div className="guide-section">
                <h5 className="guide-title"><ShieldQuestion className="mr-3 h-5 w-5" /> Readiness Status</h5>
                <p className={`text-lg font-semibold ${getStatusColor(results.readiness_status)}`}>{results.readiness_status}</p>
            </div>
            
            {results.missing_documents.length > 0 && (
                 <div className="guide-section">
                    <h5 className="guide-title"><FileX className="mr-3 h-5 w-5" /> Missing Documents</h5>
                    <ul className="guide-list">
                        {results.missing_documents.map((doc, i) => <li key={i}>{doc}</li>)}
                    </ul>
                </div>
            )}

            {results.optional_alternatives.length > 0 && (
                <div className="guide-section">
                    <h5 className="guide-title"><Lightbulb className="mr-3 h-5 w-5" /> Suggestions & Alternatives</h5>
                    <ul className="guide-list">
                        {results.optional_alternatives.map((alt, i) => <li key={i}>{alt}</li>)}
                    </ul>
                </div>
            )}

            {results.missing_documents.length === 0 && (
                 <div className="guide-section">
                    <p className="text-green-300 font-medium">Congratulations! It looks like you have all the necessary documents to proceed.</p>
                </div>
            )}
        </div>
    )
}

export default function DocumentReadinessChecker({
  eligibleSchemes,
}: DocumentReadinessCheckerProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DocumentReadinessOutput | null>(null);
  const { toast } = useToast();

  const handleCheckboxChange = (doc: string, checked: boolean | 'indeterminate') => {
    setSelectedDocs((prev) => {
      if (checked) {
        return [...prev, doc];
      } else {
        return prev.filter((d) => d !== doc);
      }
    });
  };

  const handleCheckReadiness = async () => {
    if (selectedDocs.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No documents selected',
        description: 'Please select at least one document you have.',
      });
      return;
    }
    setIsLoading(true);
    setResults(null);
    try {
      const readinessResults = await getDocumentReadiness({
        userDocuments: selectedDocs,
        matchedSchemes: eligibleSchemes,
      });
      setResults(readinessResults);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to check document readiness. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="results-container w-full mt-16">
      <h2 className="results-title flex items-center justify-center">
        <FileCheck className="mr-4 h-9 w-9 text-amber-300" />
        Document Readiness Checker
      </h2>
      <div
        className="result-card"
        style={{
          border: '1px solid rgba(130, 220, 180, 0.4)',
          background:
            'linear-gradient(135deg, rgba(10, 80, 60, 0.8), rgba(20, 100, 80, 0.6))',
        }}
      >
        <div className="result-section">
          <h4 className='mb-6'>Select all the documents you currently have:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {commonDocuments.map((doc) => (
              <div key={doc} className="flex items-center space-x-3">
                <Checkbox
                  id={doc}
                  onCheckedChange={(checked) => handleCheckboxChange(doc, checked)}
                  className="h-5 w-5 border-slate-400 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400"
                />
                <label
                  htmlFor={doc}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                >
                  {doc}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          className="premium-btn flex items-center justify-center gap-3 w-auto px-8 py-4 text-base"
          onClick={handleCheckReadiness}
          disabled={isLoading}
          style={{marginTop: '40px'}}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner-small mr-3"></span>
              AI is Checking...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-5 w-5" />
              Check Document Readiness
            </>
          )}
        </button>

        {isLoading && <LoadingSkeleton />}
        {results && <ReadinessResults results={results} />}

      </div>
    </section>
  );
}
