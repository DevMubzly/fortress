import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Server, UserPlus, Box, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const navigate = useNavigate();
  
  // Confetti effect or similar could be nice here, but keeping it clean for now
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-slate-200 shadow-2xl">
        <DialogHeader className="text-center pb-6 border-b border-slate-100">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
             <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900">Welcome to Fortress</DialogTitle>
          <DialogDescription className="text-slate-500 mt-2">
            Your secure AI workspace is successfully configured and ready.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
           {/* Success Steps */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                   <h4 className="text-sm font-semibold text-green-800">License Verified</h4>
                   <p className="text-xs text-green-600">Enterprise license active</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                 <div>
                   <h4 className="text-sm font-semibold text-green-800">Admin Account Created</h4>
                   <p className="text-xs text-green-600">Root access established</p>
                </div>
              </div>

               <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                 <div>
                   <h4 className="text-sm font-semibold text-green-800">Infrastructure Connected</h4>
                   <p className="text-xs text-green-600">Local AI & Vector DB linked</p>
                </div>
              </div>
           </div>

           {/* Next Steps */}
           <div className="space-y-3 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recommended Next Steps</h3>
              
              <div className="grid grid-cols-2 gap-3">
                 <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all" onClick={() => { onOpenChange(false); navigate("/model-hub"); }}>
                    <Box className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-slate-700">Deploy Model</span>
                 </Button>

                 <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all" onClick={() => { onOpenChange(false); navigate("/identity-access"); }}>
                    <UserPlus className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-slate-700">Add Users</span>
                 </Button>
              </div>
           </div>
        </div>

        <DialogFooter className="sm:justify-between items-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">Press Esc to dismiss</p>
          <Button onClick={() => onOpenChange(false)} className="bg-slate-900 text-white hover:bg-slate-800">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
