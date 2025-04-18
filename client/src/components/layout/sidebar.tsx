import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface SidebarProps {
  children?: React.ReactNode;
  activePath?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ children, activePath }) => {
  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardContent className="p-4">
          {children || (
            <nav className="space-y-1">
              <Link href="/">
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activePath === "/" 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </a>
              </Link>
              <Link href="/ask-question">
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activePath === "/ask-question" 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ask a Question
                </a>
              </Link>
              <Link href="/my-questions">
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activePath === "/my-questions" 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My Questions
                </a>
              </Link>
              <Link href="/articles">
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activePath === "/articles" 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Medical Articles
                </a>
              </Link>
              <Link href="/videos">
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activePath === "/videos" 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Medical Videos
                </a>
              </Link>
            </nav>
          )}
        </CardContent>
      </Card>
      
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Tips for Asking</h3>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Be specific about your symptoms or concerns</span>
            </li>
            <li className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mention relevant medical history</span>
            </li>
            <li className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Include the duration of symptoms</span>
            </li>
            <li className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>List any medications you're taking</span>
            </li>
            <li className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Attach relevant documents or images</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
