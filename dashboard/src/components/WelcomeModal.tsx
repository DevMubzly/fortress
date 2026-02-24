import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
// import { useNavigate } from "react-router-dom";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  // const navigate = useNavigate();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-slate-200 shadow-2xl">
        <DialogHeader className="text-center pb-6 border-b border-slate-100 flex items-center flex-col">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 p-3">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" className="w-full h-full">
              <path
                className="fill-blue-600"
                fillRule="evenodd"
                d="M15.052 0c6.914.513 12.434 6.033 12.947 12.947h-5.015a7.932 7.932 0 0 1-7.932-7.932V0Zm-2.105 22.985V28C6.033 27.487.513 21.967 0 15.053h5.015a7.932 7.932 0 0 1 7.932 7.932Z"
                clipRule="evenodd"
              />
              <path
                className="fill-blue-400"
                fillRule="evenodd"
                d="M0 12.947C.513 6.033 6.033.513 12.947 0v5.015a7.932 7.932 0 0 1-7.932 7.932H0Zm22.984 2.106h5.015C27.486 21.967 21.966 27.487 15.052 28v-5.015a7.932 7.932 0 0 1 7.932-7.932Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900">System Setup Complete</DialogTitle>
          <DialogDescription className="text-slate-500 mt-2">
            Your secure AI workspace has been successfully initialized.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
           {/* Success Steps */}
           <div className="space-y-3">
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
        </div>

        <DialogFooter className="sm:justify-between items-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">Press Esc to dismiss</p>
          <Button onClick={() => onOpenChange(false)} className="bg-slate-900 text-white hover:bg-slate-800 w-full sm:w-auto">
            Login to Access Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
