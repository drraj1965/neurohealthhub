import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { 
  LayoutDashboard, 
  HelpCircle, 
  ClipboardList, 
  BookOpen,
  Video,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { getUserQuestions, getAllDoctors } from "@/lib/firebase";

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
  answers?: any[];
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

const MyQuestions: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/users/questions', user?.uid],
    queryFn: () => user ? getUserQuestions(user.uid) : Promise.resolve([]),
    enabled: !!user,
  });

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['/api/doctors'],
    queryFn: getAllDoctors,
  });

  const sidebarItems = (
    <nav className="space-y-1">
      <Link href="/">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-800">
          <LayoutDashboard className="w-5 h-5 mr-2 text-neutral-500" />
          Dashboard
        </a>
      </Link>
      <Link href="/ask-question">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-800">
          <HelpCircle className="w-5 h-5 mr-2 text-neutral-500" />
          Ask a Question
        </a>
      </Link>
      <Link href="/my-questions">
        <a className="flex items-center px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
          <ClipboardList className="w-5 h-5 mr-2 text-primary-600" />
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

  // Filter questions based on search term and filters
  const filteredQuestions = React.useMemo(() => {
    if (!questions) return [];
    
    return questions.filter((question: Question) => {
      // Search filter
      const matchesSearch = 
        searchTerm === "" || 
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Doctor filter
      const matchesDoctor = 
        filterDoctor === "all" || 
        question.doctorId === filterDoctor;
      
      // Status filter
      const hasAnswers = question.answers && question.answers.length > 0;
      const matchesStatus = 
        filterStatus === "all" || 
        (filterStatus === "answered" && hasAnswers) ||
        (filterStatus === "unanswered" && !hasAnswers);
      
      // Period filter
      let matchesPeriod = true;
      if (filterPeriod !== "all") {
        const questionDate = question.createdAt instanceof Date 
          ? question.createdAt 
          : question.createdAt.toDate();
        
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;
        
        if (filterPeriod === "today") {
          matchesPeriod = (now.getTime() - questionDate.getTime()) < oneDay;
        } else if (filterPeriod === "week") {
          matchesPeriod = (now.getTime() - questionDate.getTime()) < oneWeek;
        } else if (filterPeriod === "month") {
          matchesPeriod = (now.getTime() - questionDate.getTime()) < oneMonth;
        }
      }
      
      return matchesSearch && matchesDoctor && matchesStatus && matchesPeriod;
    });
  }, [questions, searchTerm, filterDoctor, filterStatus, filterPeriod]);

  // Format date for display
  const formatDate = (date: Date | { toDate: () => Date }) => {
    const dateObj = date instanceof Date ? date : date.toDate();
    return format(dateObj, "MMM d, yyyy 'at' h:mm a");
  };

  // Find doctor name by ID
  const getDoctorName = (doctorId: string) => {
    if (!doctors) return doctorId;
    const doctor = doctors.find((d: Doctor) => d.id === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : doctorId;
  };

  return (
    <>
      <Helmet>
        <title>My Questions | NeuroHealthHub</title>
      </Helmet>
      <AppLayout sidebarItems={sidebarItems} activePath="/my-questions" showSidebar={true}>
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <nav>
            <ol className="flex space-x-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-primary-600 hover:text-primary-700">Dashboard</a>
                </Link>
              </li>
              <li className="text-neutral-500">
                <span className="mx-2">/</span>
                <span>My Questions</span>
              </li>
            </ol>
          </nav>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>My Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search questions..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Doctors</SelectItem>
                        {!isLoadingDoctors && doctors?.map((doctor: Doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.firstName} {doctor.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Questions</SelectItem>
                        <SelectItem value="answered">Answered</SelectItem>
                        <SelectItem value="unanswered">Unanswered</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              {isLoadingQuestions ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
                    <ClipboardList className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">No questions found</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    {searchTerm || filterDoctor !== "all" || filterStatus !== "all" || filterPeriod !== "all"
                      ? "Try adjusting your filters to see more results."
                      : "You haven't asked any questions yet. Click the button below to ask your first question."}
                  </p>
                  {!searchTerm && filterDoctor === "all" && filterStatus === "all" && filterPeriod === "all" && (
                    <Button className="mt-4" asChild>
                      <Link href="/ask-question">Ask a Question</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredQuestions.map((question: Question) => (
                    <div 
                      key={question.id} 
                      className="border border-neutral-200 rounded-lg p-6 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-medium text-neutral-800 mb-2">{question.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(question.createdAt)}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span>To: {getDoctorName(question.doctorId)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {question.answers && question.answers.length > 0 ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Answered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200">
                            {question.questionType === "health-condition" 
                              ? "Health Condition" 
                              : question.questionType === "medicines" 
                                ? "Medicines" 
                                : "Other"}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-neutral-600 mb-4">{question.content}</p>
                      
                      {question.attachments && question.attachments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">Attachments:</h4>
                          <div className="flex flex-wrap gap-2">
                            {question.attachments.map((url, index) => (
                              <a 
                                key={index} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Attachment {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {question.answers && question.answers.length > 0 && (
                        <div className="border-t border-neutral-200 mt-4 pt-4">
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">
                            Responses ({question.answers.length}):
                          </h4>
                          <div className="space-y-4">
                            {question.answers.map((answer, index) => (
                              <div key={index} className="bg-neutral-50 rounded-lg p-3">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="font-medium text-neutral-800">
                                    {answer.doctorId 
                                      ? getDoctorName(answer.doctorId) 
                                      : 'You'}
                                  </span>
                                  <span className="text-neutral-500">
                                    {formatDate(answer.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-600">{answer.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/questions/${question.id}`}>View Full Conversation</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
};

export default MyQuestions;
