import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  name: string;
  displayName: string;
  productCategory: string;
  productLabels: Array<{ key: string; value: string }>;
  score: number;
  image: string;
}

interface SearchResult {
  productSearchResults: {
    results: Array<{
      product: Product;
      score: number;
    }>;
  };
}

const Results = () => {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const searchData = sessionStorage.getItem("searchData");
    if (!searchData) {
      navigate("/");
      return;
    }

    const fetchResults = async () => {
      try {
        const { file, searchText } = JSON.parse(searchData);
        
        // Updated API endpoint
        const response = await fetch("https://vision.googleapis.com/v1/images:annotate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: file,
                },
                features: [
                  {
                    type: "PRODUCT_SEARCH",
                    maxResults: 5,
                  },
                ],
                imageContext: {
                  productSearchParams: {
                    productSet: "projects/project-id/locations/location-id/productSets/product-set-id",
                    productCategories: [
                      "apparel"
                    ],
                    filter: searchText,
                  },
                },
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        setResults(data.responses[0]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch search results",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-gray-600">Searching for products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results?.productSearchResults.results.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {result.product.displayName || "Product " + (index + 1)}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Category: {result.product.productCategory}
                  </p>
                  <p className="text-sm text-gray-600">
                    Match Score: {(result.score * 100).toFixed(1)}%
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.product.productLabels.map((label, labelIndex) => (
                      <span
                        key={labelIndex}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {label.key}: {label.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;