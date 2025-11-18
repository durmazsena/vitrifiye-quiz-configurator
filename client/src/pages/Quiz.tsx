import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);

  const { data: questions, isLoading } = trpc.quiz.getQuestions.useQuery();
  const submitMutation = trpc.quiz.submitAnswers.useMutation({
    onSuccess: (data) => {
      toast.success("Quiz tamamlandı! Önerileriniz hazırlanıyor...");
      setLocation(`/quiz-result/${data.resultId}`);
    },
    onError: (error) => {
      toast.error("Bir hata oluştu: " + error.message);
    },
  });

  const progress = useMemo(() => {
    if (!questions || questions.length === 0) return 0;
    return ((currentStep + 1) / questions.length) * 100;
  }, [currentStep, questions]);

  const currentQuestion = questions?.[currentStep];

  const handleAnswer = (value: any) => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id.toString();

    // Handle multiple choice differently
    if (currentQuestion.questionType === "multiple_choice") {
      const currentAnswers = answers[questionId] || [];
      const isSelected = currentAnswers.includes(value);

      setAnswers({
        ...answers,
        [questionId]: isSelected
          ? currentAnswers.filter((v: any) => v !== value)
          : [...currentAnswers, value],
      });
    } else {
      setAnswers({
        ...answers,
        [questionId]: value,
      });
    }
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id.toString();
    const hasAnswer = answers[questionId] !== undefined && 
      (Array.isArray(answers[questionId]) ? answers[questionId].length > 0 : true);

    if (!hasAnswer) {
      toast.error("Lütfen bir seçenek seçin");
      return;
    }

    if (currentStep < (questions?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question, show lead form
      setShowLeadForm(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowLeadForm(false);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate({ answers, email, name });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Quiz Bulunamadı</CardTitle>
            <CardDescription>Şu anda aktif bir quiz bulunmuyor.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (showLeadForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Son Bir Adım!</CardTitle>
              <CardDescription>
                Kişiselleştirilmiş ürün önerilerinizi görmek için lütfen iletişim bilgilerinizi paylaşın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Adınız</Label>
                <Input
                  id="name"
                  placeholder="Adınızı girin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresiniz</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !email}
                  className="flex-1"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Sonuçları Gör
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const options = currentQuestion ? JSON.parse(currentQuestion.options) : [];
  const questionId = currentQuestion?.id.toString();
  const currentAnswer = questionId ? answers[questionId] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Soru {currentStep + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{currentQuestion?.questionText}</CardTitle>
            <CardDescription>
              {currentQuestion?.questionType === "multiple_choice"
                ? "Birden fazla seçenek seçebilirsiniz"
                : "Bir seçenek seçin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option: any, index: number) => {
                const isSelected =
                  currentQuestion?.questionType === "multiple_choice"
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                    : currentAnswer === option.value;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option.value)}
                    className={`
                      relative p-6 rounded-lg border-2 transition-all text-left
                      ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-gray-200 hover:border-primary/50 hover:shadow"
                      }
                    `}
                  >
                    {option.imageUrl && (
                      <div className="mb-4 aspect-video bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={option.imageUrl}
                          alt={option.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="font-medium text-lg">{option.label}</div>
                    {option.min !== undefined && option.max !== undefined && (
                      <div className="text-sm text-gray-600 mt-1">
                        {(option.min / 100).toLocaleString("tr-TR")} -{" "}
                        {(option.max / 100).toLocaleString("tr-TR")} TL
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentStep === questions.length - 1 ? "Devam Et" : "İleri"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
