import React from "react";
import { Link } from "wouter";
import { 
  Bell, 
  Heart, 
  HelpCircle, 
  ClipboardList, 
  Globe, 
  BookOpen, 
  Video, 
  Play, 
  ArrowRight,
  LogOut,
  User,
  Fingerprint
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CardWithIcon from "@/components/ui/card-with-icon";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=fff`} />
            <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">
              Welcome home, {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Fingerprint className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-500">UID: {user?.uid}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-500">@{user?.username}</span>
              {user?.isAdmin && (
                <Badge variant="secondary" className="ml-2">Admin</Badge>
              )}
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Latest Updates Card */}
        <CardWithIcon icon={Bell} title="Latest Updates">
          <div className="space-y-3">
            <div className="border-l-4 border-primary-500 pl-3 py-1">
              <p className="text-sm text-neutral-600">New article on migraines published</p>
              <p className="text-xs text-neutral-400">2 hours ago</p>
            </div>
            <div className="border-l-4 border-amber-500 pl-3 py-1">
              <p className="text-sm text-neutral-600">Dr. Rajshekher answered your question</p>
              <p className="text-xs text-neutral-400">Yesterday</p>
            </div>
          </div>
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            View all updates
          </Link>
        </CardWithIcon>

        {/* Health Tracker Card */}
        <CardWithIcon 
          icon={Heart} 
          title="Health Tracker" 
          iconColor="text-emerald-600" 
          iconBgColor="bg-emerald-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Medication adherence</span>
              <span className="text-sm font-medium text-emerald-600">85%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "85%" }}></div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-neutral-600">Symptom tracking</span>
              <span className="text-sm font-medium text-primary-600">2 updates needed</span>
            </div>
          </div>
          <Link href="#" className="block mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500">
            Update health data
          </Link>
        </CardWithIcon>

        {/* Ask Question Card */}
        <CardWithIcon icon={HelpCircle} title="Ask a Question">
          <p className="text-sm text-neutral-600 mb-4">
            Have a medical question? Our doctors are here to help.
          </p>
          <Button asChild className="w-full">
            <Link href="/ask-question">Ask Now</Link>
          </Button>
        </CardWithIcon>

        {/* My Questions Card */}
        <CardWithIcon 
          icon={ClipboardList} 
          title="My Questions" 
          iconColor="text-neutral-600" 
          iconBgColor="bg-neutral-100"
        >
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Total questions</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Answered</span>
              <span className="font-medium text-emerald-600">10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Pending</span>
              <span className="font-medium text-amber-500">2</span>
            </div>
          </div>
          <Link href="/my-questions" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            View my questions
          </Link>
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
              <p className="text-xs text-neutral-500">Answered by Dr. Rajshekher</p>
            </div>
            <div className="text-sm">
              <p className="text-neutral-800 font-medium">Is dizziness related to neurological issues?</p>
              <p className="text-xs text-neutral-500">Answered by Dr. Ponnu</p>
            </div>
          </div>
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            Browse public questions
          </Link>
        </CardWithIcon>

        {/* Medical Articles Card */}
        <CardWithIcon 
          icon={BookOpen} 
          title="Medical Articles" 
          iconColor="text-neutral-600" 
          iconBgColor="bg-neutral-100"
        >
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-neutral-800 font-medium">Understanding Neuropathic Pain</p>
              <p className="text-xs text-neutral-500">By Dr. Rajshekher • 1 week ago</p>
            </div>
            <div className="text-sm">
              <p className="text-neutral-800 font-medium">Latest Treatments for Epilepsy</p>
              <p className="text-xs text-neutral-500">By Dr. Zain • 2 weeks ago</p>
            </div>
          </div>
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            Read all articles
          </Link>
        </CardWithIcon>

        {/* Medical Videos Card */}
        <CardWithIcon 
          icon={Video} 
          title="Medical Videos" 
          iconColor="text-neutral-600" 
          iconBgColor="bg-neutral-100"
        >
          <div className="relative rounded-lg overflow-hidden h-32 mb-3">
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=500&h=250" 
              alt="Video thumbnail" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary-600/90 flex items-center justify-center text-white">
                <Play className="h-5 w-5" />
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-800">Neurological Examination Explained</p>
          <p className="text-xs text-neutral-500">By Dr. Ponnu • 5 min</p>
          <Link href="#" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
            View all videos
          </Link>
        </CardWithIcon>
      </div>
    </div>
  );
};

export default UserDashboard;
