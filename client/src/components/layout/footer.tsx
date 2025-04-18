import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} NeuroHealthHub. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-700">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-700">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-700">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
