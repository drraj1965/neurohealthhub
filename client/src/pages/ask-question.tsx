import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { 
  LayoutDashboard, 
  HelpCircle, 
  ClipboardList, 
  BookOpen,
  Video,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import AskQuestionForm from "@/components/questions/ask-question-form";
import TodayQuestions from "@/components/questions/today-questions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

const AskQuestion: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshTodayQuestions, setRefreshTodayQuestions] = useState(0);

  const handleQuestionSubmitted = () => {
    toast({
      title: "Question submitted successfully",
      description: "The doctor will be notified and respond soon."
    });
    setRefreshTodayQuestions(prev => prev + 1);
  };

  const sidebarItems = (
    <nav className="space-y-1">
      <Link href="/">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-800">
          <LayoutDashboard className="w-5 h-5 mr-2 text-neutral-500" />
          Dashboard
        </a>
      </Link>
      <Link href="/ask-question">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
          <HelpCircle className="w-5 h-5 mr-2 text-primary-600" />
          Ask a Question
        </a>
      </Link>
      <Link href="/my-questions">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-800">
          <ClipboardList className="w-5 h-5 mr-2 text-neutral-500" />
          My Questions
        </a>
      </Link>
      <Link href="/articles">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-800">
          <BookOpen className="w-5 h-5 mr-2 text-neutral-500" />
          Medical Articles
        </a>
      </Link>
      <Link href="/videos">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-800">
          <Video className="w-5 h-5 mr-2 text-neutral-500" />
          Medical Videos
        </a>
      </Link>
    </nav>
  );

  return (
    <>
      <Helmet>
        <title>Ask a Question | NeuroHealthHub</title>
      </Helmet>
      <AppLayout sidebarItems={sidebarItems} activePath="/ask-question" showSidebar={true}>
        <div className="space-y-8">
          {/* Breadcrumbs */}
          <nav className="mb-6">
            <ol className="flex space-x-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-primary-600 hover:text-primary-700">Dashboard</a>
                </Link>
              </li>
              <li className="text-neutral-500">
                <span className="mx-2">/</span>
                <span>Ask a Question</span>
              </li>
            </ol>
          </nav>

          {/* Ask Question Form */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
            </CardHeader>
            <CardContent>
              <AskQuestionForm onSuccess={handleQuestionSubmitted} />
            </CardContent>
          </Card>

          {/* Today's Questions */}
          <TodayQuestions key={refreshTodayQuestions} />
        </div>
      </AppLayout>
    </>
  );
};

export default AskQuestion;
