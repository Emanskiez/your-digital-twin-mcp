"use client";

import { useState } from "react";
import { X, Mail, User, MessageSquare, Send } from "lucide-react";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailModal({ isOpen, onClose }: EmailModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", contact: "", message: "" });
        setTimeout(() => {
          onClose();
          setSubmitStatus("idle");
        }, 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="pr-8">
            <h2 className="text-2xl font-bold text-gray-900 font-montserrat mb-1">Contact Me</h2>
            <p className="text-sm text-gray-600 font-rubik">Fill out the form below and I'll get back to you as soon as possible.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 font-rubik">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-rubik text-sm"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 font-rubik">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-rubik text-sm"
              />
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2 mb-5">
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 font-rubik">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-rubik text-sm"
            />
          </div>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800 font-rubik">
                Message sent successfully! I'll respond to you shortly.
              </p>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800 font-rubik">
                Failed to send message. Please try again or contact me directly.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-5 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-rubik">All fields are required</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all font-rubik"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-rubik inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
