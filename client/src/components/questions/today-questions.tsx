import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getTodaysUserQuestions } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Question {
  id: string;
  title: string;
  content: string;
  createdAt: { toDate: () => Date } | Date;
  doctorId: string;
  userId: string;
  questionType: string;
  attachments?: string[];
  isPublic?: boolean;
}

const TodayQuestions: React.FC = () => {
  const { user } = useAuth();
  
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/users/questions/today', user?.uid],
    queryFn: () => user ? getTodaysUserQuestions(user.uid) : Promise.resolve([]),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Today's Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Today's Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <p className="text-neutral-500">You haven't asked any questions today.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format the date for display
  const formatTime = (date: Date | { toDate: () => Date }) => {
    const dateObj = date instanceof Date ? date : date.toDate();
    return format(dateObj, "h:mm a");
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Today's Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question: Question) => (
            <div key={question.id} className="border border-neutral-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-neutral-800">{question.title}</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Pending</span>
              </div>
              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{question.content}</p>
              <div className="flex justify-between items-center text-xs text-neutral-500">
                <span>To: Dr. {question.doctorId}</span>
                <span>Today at {formatTime(question.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayQuestions;
