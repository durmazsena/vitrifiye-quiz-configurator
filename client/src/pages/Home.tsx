import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ClipboardList, Palette, ShoppingBag, Sparkles, User } from "lucide-react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="container py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Yapay Zeka Destekli Ürün Önerisi</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Hayalinizdeki Banyoyu Tasarlayın
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Kısa bir quiz ile ihtiyaçlarınızı belirleyin, size özel vitrifiye ürünlerini keşfedin
            ve konfigüratörümüzde mekanınızı görselleştirin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/quiz")} className="gap-2 text-lg px-8">
              <ClipboardList className="w-5 h-5" />
              Quiz'e Başla
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/configurator")}
              className="gap-2 text-lg px-8"
            >
              <Palette className="w-5 h-5" />
              Konfigüratör
            </Button>
            {isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/profile")}
                className="gap-2 text-lg px-8"
              >
                <User className="w-5 h-5" />
                Profilim
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>1. Quiz'i Tamamlayın</CardTitle>
                <CardDescription>
                  Mekan tipinizi, stil tercihinizi, bütçenizi ve özel gereksinimlerinizi
                  belirlemek için kısa bir quiz yanıtlayın.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>2. Önerileri Görün</CardTitle>
                <CardDescription>
                  Yapay zeka destekli sistemimiz, cevaplarınıza göre size en uygun vitrifiye
                  ürünlerini önerir.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>3. Tasarımınızı Oluşturun</CardTitle>
                <CardDescription>
                  Konfigüratör ile ürünleri mekanınıza yerleştirin, farklı kombinasyonlar deneyin
                  ve toplam maliyeti görün.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 px-4">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="py-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">Hemen Başlayın</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Hayalinizdeki banyoyu tasarlamanız sadece birkaç dakika uzağınızda. Ücretsiz quiz'e
              başlayın ve size özel ürün önerilerini keşfedin.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setLocation("/quiz")}
              className="gap-2 text-lg px-8"
            >
              <ClipboardList className="w-5 h-5" />
              Quiz'e Başla
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 px-4 text-center text-gray-600">
        <p>&copy; 2025 {APP_TITLE}. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
