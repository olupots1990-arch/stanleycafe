import React, { useState, useEffect, useRef, useCallback } from 'react';
import QrCodeModal from '../components/QrCodeModal';
import { ChatMessage, MenuItem, Order, OrderItem, OrderStatus, HomePageContent } from '../types';
import { startChat, sendMessageToChat } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [homeContent, setHomeContent] = useState<HomePageContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setMenu(storageService.getMenu());
    setHomeContent(storageService.getHomePageContent());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % (homeContent.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [homeContent]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleNewOrder = useCallback((newOrderData: any) => {
    const allMenuItems = storageService.getMenu();
    const orderItems: OrderItem[] = newOrderData.items.map((item: any) => {
      const menuItem = allMenuItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
      return {
        menuItemId: menuItem?.id || 'unknown',
        name: item.name,
        quantity: item.quantity,
        price: menuItem?.price || 0,
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      customer: newOrderData.customer || 'Unknown Customer',
      items: orderItems,
      total,
      status: OrderStatus.Pending,
      timestamp: new Date().toISOString(),
    };

    const existingOrders = storageService.getOrders();
    storageService.saveOrders([...existingOrders, newOrder]);

    // This is a simple way to notify the app. In a real app, you'd use a more robust system.
    window.dispatchEvent(new CustomEvent('new-order'));

  }, []);

  const handleSendMessage = async () => {
    if (userInput.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const responseText = await sendMessageToChat(userInput);

    try {
      // Check if the response is the special JSON format for an order
      const parsedOrder = JSON.parse(responseText);
      if (parsedOrder.customer && parsedOrder.items) {
        handleNewOrder(parsedOrder);
        const confirmationMessage: ChatMessage = {
          role: 'model',
          text: `Thank you, ${parsedOrder.customer}! Your order has been placed successfully. We'll notify you when it's approved.`
        };
        setMessages(prev => [...prev, confirmationMessage]);
      } else {
        throw new Error("Not an order format");
      }
    } catch (e) {
      // Not a JSON order, treat as regular text
      const modelMessage: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
    }
    
    setIsLoading(false);
  };
  
  const openChat = () => {
    const systemBrain = storageService.getSystemBrain();
    const initialMessage: ChatMessage = { role: 'model', text: 'Welcome to Stanley Cafeteria! How can I help you order today?' };
    setMessages([initialMessage]);
    startChat(systemBrain, menu, []);
    setChatOpen(true);
  };

  const currentSlide = homeContent[currentIndex];

  return (
    <div className="relative h-screen w-full overflow-hidden text-white">
      {homeContent.length > 0 && (
        <div className="absolute inset-0">
          {homeContent.map((content, index) => (
            <div
              key={content.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
            >
              {content.type === 'video' ? (
                <video 
                  src={content.url} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                />
              ) : (
                <img src={content.url} alt="Cafeteria view" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <h1 className="text-3xl font-bold tracking-wider">Stanley Cafeteria</h1>
        <Link to="/admin" className="text-sm hover:underline">Admin Login</Link>
      </header>
      
      <main className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fade-in-down">Delicious Food, Delivered Fast.</h2>
        <p className="text-lg md:text-xl max-w-2xl mb-8 animate-fade-in-up">Experience the best meals in town, ordered with a simple chat.</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => setQrModalOpen(true)}
            className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-400 transition transform hover:scale-105"
          >
            Scan QR to Order
          </button>
           <button 
            onClick={openChat}
            className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-200 transition transform hover:scale-105"
          >
            Chat to Order
          </button>
        </div>
      </main>

      {isQrModalOpen && <QrCodeModal onClose={() => setQrModalOpen(false)} />}

      {/* Chat Window */}
      <div className={`fixed bottom-0 right-0 md:right-5 bg-white dark:bg-gray-800 shadow-2xl rounded-t-lg md:rounded-lg transition-all duration-300 z-50 ${isChatOpen ? 'w-full h-full md:w-96 md:h-[600px]' : 'w-0 h-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
            <h3 className="font-bold text-gray-800 dark:text-white">Order Assistant</h3>
            <button onClick={() => setChatOpen(false)} className="text-gray-600 dark:text-gray-300 text-2xl">&times;</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, index) => (
              <div key={index} className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-xs text-white ${msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                 <div className="rounded-lg px-3 py-2 max-w-xs bg-gray-600 text-white">
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-white rounded-full animate-bounce"></span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 border-t dark:border-gray-600">
            <div className="flex">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your order..."
                className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <button onClick={handleSendMessage} className="bg-blue-500 text-white px-4 rounded-r-md hover:bg-blue-600 disabled:bg-blue-300" disabled={isLoading}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;