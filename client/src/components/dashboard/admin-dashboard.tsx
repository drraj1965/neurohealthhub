import React from "react";
import { Link } from "wouter";
import { 
  Bell, 
  MessageSquare, 
  Globe, 
  Edit, 
  Video, 
  LineChart,
  ArrowRight 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CardWithIcon from "@/components/ui/card-with-icon";
import { useAuth } from "@/context/auth-context";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">
        Admin Dashboard
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Latest Updates Card */}
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
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            View all updates
          </Link>
        </CardWithIcon>

        {/* Answer Questions Card */}
        <CardWithIcon 
          icon={MessageSquare} 
          title="Answer Questions"
        >
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
          <Button className="w-full mt-4">
            <Link href="#">Answer Now</Link>
          </Button>
        </CardWithIcon>

        {/* Public Questions Card */}
        <CardWithIcon 
          icon={Globe} 
          title="Public Questions" 
          iconColor="text-neutral-600" 
          iconBgColor="bg-neutral-100"
        >
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
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            Manage public questions
          </Link>
        </CardWithIcon>

        {/* Create Articles Card */}
        <CardWithIcon 
          icon={Edit} 
          title="Create Articles" 
          iconColor="text-emerald-600" 
          iconBgColor="bg-emerald-100"
        >
          <p className="text-sm text-neutral-600 mb-4">
            Share your medical expertise by publishing articles for patients.
          </p>
          <Button variant="secondary" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="#">Create Article</Link>
          </Button>
        </CardWithIcon>

        {/* Create Videos Card */}
        <CardWithIcon 
          icon={Video} 
          title="Create Videos" 
          iconColor="text-emerald-600" 
          iconBgColor="bg-emerald-100"
        >
          <p className="text-sm text-neutral-600 mb-4">
            Upload educational videos to help patients understand medical conditions.
          </p>
          <Button variant="secondary" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="#">Upload Video</Link>
          </Button>
        </CardWithIcon>

        {/* Health Tracker Card */}
        <CardWithIcon 
          icon={LineChart} 
          title="Health Tracker" 
          iconColor="text-neutral-600" 
          iconBgColor="bg-neutral-100"
        >
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
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            View health data
          </Link>
        </CardWithIcon>
      </div>
    </div>
  );
};

export default AdminDashboard;
