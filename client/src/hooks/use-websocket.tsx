import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Tipe pesan WebSocket
export type WebSocketMessage = {
  type: string;
  data?: any;
};

// Tipe untuk context WebSocket
type WebSocketContextType = {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
};

// Default value untuk context
const defaultWebSocketContext: WebSocketContextType = {
  connected: false,
  sendMessage: () => {},
  lastMessage: null,
};

// Context untuk WebSocket
const WebSocketContext = createContext<WebSocketContextType>(defaultWebSocketContext);

// Provider untuk WebSocket
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);

    // Set up WebSocket event handlers
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        setSocket(null);
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Save WebSocket instance
    setSocket(ws);

    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Function to send message
  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook untuk menggunakan WebSocket
export function useWebSocket() {
  return useContext(WebSocketContext);
}