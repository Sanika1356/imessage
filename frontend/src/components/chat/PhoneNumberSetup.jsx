import { useState } from "react";
import { Phone, Check, X } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

export function PhoneNumberSetup({ currentUser, onUpdate, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axiosInstance.put("/contacts/phone", { phoneNumber: phoneNumber.trim() });
      toast.success("Phone number updated successfully!");
      onUpdate(res.data);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast.error(error.response?.data?.message || "Failed to update phone number");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-800 shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  Add Phone Number
                </h2>
                <p className="text-sm text-neutral-500">
                  Let others find you easily
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-3 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                required
              />
              <p className="mt-2 text-xs text-neutral-500">
                Include your country code (e.g., +1 for USA, +91 for India)
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📱 Your phone number will be used to:
              </p>
              <ul className="mt-2 text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                <li>• Let contacts find you on the platform</li>
                <li>• Start conversations easily</li>
                <li>• Connect with your real contacts</li>
              </ul>
            </div>

            <div className="flex gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Skip for now
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !phoneNumber.trim()}
                className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Phone Number
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
