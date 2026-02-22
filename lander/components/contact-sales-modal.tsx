"use client";

import { AnimatePresence, motion } from "motion/react";
import { X, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useModal } from "./modal-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  useCase: string;
  sector: string;
};

const INITIAL_DATA: FormData = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  role: "",
  useCase: "",
  sector: "",
};

const SECTORS = [
  "Healthcare",
  "Banking",
  "Telecom",
  "Government",
  "University",
  "Enterprise",
  "Other",
];

export default function ContactSalesModal() {
  const { isOpen, closeModal } = useModal();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Use a ref for the input to focus it on step change
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setFormData(INITIAL_DATA);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        // slight delay to allow animation
        setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step, isOpen]);

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const supabase = createClient();

    // Split name
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    
    const { error } = await supabase.from('leads').insert({
        first_name: firstName,
        last_name: lastName,
        work_email: formData.email,
        company_name: formData.organization,
        company_size: null, // Not collected yet
        country: null, // Not collected yet
        message: formData.useCase,
        status: 'new',
        role: formData.role,
        phone: formData.phone,
        sector: formData.sector
    });

    if (error) {
        console.error("Error submitting lead:", error);
        toast({
            title: "Submission Failed",
            description: "There was an error submitting your request. Please try again.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    // Simulate delay for UI effect before closing
    setTimeout(() => {
      closeModal();
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const currentStepData = () => {
    switch (step) {
      case 0:
        return {
          label: "What is your full name?",
          name: "name",
          type: "text",
          placeholder: "James Bond",
          value: formData.name,
        };
      case 1:
        return {
          label: "What is your work email?",
          name: "email",
          type: "email",
          placeholder: "james.bond@mi6.gov.uk",
          value: formData.email,
        };
      case 2:
        return {
          label: "What is your phone number?",
          name: "phone",
          type: "tel",
          placeholder: "+256 700 000 000",
          value: formData.phone,
        };
      case 3:
        return {
          label: "What is your organization's name?",
          name: "organization",
          type: "text",
          placeholder: "St. James University",
          value: formData.organization,
        };
      case 4:
        return {
          label: "What is your role?",
          name: "role",
          type: "text",
          placeholder: "Chief Technology Officer",
          value: formData.role,
        };
      case 5:
        return {
          label: "Which sector best describes your organization?",
          name: "sector",
          type: "select",
          options: SECTORS,
          value: formData.sector,
        };
       case 6:
        return {
          label: "Tell us about your use case",
          name: "useCase",
          type: "textarea",
          placeholder: "We are looking to deploy...",
          value: formData.useCase,
        };
      default:
        return null;
    }
  };

  const stepData = currentStepData();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl"
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 h-1 bg-gray-100 w-full">
                <motion.div 
                    className="h-full bg-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((step + 1) / 7) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
              </div>

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="px-8 py-12">
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">We've received your information and will be in touch shortly.</p>
                  </div>
                ) : (
                  <div className="min-h-[300px] flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col justify-center"
                      >
                        <label className="block text-2xl font-bold text-gray-900 mb-6">
                          {stepData?.label}
                        </label>

                        {stepData?.type === "select" ? (
                           <select
                            ref={inputRef as any}
                            name={stepData.name}
                            value={stepData.value}
                            onChange={handleChange}
                            className="w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-xl text-gray-900 placeholder:text-gray-300 focus:border-blue-600 focus:ring-0 focus:outline-none transition-colors"
                          >
                            <option value="" disabled>Select an option</option>
                            {stepData.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : stepData?.type === "textarea" ? (
                          <textarea
                            ref={inputRef as any}
                            name={stepData.name}
                            value={stepData.value}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.metaKey) {
                                    handleSubmit();
                                }
                            }}
                            placeholder={stepData.placeholder}
                            rows={3}
                            className="w-full resize-none border-0 border-b-2 border-gray-200 bg-transparent py-3 text-xl text-gray-900 placeholder:text-gray-300 focus:border-blue-600 focus:ring-0 focus:outline-none transition-colors"
                          />
                        ) : (
                          <input
                            ref={inputRef as any}
                            type={stepData?.type}
                            name={stepData?.name}
                            value={stepData?.value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder={stepData?.placeholder}
                            className="w-full border-0 border-b-2 border-gray-200 bg-transparent py-3 text-xl text-gray-900 placeholder:text-gray-300 focus:border-blue-600 focus:ring-0 focus:outline-none transition-colors"
                            autoComplete="off"
                          />
                        )}
                         {stepData?.type === "textarea" && (
                            <p className="mt-2 text-sm text-gray-400">Press Cmd+Enter to submit</p>
                         )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 flex items-center justify-between">
                      {step > 0 ? (
                         <button
                         onClick={handlePrev}
                         className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium"
                       >
                         <ArrowLeft className="w-4 h-4 mr-2" />
                         Back
                       </button>
                      ) : (
                        <button
                          onClick={closeModal}
                          className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={handleNext}
                        disabled={!stepData?.value && stepData?.type !== 'textarea'} // Allow empty textarea or handle validation properly
                        className={`flex items-center px-6 py-3 rounded-full text-white font-medium transition-all ${
                          !stepData?.value && stepData?.type !== 'textarea' 
                            ? "bg-gray-300 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                        }`}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            {step === 6 ? "Submit" : "Next"}
                            {step !== 6 && <ArrowRight className="w-4 h-4 ml-2" />}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {!isSubmitted && (
                    <p className="mt-8 text-center text-xs text-gray-400 max-w-xs mx-auto">
                        By submitting your details, you agree to our privacy policy and terms of service.
                    </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
