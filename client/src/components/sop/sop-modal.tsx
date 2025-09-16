import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import SOPSearch from "./sop-search";
import { X, Plus, Edit, Trash2, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SOPDocument } from "@shared/schema";

interface SOPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SOPModal({ isOpen, onClose }: SOPModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("Payment & Billing");
  const [selectedSOP, setSelectedSOP] = useState<SOPDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states for create/edit
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");

  const { toast } = useToast();

  const { data: allSOPs = [] } = useQuery({
    queryKey: ['/api/sop']
  });

  const { data: categorySOPs = [] } = useQuery({
    queryKey: ['/api/sop/category', selectedCategory],
    enabled: !!selectedCategory
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/sop/search', searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/sop/search', { keywords: [searchQuery] });
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (sopData: any) => {
      const response = await apiRequest('POST', '/api/sop', sopData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "SOP document created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sop'] });
      resetForm();
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Failed to create SOP document", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/sop/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "SOP document updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sop'] });
      resetForm();
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update SOP document", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/sop/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "SOP document deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sop'] });
      setSelectedSOP(null);
    },
    onError: () => {
      toast({ title: "Failed to delete SOP document", variant: "destructive" });
    }
  });

  const categories = [
    "Payment & Billing",
    "Shipping & Returns", 
    "Account Management",
    "Technical Support",
    "Product Information"
  ];

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setContent("");
    setKeywords("");
  };

  const handleEdit = (sop: SOPDocument) => {
    setSelectedSOP(sop);
    setTitle(sop.title);
    setCategory(sop.category);
    setContent(sop.content);
    setKeywords(sop.keywords?.join(", ") || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    const sopData = {
      title,
      category,
      content,
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      uploadedBy: "admin-1" // Should come from auth context
    };

    if (isCreating) {
      createMutation.mutate(sopData);
    } else if (selectedSOP) {
      updateMutation.mutate({ id: selectedSOP.id, updates: sopData });
    }
  };

  const handleDelete = (sop: SOPDocument) => {
    if (confirm(`Are you sure you want to delete "${sop.title}"?`)) {
      deleteMutation.mutate(sop.id);
    }
  };

  const displaySOPs = searchQuery.length > 2 ? searchResults : categorySOPs;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0" data-testid="sop-modal">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="title-sop-library">SOP Document Library</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setIsCreating(true)}
                size="sm"
                data-testid="button-create-sop"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create SOP
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-sop-modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex h-[70vh]">
          {/* Left Sidebar - Categories and Search */}
          <div className="w-64 border-r border-border p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SOPs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-sops"
                />
              </div>
              
              {/* Categories */}
              <div>
                <h4 className="font-medium text-sm mb-2" data-testid="title-categories">Categories</h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSearchQuery("");
                      }}
                      data-testid={`category-${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                    >
                      <span className="mr-2">📋</span>
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle - SOP List */}
          <div className="w-80 border-r border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground" data-testid="title-sop-list">
                {searchQuery ? `Search Results (${displaySOPs.length})` : selectedCategory}
              </h3>
            </div>
            
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {displaySOPs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="empty-state-sops">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No SOPs found</p>
                  </div>
                ) : (
                  displaySOPs.map((sop: SOPDocument) => (
                    <div
                      key={sop.id}
                      className={`p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedSOP?.id === sop.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedSOP(sop)}
                      data-testid={`sop-item-${sop.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate" data-testid={`sop-title-${sop.id}`}>
                            {sop.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Version {sop.version} • {new Date(sop.lastUpdated || '').toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sop.keywords?.slice(0, 2).map((keyword) => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(sop);
                            }}
                            data-testid={`button-edit-sop-${sop.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(sop);
                            }}
                            data-testid={`button-delete-sop-${sop.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col">
            {isCreating || isEditing ? (
              // Create/Edit Form
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" data-testid="title-edit-form">
                    {isCreating ? 'Create New SOP' : 'Edit SOP Document'}
                  </h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        resetForm();
                      }}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={!title || !category || !content}
                      data-testid="button-save-sop"
                    >
                      Save
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter SOP title"
                      data-testid="input-sop-title"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Enter category"
                      data-testid="input-sop-category"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Keywords (comma-separated)</label>
                    <Input
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="payment, billing, refund"
                      data-testid="input-sop-keywords"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter SOP content..."
                      className="min-h-[300px] resize-none"
                      data-testid="textarea-sop-content"
                    />
                  </div>
                </div>
              </div>
            ) : selectedSOP ? (
              // View SOP Content
              <div className="flex-1">
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground" data-testid="selected-sop-title">
                        {selectedSOP.title}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="selected-sop-meta">
                        Last updated: {new Date(selectedSOP.lastUpdated || '').toLocaleDateString()} • Version {selectedSOP.version}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(selectedSOP)}
                        data-testid="button-edit-selected-sop"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-6">
                  <div className="prose max-w-none" data-testid="selected-sop-content">
                    <div className="whitespace-pre-wrap text-foreground">
                      {selectedSOP.content}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              // Empty State
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center" data-testid="empty-state-selected-sop">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-foreground">Select an SOP document</h3>
                  <p className="text-muted-foreground">Choose a document from the list to view its content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
