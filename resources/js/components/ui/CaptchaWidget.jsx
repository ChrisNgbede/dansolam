import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function CaptchaWidget({
  settings = {},
  formType = 'contact', // 'contact', 'newsletter', 'reviews', 'checkout'
  verified,
  setVerified,
}) {
  const isEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
  
  // Check if form-specific captcha toggle is enabled
  const isFormEnabled = formType === 'contact' ? (settings.captcha_on_contact === undefined ? true : (settings.captcha_on_contact === 'true' || settings.captcha_on_contact === true)) :
                        formType === 'newsletter' ? (settings.captcha_on_newsletter === undefined ? true : (settings.captcha_on_newsletter === 'true' || settings.captcha_on_newsletter === true)) :
                        formType === 'reviews' ? (settings.captcha_on_reviews === undefined ? true : (settings.captcha_on_reviews === 'true' || settings.captcha_on_reviews === true)) :
                        formType === 'checkout' ? (settings.captcha_on_checkout === undefined ? true : (settings.captcha_on_checkout === 'true' || settings.captcha_on_checkout === true)) :
                        true;

  // Visual CAPTCHA challenge state
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setNumA(a);
    setNumB(b);
    setUserInput('');
    setErrorMsg('');
    if (setVerified) setVerified(false);
  };

  useEffect(() => {
    if (isEnabled && isFormEnabled) {
      generateChallenge();
    } else {
      if (setVerified) setVerified(true);
    }
  }, [isEnabled, isFormEnabled]);

  // If CAPTCHA is disabled globally or for this specific form, do not render anything!
  if (!isEnabled || !isFormEnabled) {
    return null;
  }

  const handleVerify = (val) => {
    setUserInput(val);
    const expected = (numA + numB).toString();
    if (val.trim() === expected) {
      setErrorMsg('');
      if (setVerified) setVerified(true);
    } else {
      if (setVerified) setVerified(false);
      if (val.trim().length >= expected.length) {
        setErrorMsg('Incorrect code. Please try again.');
      } else {
        setErrorMsg('');
      }
    }
  };

  return (
    <div className="w-full my-3 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs flex flex-col gap-2 font-sans select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Security Verification</span>
        </div>
        <button
          type="button"
          onClick={generateChallenge}
          className="text-gray-400 hover:text-primary transition-colors p-1 cursor-pointer"
          title="Refresh Code Challenge"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {verified ? (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-200/50">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Security check passed!</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {/* Visual Code Badge */}
            <div className="px-3.5 py-1.5 bg-gradient-to-r from-gray-900 to-gray-800 text-amber-400 font-mono font-extrabold text-sm rounded-lg tracking-widest border border-amber-400/30 shadow-inner flex items-center justify-center shrink-0">
              {numA} + {numB} = ?
            </div>

            {/* Answer Input */}
            <input
              type="number"
              value={userInput}
              onChange={(e) => handleVerify(e.target.value)}
              placeholder="Enter sum"
              className="px-3 py-1.5 w-28 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary text-center"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
