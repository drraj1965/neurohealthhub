import React from "react";
import Header from "./header";
import Footer from "./footer";
import Sidebar from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarItems?: React.ReactNode;
  activePath?: string;
  showSidebar?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  sidebarItems,
  activePath,
  showSidebar = false
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-neutral-50">
        {showSidebar ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <Sidebar activePath={activePath}>
                  {sidebarItems}
                </Sidebar>
              </div>
              <div className="lg:col-span-3">
                {children}
              </div>
            </div>
          </div>
        ) : (
          <main className="flex-1">
            {children}
          </main>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default AppLayout;
