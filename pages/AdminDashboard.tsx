import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { MenuItem, Order, OrderStatus, HomePageContent } from '../types';
import { generateVoice } from '../services/geminiService';
import Notification from '../components/Notification';
import AudioPlayer from '../components/AudioPlayer';

const DashboardHome: React.FC<{ orders: Order[] }> = ({ orders }) => (
    <div className="p-6">
        <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Total Orders</h3>
                <p className="text-4xl font-bold">{orders.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Pending Approval</h3>
                <p className="text-4xl font-bold text-yellow-500">{orders.filter(o => o.status === OrderStatus.Pending).length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Completed Orders</h3>
                <p className="text-4xl font-bold text-green-500">{orders.filter(o => o.status === OrderStatus.Delivered).length}</p>
            </div>
        </div>
    </div>
);

const MenuManagement: React.FC = () => {
    const [menu, setMenu] = useState<MenuItem[]>(storageService.getMenu());
    const [newItem, setNewItem] = useState({ name: '', description: '', price: '', imageUrl: '' });
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const handleSave = () => {
        let updatedMenu;
        if (editingItem) {
            updatedMenu = menu.map(item => item.id === editingItem.id ? { ...editingItem, price: Number(editingItem.price) } : item);
        } else {
            const newMenuItem: MenuItem = { id: `MENU-${Date.now()}`, ...newItem, price: Number(newItem.price) };
            updatedMenu = [...menu, newMenuItem];
        }
        setMenu(updatedMenu);
        storageService.saveMenu(updatedMenu);
        setNewItem({ name: '', description: '', price: '', imageUrl: '' });
        setEditingItem(null);
    };
    
    const handleDelete = (id: string) => {
        const updatedMenu = menu.filter(item => item.id !== id);
        setMenu(updatedMenu);
        storageService.saveMenu(updatedMenu);
    };

    const formTitle = editingItem ? 'Edit Menu Item' : 'Add New Menu Item';

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">Menu Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4">Current Menu</h3>
                        <div className="space-y-4">
                            {menu.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <div className="flex items-center space-x-4">
                                        <img src={item.imageUrl || 'https://picsum.photos/50'} alt={item.name} className="w-12 h-12 rounded object-cover" />
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">${item.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => setEditingItem(item)} className="text-blue-500 hover:text-blue-700">Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4">{formTitle}</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Name" value={editingItem ? editingItem.name : newItem.name} onChange={e => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setNewItem({...newItem, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <textarea placeholder="Description" value={editingItem ? editingItem.description : newItem.description} onChange={e => editingItem ? setEditingItem({...editingItem, description: e.target.value}) : setNewItem({...newItem, description: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="number" placeholder="Price" value={editingItem ? editingItem.price : newItem.price} onChange={e => editingItem ? setEditingItem({...editingItem, price: Number(e.target.value)}) : setNewItem({...newItem, price: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="text" placeholder="Image URL" value={editingItem ? editingItem.imageUrl : newItem.imageUrl} onChange={e => editingItem ? setEditingItem({...editingItem, imageUrl: e.target.value}) : setNewItem({...newItem, imageUrl: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <button onClick={handleSave} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Save Item</button>
                            {editingItem && <button onClick={() => setEditingItem(null)} className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 mt-2">Cancel Edit</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrderManagement: React.FC<{ orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>> }> = ({ orders, setOrders }) => {
    
    const updateOrderStatus = (id: string, status: OrderStatus) => {
        const updatedOrders = orders.map(order => order.id === id ? { ...order, status } : order);
        setOrders(updatedOrders);
        storageService.saveOrders(updatedOrders);
    };

    const generateReceipt = (order: Order) => {
        let receipt = `Receipt for Order #${order.id}\n`;
        receipt += `Customer: ${order.customer}\n`;
        receipt += `Date: ${new Date(order.timestamp).toLocaleString()}\n`;
        receipt += `Status: ${order.status}\n\n`;
        receipt += 'Items:\n';
        order.items.forEach(item => {
            receipt += `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        receipt += `\nTotal: $${order.total.toFixed(2)}`;
        
        const blob = new Blob([receipt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${order.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">Order Management</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-2">Order ID</th>
                                <th className="p-2">Customer</th>
                                <th className="p-2">Total</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(order => (
                                <tr key={order.id} className="border-b dark:border-gray-700">
                                    <td className="p-2 font-mono text-sm">{order.id}</td>
                                    <td className="p-2">{order.customer}</td>
                                    <td className="p-2">${order.total.toFixed(2)}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            {
                                                [OrderStatus.Pending]: 'bg-yellow-200 text-yellow-800',
                                                [OrderStatus.Approved]: 'bg-blue-200 text-blue-800',
                                                [OrderStatus.Delivered]: 'bg-green-200 text-green-800',
                                                [OrderStatus.Cancelled]: 'bg-red-200 text-red-800',
                                            }[order.status]
                                        }`}>{order.status}</span>
                                    </td>
                                    <td className="p-2 space-x-2">
                                        {order.status === OrderStatus.Pending && (
                                            <button onClick={() => updateOrderStatus(order.id, OrderStatus.Approved)} className="text-green-500 hover:text-green-700 font-bold">Approve</button>
                                        )}
                                        {order.status === OrderStatus.Approved && (
                                            <button onClick={() => updateOrderStatus(order.id, OrderStatus.Delivered)} className="text-blue-500 hover:text-blue-700 font-bold">Deliver</button>
                                        )}
                                        <button onClick={() => generateReceipt(order)} className="text-gray-500 hover:text-gray-700">Receipt</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

const HomePageContentSettings: React.FC = () => {
    const [content, setContent] = useState<HomePageContent[]>(storageService.getHomePageContent());
    const [voiceoverText, setVoiceoverText] = useState<{ [id: string]: string }>({});
    const [generatingVoice, setGeneratingVoice] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newContent: HomePageContent = {
                    id: `CONTENT-${Date.now()}`,
                    type: file.type.startsWith('image') ? 'image' : 'video',
                    url: event.target?.result as string,
                };
                const updatedContent = [...content, newContent];
                setContent(updatedContent);
                storageService.saveHomePageContent(updatedContent);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDelete = (id: string) => {
        const updatedContent = content.filter(c => c.id !== id);
        setContent(updatedContent);
        storageService.saveHomePageContent(updatedContent);
    };

    const handleGenerateVoice = async (id: string) => {
        const text = voiceoverText[id];
        if (!text || text.trim() === '') {
            setNotification({message: 'Please enter text for the voiceover.', type: 'error'});
            return;
        }
        setGeneratingVoice(id);
        const audioData = await generateVoice(text);
        if (audioData) {
            const updatedContent = content.map(c => c.id === id ? { ...c, voiceover: audioData } : c);
            setContent(updatedContent);
            storageService.saveHomePageContent(updatedContent);
            setNotification({message: 'Voiceover generated successfully!', type: 'success'});
        } else {
            setNotification({message: 'Failed to generate voiceover. Please try again.', type: 'error'});
        }
        setGeneratingVoice(null);
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">Home Page Content</h2>
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-4">
                <input type="file" onChange={handleFileChange} accept="image/*,video/*" className="mb-4" />
                <div className="space-y-4">
                    {content.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            {item.type === 'image' ? <img src={item.url} alt="content" className="w-24 h-16 object-cover rounded" /> : <video src={item.url} className="w-24 h-16 object-cover rounded" controls />}
                            <div className="flex-1 ml-4">
                                {item.type === 'video' && (
                                    <div className="flex items-center space-x-2">
                                        <input type="text" placeholder="Enter text for voiceover" className="w-full p-1 border rounded dark:bg-gray-600 dark:border-gray-500" onChange={e => setVoiceoverText({...voiceoverText, [item.id]: e.target.value})}/>
                                        <button onClick={() => handleGenerateVoice(item.id)} disabled={!!generatingVoice} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:bg-blue-300 w-40 flex justify-center items-center h-8">
                                            {generatingVoice === item.id ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Generating...</span>
                                                </>
                                            ) : 'Generate Voice'}
                                        </button>
                                    </div>
                                )}
                                {item.voiceover && <AudioPlayer base64Audio={item.voiceover} />}
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 ml-4">Delete</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const SystemBrain: React.FC = () => {
    const [brain, setBrain] = useState(storageService.getSystemBrain());
    const [saved, setSaved] = useState(false);
    
    const handleSave = () => {
        storageService.saveSystemBrain(brain);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">System Brain (Chatbot Personality)</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <p className="mb-4 text-gray-600 dark:text-gray-400">Edit the system instructions to change how the chatbot interacts with customers. Be sure to guide it on how to collect order information and finalize with a JSON object.</p>
                <textarea value={brain} onChange={e => setBrain(e.target.value)} rows={20} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono text-sm" />
                <button onClick={handleSave} className={`mt-4 px-4 py-2 rounded text-white ${saved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>{saved ? 'Saved!' : 'Save Brain'}</button>
            </div>
        </div>
    );
};

const Settings: React.FC<{orders: Order[]}> = ({ orders }) => {
    const exportToCsv = (filename: string, rows: object[]) => {
        if (!rows || rows.length === 0) {
            return;
        }
        const separator = ',';
        const keys = Object.keys(rows[0]);
        const csvContent =
            keys.join(separator) +
            '\n' +
            rows.map(row => {
                return keys.map(k => {
                    let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                    cell = cell instanceof Array ? cell.map(i => `${i.name} (x${i.quantity})`).join('; ') : cell;
                    cell = String(cell).replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(separator);
            }).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">Settings</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">Export Data</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">Download CSV files for all your restaurant's activities.</p>
                <div className="space-x-4">
                    <button onClick={() => exportToCsv('orders.csv', orders)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Export Orders CSV</button>
                    <button onClick={() => exportToCsv('menu.csv', storageService.getMenu())} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Export Menu CSV</button>
                </div>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [orders, setOrders] = useState<Order[]>(storageService.getOrders());
    const [notification, setNotification] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleNewOrder = () => {
          setOrders(storageService.getOrders());
          setNotification('New order received!');
        };
        window.addEventListener('new-order', handleNewOrder);
        return () => window.removeEventListener('new-order', handleNewOrder);
    }, []);

    const handleLogout = () => {
        storageService.saveAuth(false);
        navigate('/');
    };
    
    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/orders', label: 'Orders' },
        { path: '/admin/menu', label: 'Menu' },
        { path: '/admin/homepage', label: 'Home Page' },
        { path: '/admin/brain', label: 'System Brain' },
        { path: '/admin/settings', label: 'Settings' },
    ];

    const sidebar = (
        <div className="flex flex-col h-full bg-gray-800 text-white">
            <div className="p-4 text-2xl font-bold border-b border-gray-700">Stanley's Admin</div>
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map(item => (
                     <Link key={item.path} to={item.path} className={`block px-4 py-2 rounded ${location.pathname === item.path ? 'bg-blue-500' : 'hover:bg-gray-700'}`}>
                        {item.label}
                     </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded hover:bg-gray-700">Logout</button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            <div className={`fixed inset-y-0 left-0 z-30 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                