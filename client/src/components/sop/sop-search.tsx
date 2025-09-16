import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import type { SOPDocument } from "@shared/schema";

interface SOPSearchProps {
  onSelectSOP: (sop: SOPDocument) => void;
  className?: string;
}

export default function SOPSearch({ onSelectSOP, className }: SOPSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/sop/search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const response = await apiRequest('POST', '/api/sop/search', { 
        keywords: query.split(' ').filter(Boolean) 
      });
      return response.json();
    },
    enabled: query.length >= 2
  });

  useEffect(() => {
    setIsSearching(query.length >= 2);
  }, [query]);

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
      ) : part
    );
  };

  return (
    <div className={className} data-testid="sop-search-component">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search SOPs by keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          data-testid="input-sop-search-query"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {isSearching && (
        <div className="border border-border rounded-lg max-h-96 overflow-y-auto" data-testid="search-results-container">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <div>
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No SOPs found matching your search</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {searchResults.map((sop: SOPDocument) => (
                <div
                  key={sop.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectSOP(sop)}
                  data-testid={`search-result-${sop.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground mb-1" data-testid={`result-title-${sop.id}`}>
                        {highlightText(sop.title, query)}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`result-category-${sop.id}`}>
                        Category: {sop.category}
                      </p>
                      <p className="text-sm text-foreground line-clamp-2 mb-2">
                        {highlightText(sop.content.substring(0, 150) + '...', query)}
                      </p>
                      <div className="flex items-center space-x-2">
                        {sop.keywords?.slice(0, 3).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {highlightText(keyword, query)}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          v{sop.version} • {new Date(sop.lastUpdated || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-select-result-${sop.id}`}>
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isSearching && (
        <div className="text-center py-8 text-muted-foreground" data-testid="search-placeholder">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Start typing to search SOP documents</p>
          <p className="text-xs mt-1">Enter at least 2 characters</p>
        </div>
      )}
    </div>
  );
}
