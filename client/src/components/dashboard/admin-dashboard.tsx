import React from "react";
import { Bell, MessageSquare, Globe, Edit, Video, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardWithIcon from "@/components/ui/card-with-icon";
import { useLocation } from "wouter";

interface AdminDashboardProps {
  userName: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userName }) => {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">
        Welcome, {userName}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardWithIcon icon={Bell} title="Latest Updates">
          <div className="space-y-3">
            <div className="border-l-4 border-primary-500 pl-3 py-1">
              <p className="text-sm text-neutral-600">5 new questions awaiting your response</p>
              <p className="text-xs text-neutral-400">Today</p>
            </div>
            <div className="border-l-4 border-amber-500 pl-3 py-1">
              <p className="text-sm text-neutral-600">2 new articles published by your team</p>
              <p className="text-xs text-neutral-400">Yesterday</p>
            </div>
          </div>
          <Button variant="link" onClick={() => setLocation("/updates")} className="mt-4 w-full">
            View all updates
          </Button>
        </CardWithIcon>

        <CardWithIcon icon={MessageSquare} title="Answer Questions">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">New questions</span>
              <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-medium">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Follow-ups</span>
              <span className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-medium">3</span>
            </div>
          </div>
          <Button className="w-full mt-4" onClick={() => setLocation("/answer-questions")}>
            Answer Now
          </Button>
        </CardWithIcon>

        <CardWithIcon icon={Globe} title="Public Questions">
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-neutral-800 font-medium">What causes chronic migraines?</p>
              <p className="text-xs text-neutral-500">You answered • 5 days ago</p>
            </div>
            <div className="text-sm">
              <p className="text-neutral-800 font-medium">Is dizziness related to neurological issues?</p>
              <p className="text-xs text-neutral-500">Dr. Ponnu answered • 1 week ago</p>
            </div>
          </div>
          <Button variant="link" onClick={() => setLocation("/public-questions")} className="mt-4 w-full">
            Manage public questions
          </Button>
        </CardWithIcon>

        <CardWithIcon icon={Edit} title="Create Articles" iconColor="text-emerald-600" iconBgColor="bg-emerald-100">
          <p className="text-sm text-neutral-600 mb-4">
            Share your medical expertise by publishing articles for patients.
          </p>
          <Button variant="secondary" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setLocation("/create-article")}>
            Create Article
          </Button>
        </CardWithIcon>

        <CardWithIcon icon={Video} title="Create Videos" iconColor="text-emerald-600" iconBgColor="bg-emerald-100">
          <p className="text-sm text-neutral-600 mb-4">
            Record and upload educational videos to help patients understand medical conditions.
          </p>
          <Button variant="secondary" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setLocation("/record-video")}>
            Record Video
          </Button>
        </CardWithIcon>

        <CardWithIcon icon={LineChart} title="Health Tracker" iconColor="text-neutral-600" iconBgColor="bg-neutral-100">
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-neutral-800 font-medium">Patient Progress Overview</p>
              <p className="text-xs text-neutral-500">Monitor your patients' health data</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Patients tracking health</span>
              <span className="font-medium">24</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">New updates today</span>
              <span className="font-medium text-primary-600">7</span>
            </div>
          </div>
          <Button variant="link" onClick={() => setLocation("/health-tracker")} className="mt-4 w-full">
            View health data
          </Button>
        </CardWithIcon>
      </div>
    </div>
  );
};

export default AdminDashboard;