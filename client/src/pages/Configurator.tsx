import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Save, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ShoppingCart,
  Grid3x3
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface PlacedProduct {
  productId: number;
  position: { x: number; y: number };
  rotation: number;
  product?: any;
}

export default function Configurator() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [roomType, setRoomType] = useState<"banyo" | "mutfak" | "tuvalet" | "lavabo">("banyo");
  const [placedProducts, setPlacedProducts] = useState<PlacedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [configTitle, setConfigTitle] = useState("Yeni Tasar\u0131m");
  const [configId, setConfigId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [quizProductIds, setQuizProductIds] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Get URL params for edit/view mode
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      edit: params.get('edit'),
      view: params.get('view'),
      fromQuiz: params.get('fromQuiz'),
    };
  }, []);

  const { data: products, isLoading } = trpc.products.getAll.useQuery();
  
  // Load existing configuration if in edit/view mode
  const { data: existingConfig, isLoading: configLoading } = trpc.configurations.getById.useQuery(
    { id: parseInt(urlParams.edit || urlParams.view || '0') },
    { enabled: !!(urlParams.edit || urlParams.view) }
  );

  // Load quiz products if coming from quiz
  useEffect(() => {
    if (urlParams.fromQuiz && products && products.length > 0) {
      const quizProductsJson = sessionStorage.getItem('quizResultProducts');
      const quizResultId = sessionStorage.getItem('quizResultId');
      const quizCategoriesJson = sessionStorage.getItem('quizSelectedCategories');
      
      if (quizProductsJson) {
        try {
          const quizProducts = JSON.parse(quizProductsJson);
          
          // Set room type from quiz if available (could be stored in sessionStorage)
          // For now, default to banyo
          setRoomType("banyo");
          setConfigTitle("Quiz Sonucu Tasarımı");
          
          // Place quiz products on canvas with default positions
          const placed: PlacedProduct[] = quizProducts.map((product: any, index: number) => {
            // Arrange products in a grid
            const cols = Math.ceil(Math.sqrt(quizProducts.length));
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            return {
              productId: product.id,
              position: {
                x: 100 + col * 200,
                y: 100 + row * 200,
              },
              rotation: 0,
              product: products.find(p => p.id === product.id),
            };
          });
          
          setPlacedProducts(placed);
          
          // Store quiz product IDs for highlighting
          const quizIds = quizProducts.map((p: any) => p.id);
          setQuizProductIds(quizIds);
          
          // Load selected categories from quiz
          if (quizCategoriesJson) {
            try {
              const categories = JSON.parse(quizCategoriesJson);
              setSelectedCategories(categories);
            } catch (error) {
              console.error("Failed to parse quiz categories:", error);
            }
          }
          
          toast.success(`${quizProducts.length} ürün quiz sonucundan yüklendi!`);
          
          // Clean up sessionStorage
          sessionStorage.removeItem('quizResultProducts');
          sessionStorage.removeItem('quizResultId');
          sessionStorage.removeItem('quizSelectedCategories');
        } catch (error) {
          console.error("Failed to load quiz products:", error);
          toast.error("Quiz ürünleri yüklenirken hata oluştu");
        }
      }
    }
  }, [urlParams.fromQuiz, products]);

  // Load configuration data
  useEffect(() => {
    if (existingConfig && products && !urlParams.fromQuiz) {
      setConfigTitle(existingConfig.title);
      setRoomType(existingConfig.roomType as any);
      setConfigId(existingConfig.id);
      setViewMode(!!urlParams.view);
      
      // Load placed products
      const loaded = existingConfig.selectedProducts.map((sp: any) => {
        const product = products.find(p => p.id === sp.productId);
        return {
          productId: sp.productId,
          position: sp.position,
          rotation: sp.rotation || 0,
          product,
        };
      });
      setPlacedProducts(loaded);
    }
  }, [existingConfig, products, urlParams.view, urlParams.fromQuiz]);
  const createMutation = trpc.configurations.create.useMutation({
    onSuccess: (data) => {
      toast.success("Tasar\u0131m\u0131n\u0131z kaydedildi!");
      setConfigId(data.configId);
    },
    onError: (error) => {
      toast.error("Kaydetme hatas\u0131: " + error.message);
    },
  });

  const updateMutation = trpc.configurations.update.useMutation({
    onSuccess: () => {
      toast.success("Tasar\u0131m g\u00fcncellendi!");
    },
    onError: (error) => {
      toast.error("G\u00fcncelleme hatas\u0131: " + error.message);
    },
  });

  // Canvas çizimi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid çiz
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      const gridSize = 50 * zoom;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Arka plan (mekan)
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yerleştirilmiş ürünleri çiz
    placedProducts.forEach((placed) => {
      if (!placed.product) return;

      ctx.save();
      ctx.translate(placed.position.x * zoom, placed.position.y * zoom);
      ctx.rotate((placed.rotation * Math.PI) / 180);

      // Ürün placeholder (gerçek görselleştirme için 3D kütüphane kullanılabilir)
      const size = 60 * zoom;
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(-size / 2, -size / 2, size, size);

      // Ürün adı
      ctx.fillStyle = "#1f2937";
      ctx.font = `${12 * zoom}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(placed.product.title.substring(0, 20), 0, size / 2 + 20 * zoom);

      ctx.restore();
    });
  }, [placedProducts, zoom, showGrid]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedProduct) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setPlacedProducts([
      ...placedProducts,
      {
        productId: selectedProduct.id,
        position: { x, y },
        rotation: 0,
        product: selectedProduct,
      },
    ]);

    toast.success(`${selectedProduct.title} eklendi`);
  };

  const handleRemoveProduct = (index: number) => {
    setPlacedProducts(placedProducts.filter((_, i) => i !== index));
    toast.info("Ürün kaldırıldı");
  };

  const handleRotateProduct = (index: number) => {
    const updated = [...placedProducts];
    updated[index].rotation = (updated[index].rotation + 45) % 360;
    setPlacedProducts(updated);
  };

  const handleSave = () => {
    if (placedProducts.length === 0) {
      toast.error("L\u00fctfen en az bir \u00fcr\u00fcn ekleyin");
      return;
    }

    const configData = {
      title: configTitle,
      roomType,
      selectedProducts: placedProducts.map((p) => ({
        productId: p.productId,
        position: p.position,
        rotation: p.rotation,
      })),
    };

    if (configId) {
      // Update existing
      updateMutation.mutate({
        id: configId,
        ...configData,
      });
    } else {
      // Create new
      createMutation.mutate({
        ...configData,
        isPublic: false,
      });
    }
  };

  const totalPrice = placedProducts.reduce((sum, p) => sum + (p.product?.price || 0), 0);

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const productsByCategory = products?.reduce((acc: any, product: any) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {});

  // Category labels in Turkish
  const categoryLabels: Record<string, string> = {
    'lavabo': 'Lavabo',
    'klozet': 'Klozet',
    'batarya': 'Batarya',
    'dus_seti': 'Duş Sistemi',
    'karo': 'Karo/Fayans',
    'aksesuar': 'Aksesuar',
    'ayna': 'Ayna',
    'diger': 'Diğer',
  };

  // Determine which categories to show
  const categoriesToShow = selectedCategories.length > 0 
    ? selectedCategories.filter(cat => productsByCategory?.[cat]?.length > 0)
    : Object.keys(productsByCategory || {}).filter(cat => productsByCategory[cat]?.length > 0);

  // Default category for tabs
  const defaultCategory = categoriesToShow.length > 0 ? categoriesToShow[0] : 'lavabo';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mekan Konfigüratörü</h1>
          <p className="text-gray-600">
            Ürünleri tuvale tıklayarak yerleştirin ve tasarımınızı oluşturun
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Canvas Area */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Input
                      value={configTitle}
                      onChange={(e) => setConfigTitle(e.target.value)}
                      className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                      placeholder="Tasarım adı"
                    />
                    <CardDescription>
                      {placedProducts.length} ürün yerleştirildi
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowGrid(!showGrid)}
                      title="Grid"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      title="Uzaklaştır"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      title="Yakınlaştır"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onClick={handleCanvasClick}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white"
                />
                {selectedProduct && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>{selectedProduct.title}</strong> seçildi. Tuvale tıklayarak yerleştirin.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Placed Products List */}
            {placedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Yerleştirilmiş Ürünler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {placedProducts.map((placed, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{placed.product?.title}</div>
                          <div className="text-sm text-gray-600">
                            {(placed.product?.price / 100).toLocaleString("tr-TR")} TL
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRotateProduct(index)}
                            title="Döndür"
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveProduct(index)}
                            title="Kaldır"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Toplam:</span>
                      <span className="text-2xl font-bold text-primary">
                        {(totalPrice / 100).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        TL
                      </span>
                    </div>
                    {!viewMode && (
                      <Button
                        onClick={handleSave}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="w-full gap-2"
                      >
                        {(createMutation.isPending || updateMutation.isPending) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {configId ? 'G\u00fcncelle' : 'Kaydet'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Product Catalog */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ürün Kataloğu</CardTitle>
                <CardDescription>
                  {quizProductIds.length > 0 
                    ? `${quizProductIds.length} quiz ürünü öne çıkarıldı` 
                    : "Eklemek için bir ürün seçin"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={defaultCategory} className="w-full">
                  <TabsList className={`grid w-full ${
                    categoriesToShow.length === 1 ? 'grid-cols-1' :
                    categoriesToShow.length === 2 ? 'grid-cols-2' :
                    categoriesToShow.length === 3 ? 'grid-cols-3' :
                    categoriesToShow.length === 4 ? 'grid-cols-4' :
                    'grid-cols-3'
                  }`}>
                    {categoriesToShow.map((category) => (
                      <TabsTrigger key={category} value={category}>
                        {categoryLabels[category] || category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {categoriesToShow.map((category) => {
                    const items = productsByCategory?.[category] || [];
                    // Sort items: quiz products first
                    const sortedItems = [...items].sort((a: any, b: any) => {
                      const aIsQuiz = quizProductIds.includes(a.id);
                      const bIsQuiz = quizProductIds.includes(b.id);
                      if (aIsQuiz && !bIsQuiz) return -1;
                      if (!aIsQuiz && bIsQuiz) return 1;
                      return 0;
                    });
                    
                    return (
                      <TabsContent key={category} value={category} className="space-y-3 max-h-[600px] overflow-y-auto">
                        {sortedItems.map((product: any) => {
                          const isQuizProduct = quizProductIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              onClick={() => setSelectedProduct(product)}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all relative ${
                                selectedProduct?.id === product.id
                                  ? "border-primary bg-primary/10"
                                  : isQuizProduct
                                  ? "border-green-300 bg-green-50 hover:border-green-400"
                                  : "border-gray-200 hover:border-primary/50"
                              }`}
                            >
                              {isQuizProduct && (
                                <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                                  Quiz
                                </Badge>
                              )}
                              <div className="flex items-start gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium line-clamp-2">{product.title}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {(product.price / 100).toLocaleString("tr-TR")} TL
                                  </div>
                                  {product.style && (
                                    <Badge variant="secondary" className="mt-2 capitalize">
                                      {product.style}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
