import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Box, UserPlus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FirstLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FirstLoginModal({ open, onOpenChange }: FirstLoginModalProps) {
  const navigate = useNavigate();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-slate-200 shadow-2xl">
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
          <DialogTitle className="text-2xl font-bold text-slate-900">Welcome to Fortress</DialogTitle>
          <DialogDescription className="text-slate-500 mt-2">
            Your secure workspace is ready. Here are some quick actions to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
           {/* Next Steps */}
           <div className="space-y-3">
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
