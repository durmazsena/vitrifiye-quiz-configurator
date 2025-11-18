import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Palette,
  ClipboardList,
  Trash2,
  Edit,
  Share2,
  Eye,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

  const { data: configurations, isLoading: configsLoading, refetch: refetchConfigs } =
    trpc.configurations.getUserConfigurations.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const { data: quizResults, isLoading: quizLoading } = trpc.quiz.getUserResults.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const deleteMutation = trpc.configurations.delete.useMutation({
    onSuccess: () => {
      toast.success("Tasarım silindi");
      refetchConfigs();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Silme hatası: " + error.message);
    },
  });

  const updateMutation = trpc.configurations.update.useMutation({
    onSuccess: () => {
      toast.success("Tasarım güncellendi");
      refetchConfigs();
    },
    onError: (error) => {
      toast.error("Güncelleme hatası: " + error.message);
    },
  });

  const handleDelete = (id: number) => {
    setSelectedConfigId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedConfigId) {
      deleteMutation.mutate({ id: selectedConfigId });
    }
  };

  const handleTogglePublic = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      isPublic: !currentStatus,
    });
  };

  const handleEdit = (id: number) => {
    setLocation(`/configurator?edit=${id}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Giriş Yapın</CardTitle>
            <CardDescription>
              Profilinizi görüntülemek için lütfen giriş yapın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Giriş Yap</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDesigns = configurations?.length || 0;
  const totalSpent = configurations?.reduce((sum, config) => sum + (config.totalPrice || 0), 0) || 0;
  const totalQuizzes = quizResults?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profilim</h1>
          <p className="text-gray-600">Tasarımlarınızı ve quiz geçmişinizi yönetin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Tasarım
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Palette className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold">{totalDesigns}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Bütçe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold">
                  {(totalSpent / 100).toLocaleString("tr-TR", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  ₺
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tamamlanan Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold">{totalQuizzes}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="designs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="designs">Tasarımlarım</TabsTrigger>
            <TabsTrigger value="quizzes">Quiz Geçmişi</TabsTrigger>
          </TabsList>

          {/* Designs Tab */}
          <TabsContent value="designs" className="space-y-4">
            {configsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : configurations && configurations.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {configurations.map((config) => (
                  <Card key={config.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{config.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(config.createdAt).toLocaleDateString("tr-TR")}
                          </CardDescription>
                        </div>
                        <Badge variant={config.isPublic ? "default" : "secondary"}>
                          {config.isPublic ? "Paylaşıldı" : "Özel"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {config.roomType.replace("_", " ")}
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {(config.totalPrice / 100).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Label htmlFor={`public-${config.id}`} className="text-sm cursor-pointer">
                          Herkese Açık
                        </Label>
                        <Switch
                          id={`public-${config.id}`}
                          checked={config.isPublic}
                          onCheckedChange={() => handleTogglePublic(config.id, config.isPublic)}
                          disabled={updateMutation.isPending}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/configurator?view=${config.id}`)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Görüntüle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config.id)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Henüz tasarım yok</h3>
                  <p className="text-gray-600 mb-4">
                    Konfigüratörü kullanarak ilk tasarımınızı oluşturun
                  </p>
                  <Button onClick={() => setLocation("/configurator")}>
                    Tasarım Oluştur
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4">
            {quizLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : quizResults && quizResults.length > 0 ? (
              <div className="space-y-4">
                {quizResults.map((result) => (
                  <Card key={result.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Quiz Sonucu</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(result.completedAt).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </CardDescription>
                        </div>
                        {result.score && (
                          <Badge variant="secondary" className="text-lg px-4 py-2">
                            %{result.score}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {result.recommendedProducts
                            ? JSON.parse(result.recommendedProducts).length
                            : 0}{" "}
                          ürün önerildi
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/quiz-result/${result.id}`)}
                        >
                          Sonuçları Gör
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Henüz quiz tamamlamadınız</h3>
                  <p className="text-gray-600 mb-4">
                    Size özel ürün önerileri almak için quiz'i tamamlayın
                  </p>
                  <Button onClick={() => setLocation("/quiz")}>Quiz'e Başla</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tasarımı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu tasarımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
