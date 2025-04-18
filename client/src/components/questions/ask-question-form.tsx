import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mic, MicOff, Upload, X, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import { questionFormSchema, type QuestionFormData } from "@shared/schema";
import SpeechToTextService from "@/lib/speech-to-text";
import { submitQuestion, uploadFile, getAllDoctors } from "@/lib/firebase";
import { sendEmailNotification, sendWhatsAppNotification } from "@/lib/notifications";
import { useQuery } from "@tanstack/react-query";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  username: string;
}

const AskQuestionForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechToTextRef = useRef<SpeechToTextService | null>(null);
  
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['/api/doctors'],
    queryFn: getAllDoctors,
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      doctorId: "",
      questionType: "",
      title: "",
      content: "",
      attachments: [],
    },
  });
  
  const initSpeechToText = () => {
    if (!speechToTextRef.current) {
      speechToTextRef.current = new SpeechToTextService({
        onResult: (transcript) => {
          const currentContent = form.getValues("content");
          form.setValue("content", currentContent + " " + transcript);
        },
        onError: (error) => {
          toast({
            title: "Speech Recognition Error",
            description: error,
            variant: "destructive",
          });
          setIsListening(false);
        },
        onStart: () => {
          setIsListening(true);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }
  };

  const toggleSpeechToText = () => {
    if (!speechToTextRef.current) {
      initSpeechToText();
    }
    
    if (speechToTextRef.current) {
      speechToTextRef.current.toggle();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    
    // Check file size (max 10MB)
    const invalidFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each file must be less than 10MB",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const openFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSubmit = async (data: QuestionFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a question",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload files if any
      const fileUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const timestamp = new Date().getTime();
          const path = `questions/${user.uid}/${timestamp}_${file.name}`;
          const url = await uploadFile(file, path);
          fileUrls.push(url);
        }
      }
      
      // Prepare question data
      const questionData = {
        ...data,
        userId: user.uid,
        attachments: fileUrls,
      };
      
      // Submit question
      const questionId = await submitQuestion(questionData);
      
      // Send notifications
      const selectedDoctor = doctors?.find(doc => doc.id === data.doctorId);
      
      if (selectedDoctor?.email) {
        await sendEmailNotification({
          to: selectedDoctor.email,
          subject: `New Question: ${data.title}`,
          text: `You have received a new question: ${data.title}.\n\nQuestion: ${data.content}\n\nPlease log in to respond.`,
          html: `<h3>You have received a new question</h3><p><strong>Title:</strong> ${data.title}</p><p><strong>Question:</strong> ${data.content}</p><p>Please log in to respond.</p>`
        });
      }
      
      if (selectedDoctor?.mobile) {
        await sendWhatsAppNotification({
          to: selectedDoctor.mobile,
          body: `You have received a new question: ${data.title}. Please log in to respond.`
        });
      }
      
      toast({
        title: "Question submitted",
        description: "Your question has been sent to the doctor",
      });
      
      // Reset form
      form.reset();
      setUploadedFiles([]);
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: "Failed to submit your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="doctorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Doctor <span className="text-red-500">*</span></FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isSubmitting || isLoadingDoctors}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingDoctors ? (
                    <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                  ) : doctors?.map((doctor: Doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.firstName} {doctor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="questionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type <span className="text-red-500">*</span></FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="health-condition">Question regarding my health condition</SelectItem>
                  <SelectItem value="medicines">Question regarding my medicines</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="Brief title for your question" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Question <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea 
                    placeholder="Describe your question in detail..." 
                    rows={6} 
                    {...field} 
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200"
                    onClick={toggleSpeechToText}
                    disabled={isSubmitting}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              {isListening && (
                <div className="mt-2 text-sm text-primary-600 flex items-center">
                  <Mic className="h-4 w-4 mr-1 animate-pulse" />
                  <span>Listening... Click microphone to pause</span>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="mb-1 block">Attachments</FormLabel>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <Upload className="h-6 w-6 mx-auto text-neutral-400" />
              <p className="text-sm text-neutral-500">
                Drag and drop files, or{" "}
                <Button 
                  type="button" 
                  variant="link" 
                  className="p-0 h-auto text-primary-600 font-medium hover:text-primary-500"
                  onClick={openFileUpload}
                  disabled={isSubmitting}
                >
                  browse
                </Button>
              </p>
              <p className="text-xs text-neutral-500">
                PDF, DOCX, JPG, PNG, MP3, MP4 (Max 10MB)
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.docx,.jpg,.jpeg,.png,.mp3,.mp4"
              disabled={isSubmitting}
            />
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div className="flex items-center">
                    <div className="mr-2 text-neutral-500">
                      {file.type.includes('pdf') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : file.type.includes('word') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : file.type.includes('image') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : file.type.includes('audio') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      ) : file.type.includes('video') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-neutral-700">{file.name}</span>
                      <span className="ml-2 text-xs text-neutral-500">{(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                    className="text-neutral-400 hover:text-neutral-600 p-0 h-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Submitting...
            </>
          ) : (
            'Submit Question'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AskQuestionForm;
