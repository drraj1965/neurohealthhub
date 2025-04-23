import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AskQuestionForm from "@/components/questions/ask-question-form";
import TodayQuestions from "@/components/questions/today-questions";
import AppLayout from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import { getTodaysUserQuestions } from "@/lib/firebase-service";
import { Loader2 } from "lucide-react";

const AskQuestion: React.FC = () => {
  const { user } = useAuth();
  const [todayQuestions, setTodayQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodayQuestions = async () => {
      if (user?.uid) {
        try {
          setIsLoading(true);
          const questions = await getTodaysUserQuestions(user.uid);
          setTodayQuestions(questions);
        } catch (error) {
          console.error("Error fetching today's questions:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTodayQuestions();
  }, [user]);

  // Refresh questions when a new one is submitted
  const handleQuestionSubmitted = async () => {
    if (user?.uid) {
      try {
        setIsLoading(true);
        const questions = await getTodaysUserQuestions(user.uid);
        setTodayQuestions(questions);
      } catch (error) {
        console.error("Error refreshing today's questions:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AppLayout activePath="/ask-question">
      <Helmet>
        <title>Ask a Question | NeuroHealthHub</title>
      </Helmet>
      
      <div className="container max-w-6xl mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ask a Question</h1>
          <p className="text-muted-foreground mt-2">
            Get answers from our neurological healthcare specialists
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Question</CardTitle>
              <CardDescription>
                Your question will be directed to the specialist you select
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AskQuestionForm onSuccess={handleQuestionSubmitted} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Questions</CardTitle>
              <CardDescription>
                Questions you've submitted today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {todayQuestions.length === 0 ? (
                    <p className="text-neutral-500 text-center py-4">No questions submitted today.</p>
                  ) : (
                    todayQuestions.map((question: any) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <h3 className="font-medium">{question.title}</h3>
                        <p className="text-sm text-neutral-600 mt-1">{question.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AskQuestion;