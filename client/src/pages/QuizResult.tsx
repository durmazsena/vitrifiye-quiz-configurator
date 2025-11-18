import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ShoppingCart, Palette } from "lucide-react";
import { toast } from "sonner";

export default function QuizResult() {
  const [, params] = useRoute("/quiz-result/:id");
  const [, setLocation] = useLocation();
  const resultId = params?.id ? parseInt(params.id) : 0;

  const { data: result, isLoading, error } = trpc.quiz.getResult.useQuery(
    { resultId },
    { enabled: resultId > 0 }
  );

  useEffect(() => {
    if (error) {
      toast.error("Sonuçlar yüklenirken bir hata oluştu");
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Önerileriniz hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sonuç Bulunamadı</CardTitle>
            <CardDescription>Bu quiz sonucu bulunamadı veya silinmiş olabilir.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/quiz")} className="w-full">
              Yeni Quiz Başlat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const products = result.products || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container max-w-6xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Tebrikler!</h1>
          <p className="text-xl text-gray-600">
            Size özel ürün önerilerimiz hazır
          </p>
          {result.score && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Eşleşme Skoru: %{result.score}
              </Badge>
            </div>
          )}
        </div>

        {/* Recommended Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Sizin İçin Seçtiklerimiz ({products.length} ürün)
          </h2>
          {products.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Maalesef seçtiğiniz kriterlere uygun ürün bulunamadı.
                </p>
                <Button onClick={() => setLocation("/quiz")} variant="outline">
                  Quiz'i Tekrar Başlat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Palette className="w-16 h-16" />
                    </div>
                  )}
                  {product.style && (
                    <Badge className="absolute top-2 right-2 capitalize">
                      {product.style}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {(product.price / 100).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        TL
                      </div>
                      {product.category && (
                        <div className="text-sm text-gray-500 capitalize">
                          {product.category.replace("_", " ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      Detaylar
                    </Button>
                    <Button className="flex-1" size="sm">
                      Sepete Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button size="lg" onClick={() => setLocation("/quiz")} className="gap-2">
            Yeni Quiz Başlat
          </Button>
          {products.length > 0 && (
            <Button
              size="lg"
              onClick={() => {
                // Store products in sessionStorage to pass to configurator
                sessionStorage.setItem('quizResultProducts', JSON.stringify(products));
                sessionStorage.setItem('quizResultId', resultId.toString());
                
                // Store selected categories from quiz answers (question 6)
                if (result.answers && result.answers['6']) {
                  const selectedCategories = Array.isArray(result.answers['6']) 
                    ? result.answers['6'] 
                    : [result.answers['6']];
                  
                  // Map quiz category values to product categories
                  const categoryMap: Record<string, string> = {
                    'lavabo': 'lavabo',
                    'klozet': 'klozet',
                    'batarya': 'batarya',
                    'dus': 'dus_seti',
                    'karo': 'karo',
                    'dolap': 'diger',
                    'aksesuar': 'aksesuar',
                  };
                  
                  const productCategories = selectedCategories
                    .map((cat: string) => categoryMap[cat])
                    .filter((cat: string) => cat !== undefined);
                  
                  sessionStorage.setItem('quizSelectedCategories', JSON.stringify(productCategories));
                }
                
                setLocation("/configurator?fromQuiz=true");
              }}
              className="gap-2"
            >
              <Palette className="w-5 h-5" />
              Eşleşen Ürünlerle Konfigüratöre Geç
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            Ana Sayfaya Dön
          </Button>
        </div>

        {/* Additional Info - Only show if products exist */}
        {products.length > 0 && (
          <Card className="mt-12 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">💡 Bir Sonraki Adım</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Önerilen ürünleri <strong>Konfigüratör</strong> aracımızda mekanınıza yerleştirerek
                nasıl göründüklerini görebilir, farklı kombinasyonlar deneyebilir ve toplam
                maliyeti hesaplayabilirsiniz.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
