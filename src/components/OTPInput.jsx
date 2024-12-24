import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const OTPInput = () => {
  // State variables to manage OTP input, timer, resend button, messages, and success status
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);  // OTP input values
  const [countdownTimer, setCountdownTimer] = useState(30);  // Timer for OTP expiration
  const [isResendDisabled, setIsResendDisabled] = useState(true);  // Disable resend button until timer reaches 0
  const [responseMessage, setResponseMessage] = useState(null);  // Message to show success or failure of OTP verification
  const [isSuccess, setIsSuccess] = useState(false);  // Success flag for OTP verification
  const inputRefs = useRef([]);  // Refs for each OTP input field to manage focus

  // Effect to handle the countdown timer for OTP expiration
  useEffect(() => {
    if (countdownTimer > 0) {
      const interval = setInterval(() => {
        setCountdownTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);  // Cleanup on component unmount
    } else {
      setIsResendDisabled(false);  // Enable resend button when timer reaches 0
      setOtpDigits(["", "", "", "", "", ""]);  // Reset OTP fields
      setResponseMessage(null);
    }
  }, [countdownTimer]);

  // Handles input changes in each OTP field
  const handleInputChange = (e, index) => {
    const value = e.target.value;
    // Only accept numeric input
    if (/\d/.test(value)) {
      const updatedOtp = [...otpDigits];
      updatedOtp[index] = value;
      setOtpDigits(updatedOtp);

      // Focus on the next input field if the current one is filled
      if (index < otpDigits.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handles keydown events, particularly for backspace to move focus
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      // Move focus to the previous field if current field is empty
      if (otpDigits[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
      const updatedOtp = [...otpDigits];
      updatedOtp[index] = "";  // Clear current input
      setOtpDigits(updatedOtp);
    }
  };

  // Handles paste event to allow pasting the OTP into the fields
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").split("");  // Get pasted OTP characters
    const updatedOtp = otpDigits.map((_, index) => pasteData[index] || "");  // Fill OTP fields
    setOtpDigits(updatedOtp);

    // Move focus to the next empty input field
    const nextEmptyIndex = updatedOtp.findIndex((digit) => digit === "");
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex].focus();
    }
  };

  // Resets OTP input and starts the timer again when "Resend OTP" is clicked
  const handleResendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);  // Reset OTP fields
    setCountdownTimer(30);  // Reset timer to 30 seconds
    setIsResendDisabled(true);  // Disable resend button again
    setResponseMessage(null);  // Clear any existing response message
    setIsSuccess(false);  // Clear success state
  };

  // Handles OTP verification when the submit button is clicked
  const handleSubmit = async () => {
    const enteredOtp = otpDigits.join("");  // Join the OTP digits into a single string
    try {
      const response = await axios.post('http://localhost:5000/verify-otp', { otp: enteredOtp });
      setResponseMessage(response.data.message);  // Set the response message from the server
      setIsSuccess(true);  // Set success state based on server response
      setOtpDigits(["", "", "", "", "", ""]);  // Reset OTP fields
    } catch (error) {
      setResponseMessage(error.response.data.message);  // Set error message if verification fails
      setIsSuccess(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 gap-8">
      <h2 className="text-lg font-bold mb-4">Enter OTP</h2>
      
      {/* OTP input fields */}
      <div className="flex space-x-2 mb-4">
        {otpDigits.map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength="1"
            value={otpDigits[index]}  // Bind each input value to the respective OTP digit
            onChange={(e) => handleInputChange(e, index)}  // Handle input change
            onKeyDown={(e) => handleKeyDown(e, index)}  // Handle keydown events (e.g., backspace)
            onPaste={handlePaste}  // Handle paste event
            ref={(el) => (inputRefs.current[index] = el)}  // Assign ref to each input field for managing focus
            className="w-10 h-10 text-center border border-gray-300 rounded text-black"
            disabled={!isResendDisabled}
          />
        ))}
      </div>

      {/* Timer and Resend OTP button */}
      <div className="mb-4">
        {countdownTimer > 0 ? (
          <span>Resend OTP in {countdownTimer} seconds</span>
        ) : (
          <button
            onClick={handleResendOtp}  // Handle resend OTP click
            className="text-blue-500"
            disabled={isResendDisabled}  // Disable button when resend is not allowed
          >
            Resend OTP
          </button>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}  // Submit OTP for verification
        disabled={otpDigits.includes("")}  // Disable submit if any OTP field is empty
        className={`px-4 py-2 rounded text-white ${otpDigits.includes("") ? "bg-gray-400" : "bg-blue-500"}`}
      >
        Submit
      </button>

      {/* Response message */}
      {responseMessage && (
        <p className={`mt-4 text-center ${isSuccess ? "text-green-500" : "text-red-500"}`}>
          {responseMessage}
        </p>
      )}
    </div>
  );
};

export default OTPInput;