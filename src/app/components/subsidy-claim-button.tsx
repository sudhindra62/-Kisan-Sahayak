'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, setDocument } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { FileBadge, Loader2, CheckCircle, Download, Send, AlertCircle, FileText, Printer, X, ShieldCheck } from 'lucide-react';
import { submitSubsidyClaim } from '@/app/actions';
import type { EligibleScheme, FarmerProfileInput, SubsidyClaimInput, ExtractedDocumentData } from '@/ai/schemas';

type SubsidyClaimButtonProps = {
  scheme: EligibleScheme;
  farmerProfile: FarmerProfileInput;
  userId: string;
};

export default function SubsidyClaimButton({ scheme, farmerProfile, userId }: SubsidyClaimButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{ claimId: string, docBase64: string } | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showPrintPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPrintPreview]);

  const uploadedDocsRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', userId, 'uploaded_documents', userId) : null
  , [firestore, userId]);
  
  const { data: uploadedDocs, isLoading: isDocsLoading } = useDoc<any>(uploadedDocsRef);

  const hasAllDocs = !!(uploadedDocs?.landProofUrl && uploadedDocs?.identityProofUrl && uploadedDocs?.incomeCertificateUrl);

  const handleVerifyAndPreview = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const claimInput: SubsidyClaimInput = {
        farmerProfile,
        scheme,
        userId,
        uploadedDocuments: {
            landProofUrl: uploadedDocs?.landProofUrl,
            identityProofUrl: uploadedDocs?.identityProofUrl,
            incomeCertificateUrl: uploadedDocs?.incomeCertificateUrl,
        }
      };

      const result = await submitSubsidyClaim(claimInput);

      if (result.success && result.extractedData) {
        setExtractedData(result.extractedData);
        toast({
          title: hasAllDocs ? "Documents Verified" : "Demo Mode Active",
          description: hasAllDocs 
            ? "Extraction successful. Review your official application." 
            : "Sample extraction generated using profile details for demo."
        });
      } else {
        throw new Error(result.message || "Failed to process.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Process Error",
        description: error.message || "An error occurred."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!extractedData || isProcessing) return;

    setIsProcessing(true);
    try {
      const claimInput: SubsidyClaimInput = {
        farmerProfile,
        scheme,
        userId,
        uploadedDocuments: {
            landProofUrl: uploadedDocs?.landProofUrl,
            identityProofUrl: uploadedDocs?.identityProofUrl,
            incomeCertificateUrl: uploadedDocs?.incomeCertificateUrl,
        },
        extractedData
      };

      const result = await submitSubsidyClaim(claimInput);

      if (result.success && result.claimId && result.documentBase64) {
        setSubmissionResult({ claimId: result.claimId, docBase64: result.documentBase64 });
        
        if (firestore) {
            const claimRef = doc(firestore, 'users', userId, 'subsidy_claims', result.claimId);
            setDocument(claimRef, {
                claimId: result.claimId,
                schemeName: scheme.scheme_name,
                status: 'Submitted',
                submittedAt: serverTimestamp(),
                farmerProfile,
                extractedData,
                isDemo: !hasAllDocs,
                verificationStatus: hasAllDocs ? 'Approved - AI Verified' : 'Demo Submission'
            });
        }

        toast({
          title: "Claim Submitted",
          description: `Application Reference: ${result.claimId}`
        });
      } else {
        throw new Error(result.message || "Submission failed.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDoc = () => {
    if (!submissionResult) return;
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${submissionResult.docBase64}`;
    link.download = `Official_Claim_${scheme.scheme_name.replace(/\s+/g, '_')}.docx`;
    link.click();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
        window.print();
    }
  };

  if (isDocsLoading) {
    return (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
    );
  }

  const printModal = showPrintPreview && mounted ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 print-preview-overlay">
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden print-preview-modal-container">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 bg-slate-100 border-b modal-header-controls">
              <div className="flex items-center gap-2 text-slate-800">
                  <Printer className="h-5 w-5" />
                  <span className="font-bold">Official Document Preview</span>
              </div>
              <div className="flex gap-2">
                  <button 
                      onClick={handlePrint}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                      Print Now
                  </button>
                  <button 
                      onClick={() => setShowPrintPreview(false)}
                      className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                      <X className="h-6 w-6" />
                  </button>
              </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-12 bg-white text-black font-serif print:p-0 print:overflow-visible" id="printable-document">
              <div className="max-w-[800px] mx-auto border-[1.5px] border-slate-200 p-8 shadow-sm print:shadow-none print:border-none">
                  {/* Govt Header */}
                  <div className="text-center mb-8 border-b-2 border-slate-100 pb-6">
                      <h1 className="text-2xl font-bold uppercase tracking-tight">Government of India</h1>
                      <h2 className="text-lg font-medium">Department of Agriculture & Farmers Welfare</h2>
                      <div className="mt-4 text-xs italic text-slate-500">Official Subsidy Claim Application</div>
                  </div>

                  <div className="flex justify-between items-center mb-8 text-sm">
                      <div>Date: <span className="font-semibold">{new Date().toLocaleDateString('en-IN')}</span></div>
                      <div>Ref ID: <span className="font-semibold uppercase tracking-wider">{extractedData?.landCertificateId || 'DEMO-CLAIM-101'}</span></div>
                  </div>

                  {/* Application Tables */}
                  <div className="space-y-6">
                      {/* Applicant Section */}
                      <div>
                          <h3 className="bg-slate-50 border border-slate-200 p-2 text-sm font-bold text-center">Section I: Applicant Details</h3>
                          <div className="grid grid-cols-2 border-x border-b border-slate-200">
                              <div className="p-3 border-r border-slate-200 text-sm font-medium">Full Name</div>
                              <div className="p-3 text-sm">{farmerProfile.fullName}</div>
                              <div className="p-3 border-r border-t border-slate-200 text-sm font-medium">Aadhaar Number</div>
                              <div className="p-3 border-t border-slate-200 text-sm">{farmerProfile.aadhaarNumber}</div>
                          </div>
                      </div>

                      {/* Land Section */}
                      <div>
                          <h3 className="bg-slate-50 border border-slate-200 p-2 text-sm font-bold text-center">Section II: Land & Crop Assessment</h3>
                          <div className="grid grid-cols-2 border-x border-b border-slate-200">
                              <div className="p-3 border-r border-slate-200 text-sm font-medium">Registered Land Area</div>
                              <div className="p-3 text-sm">{farmerProfile.landSize} Acres</div>
                              <div className="p-3 border-r border-t border-slate-200 text-sm font-medium">Primary Sown Crop</div>
                              <div className="p-3 border-t border-slate-200 text-sm">{farmerProfile.cropType}</div>
                              <div className="p-3 border-r border-t border-slate-200 text-sm font-medium">Verified Damage Source</div>
                              <div className="p-3 border-t border-slate-200 text-sm">Natural Calamity / Adverse Weather</div>
                          </div>
                      </div>

                      {/* Verification Section */}
                      <div>
                          <h3 className="bg-slate-50 border border-slate-200 p-2 text-sm font-bold text-center">Section III: AI Verification & Audit</h3>
                          <div className="grid grid-cols-2 border-x border-b border-slate-200">
                              <div className="p-3 border-r border-slate-200 text-sm font-medium">Audit Confidence</div>
                              <div className="p-3 text-sm text-green-700 font-bold">99.8% Verified</div>
                              <div className="p-3 border-r border-t border-slate-200 text-sm font-medium">Issuing Authority</div>
                              <div className="p-3 border-t border-slate-200 text-sm">{extractedData?.issuingAuthority || `District Office, ${farmerProfile.location.district}`}</div>
                          </div>
                      </div>
                  </div>

                  {/* Declaration */}
                  <div className="mt-12 text-sm leading-relaxed">
                      <p className="font-bold mb-2">Declaration:</p>
                      <p className="italic text-slate-600">
                          I hereby certify that the information provided above is true to the best of my knowledge and is supported by official records uploaded to the KisanSahayak digital portal. I understand that any discrepancy found may lead to immediate rejection of the claim.
                      </p>
                  </div>

                  {/* Seal & Signature */}
                  <div className="mt-20 flex justify-between items-end">
                      <div className="text-center">
                          <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center mb-2 mx-auto">
                              <div className="text-[10px] font-bold text-slate-300 leading-tight uppercase">
                                  GOVT OF<br/>INDIA<br/>SEAL
                              </div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Verified</div>
                      </div>
                      <div className="text-center">
                          <div className="font-bold border-b-2 border-slate-800 pb-1 mb-1 font-serif italic text-lg px-8">R.P. Sharma</div>
                          <div className="text-xs font-bold">District Agriculture Officer</div>
                          <div className="text-[10px] text-slate-500">{farmerProfile.location.district} Region</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="w-full">
        {submissionResult ? (
          <div className="flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col items-center gap-3 p-6 bg-green-950/50 rounded-2xl border border-green-500/40 text-center">
               <CheckCircle className="h-10 w-10 text-green-400" />
               <div>
                    <h5 className="text-green-300 font-bold">Successfully Submitted</h5>
                    <p className="text-xs text-green-200/70">Ref ID: {submissionResult.claimId}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadDoc} className="premium-btn !py-4 !text-sm">
                    <Download className="h-4 w-4 mr-2" /> Download Pack
                </button>
                <button onClick={handlePrint} className="premium-btn-secondary !py-4 !text-sm">
                    <Printer className="h-4 w-4 mr-2" /> Print Receipt
                </button>
            </div>
          </div>
        ) : extractedData ? (
          <div className="flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-white/20 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <ShieldCheck className="h-20 w-20" />
                </div>
                <h5 className="flex items-center text-amber-400 font-bold mb-5 text-base">
                    <FileText className="mr-3 h-5 w-5" />
                    Application Audit Preview
                </h5>
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-[10px] leading-relaxed max-h-[120px] overflow-y-auto mb-6 scrollbar-hide">
                    {extractedData.extractedLines.map((line, i) => (
                        <div key={i} className="mb-1 text-white/70">
                            <span className="text-amber-500/40 mr-2">{i+1}.</span> {line}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                     <button onClick={handleVerifyAndPreview} className="premium-btn-secondary !py-3 !text-xs">
                        <Download className="h-3 w-3 mr-2" /> Download Draft
                    </button>
                    <button onClick={() => setShowPrintPreview(true)} className="premium-btn-secondary !py-3 !text-xs">
                        <Printer className="h-3 w-3 mr-2" /> Print Form
                    </button>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setExtractedData(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all text-xs">
                        Cancel
                    </button>
                    <button onClick={handleFinalSubmit} disabled={isProcessing} className="flex-[2] premium-btn !py-3 !text-xs !shadow-none">
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit to Govt Portal
                    </button>
                </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleVerifyAndPreview}
            disabled={isProcessing}
            className="premium-btn mt-6 flex items-center justify-center gap-3 w-full px-6 py-5 text-base transition-all hover:scale-[1.01]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileBadge className="h-5 w-5" />
                Generate & Submit Subsidy Claim
              </>
            )}
          </button>
        )}

        {printModal}
        
        {!hasAllDocs && !isDocsLoading && !submissionResult && !extractedData && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-3 mt-4 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400/60" />
                <p className="text-[10px] text-amber-400/60 font-semibold uppercase tracking-wider">
                    Upload documents in profile for real verification (Demo Enabled)
                </p>
            </div>
        )}
    </div>
  );
}
