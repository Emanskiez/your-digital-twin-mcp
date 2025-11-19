"use client";

import { Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import digitalTwinData from "@/data/digitaltwin.json";

export default function Footer() {
  const { personal_information } = digitalTwinData;

  return (
    <footer 
      id="contact" 
      className="bg-[#2c2c2c] text-white py-6 sm:py-8 shadow-lg"
    >
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-montserrat text-white group-hover:text-orange-500 transition-colors">Get In Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-rubik text-sm text-gray-300">St. Paul University Philippines<br/>Mabini Street, Tuguegarao City, 3500<br/>Cagayan, Philippines</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-rubik text-sm text-gray-300">0908-662-6571 | 0955-437-3438</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-rubik text-sm text-gray-300">dizonm628@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-montserrat text-white">Follow Me</h3>
            <div className="flex gap-4 flex-wrap">
              <a
                href="https://www.facebook.com/emanskie16"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-blue-600 border-2 border-blue-600 flex items-center justify-center text-white hover:bg-blue-700 hover:border-blue-700 transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/chris-emmanuel-dizon-140246390"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-orange-500 border-2 border-orange-500 flex items-center justify-center text-white hover:bg-orange-600 hover:border-orange-600 transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-montserrat text-white">Location</h3>
            <div className="space-y-2">
              <p className="font-rubik text-sm text-gray-300 font-semibold">St. Paul University Philippines</p>
              <p className="font-rubik text-xs text-gray-400">Mabini Street, Tuguegarao City, 3500</p>
              <p className="font-rubik text-xs text-gray-400">Cagayan, Philippines</p>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-orange-500 mt-4">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3817.6850000!2d121.72331!3d17.61722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3389f08e7f7f7f7f%3A0x7f7f7f7f7f7f7f7f!2sSt.%20Paul%20University%20Philippines!5e0!3m2!1sen!2sph!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="St. Paul University Philippines - 17°37′02″N, 121°43′24″E"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-rubik text-xs text-gray-400">
              © 2025 {personal_information.name}. All rights reserved.
            </p>
            <p className="font-rubik text-xs text-gray-400">
              Digital Twin Portfolio powered by Next.js & Groq AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
