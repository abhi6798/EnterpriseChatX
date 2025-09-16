import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Book, Paperclip, Zap, Smile, Send } from "lucide-react";

interface MessageInputProps {
  sessionId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ sessionId, onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const { data: quickReplies = [] } = useQuery({
    queryKey: ['/api/quick-replies']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertQuickReply = (content: string) => {
    setMessage(content);
    setShowQuickReplies(false);
  };

  return (
    <div className="bg-card border-t border-border p-4" data-testid="message-input-container">
      <form onSubmit={handleSubmit}>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    data-testid="button-search-sop"
                  >
                    <Book className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search SOP</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    data-testid="button-add-attachment"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach File</TooltipContent>
              </Tooltip>

              <Popover open={showQuickReplies} onOpenChange={setShowQuickReplies}>
                <PopoverTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    data-testid="button-quick-replies"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Replies</h4>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {quickReplies.map((reply: any) => (
                        <Button
                          key={reply.id}
                          variant="ghost"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => insertQuickReply(reply.content)}
                          data-testid={`quick-reply-${reply.id}`}
                        >
                          <div>
                            <div className="font-medium text-xs">{reply.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {reply.content}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    data-testid="button-add-emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Emoji</TooltipContent>
              </Tooltip>
            </div>
            
            <Textarea
              placeholder={disabled ? "Chat session ended" : "Type your message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="resize-none"
              rows={3}
              data-testid="textarea-message-input"
            />
          </div>
          
          <Button 
            type="submit"
            disabled={disabled || !message.trim()}
            className="px-6 py-3"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
