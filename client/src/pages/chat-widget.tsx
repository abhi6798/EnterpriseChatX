import CustomerChatWidget from "@/components/widget/customer-chat-widget";

export default function ChatWidget() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Customer Chat Widget Demo</h1>
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Integration Instructions</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-foreground">JavaScript Integration</h3>
              <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
{`<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-foreground">React/Vue Component</h3>
              <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
{`import { ChatWidget } from '@company/chat-widget';

function App() {
  return (
    <div>
      <ChatWidget apiUrl="${window.location.origin}" />
    </div>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
        <div className="mt-8 text-muted-foreground">
          <p>The chat widget will appear in the bottom-right corner of your website.</p>
          <p>Scroll down to see the widget in action.</p>
        </div>
      </div>

      {/* The actual widget */}
      <CustomerChatWidget />
    </div>
  );
}
