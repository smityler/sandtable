
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleGenAI, Type, Schema } from "@google/genai";

// --- LOCAL STORAGE UTILITIES ---

const LOCAL_STORAGE_KEY = 'finance_tracker_folders_v1';

// Load data from localStorage or return an empty array if not found
const loadData = () => {
    try {
        const json = localStorage.getItem(LOCAL_STORAGE_KEY);
        // We ensure we parse the data, or return an empty array if invalid/missing
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Could not load data from localStorage:", e);
        return [];
    }
};

// Save data to localStorage
const saveData = (data: any[]) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Could not save data to localStorage:", e);
    }
};

// --- THEME CONSTANTS ---
const TR_RED = '#A92128';
const TR_RED_HOVER = '#8a1b22';
const TR_GREY_DARK = '#212529';
const TR_GREY_MEDIUM = '#343a40';
const TR_GREY_LIGHT = '#4f4f4f';

// --- UTILITY TYPES ---
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

interface LineItem { description: string; quantity: number | null; price: number; }
interface ReceiptData { merchantName: string; merchantAddress: string; transactionDate: string; transactionTime: string; lineItems: LineItem[]; subtotal: number | null; tax: number | null; total: number; paymentMethod: string; currency: string; category: string; filenameCategory: string; last4: string | null; }
interface ReceiptJob { id: string; file: { name: string }; imageUrl: string; status: 'pending' | 'loading' | 'success' | 'error'; receiptData: ReceiptData | null; generatedLabel: string | null; error: string | null; isDuplicate?: boolean; }
interface Folder { id: string; name: string; receipts: ReceiptJob[]; }

interface FinanceTrackerProps {
    apiKey: string;
}

// --- GEMINI SERVICE LOGIC ---

const analyzeReceipt = async (base64Image: string, mimeType: string, apiKey: string): Promise<ReceiptData> => {
    const systemInstruction = "You are a specialized receipt parsing AI. Your task is to extract all key information from a receipt image and return it as a structured JSON object. Infer the transaction category and a suitable filename category (e.g., 'Groceries', 'Tools', 'Gas'). If line items are unavailable, return an empty array for lineItems, but if the total is present, ensure it is populated. For dates and times, use YYYY-MM-DD and HH:MM:SS format respectively. Infer currency and payment last 4 digits (last4).";
    const userQuery = "Analyze this receipt image and provide the structured data.";
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // JSON Schema for structured output
    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            merchantName: { type: Type.STRING, description: "The name of the merchant." },
            merchantAddress: { type: Type.STRING, description: "The merchant's address." },
            transactionDate: { type: Type.STRING, description: "The date of the transaction (YYYY-MM-DD)." },
            transactionTime: { type: Type.STRING, description: "The time of the transaction (HH:MM:SS)." },
            lineItems: {
                type: Type.ARRAY,
                description: "An array of individual items purchased.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        quantity: { type: Type.INTEGER, nullable: true },
                        price: { type: Type.NUMBER }
                    },
                    required: ["description", "price"]
                }
            },
            subtotal: { type: Type.NUMBER, description: "The subtotal before tax/tip.", nullable: true },
            tax: { type: Type.NUMBER, description: "The tax amount.", nullable: true },
            total: { type: Type.NUMBER, description: "The final total amount." },
            paymentMethod: { type: Type.STRING, description: "The payment method used (e.g., 'Visa', 'Cash')." },
            currency: { type: Type.STRING, description: "The currency code (e.g., 'USD', 'EUR')." },
            category: { type: Type.STRING, description: "The general category of the expense (e.g., 'Food', 'Travel')." },
            filenameCategory: { type: Type.STRING, description: "A simplified category for file naming (e.g., 'Groceries')." },
            last4: { type: Type.STRING, description: "The last 4 digits of the payment card, or null if not available.", nullable: true },
        },
        required: ["merchantName", "transactionDate", "total", "paymentMethod", "currency", "category", "filenameCategory"]
    };

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image
        }
    };
    const textPart = {
        text: userQuery
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("Model response was empty.");
    } catch (error) {
        console.error("Gemini API error:", error);
        throw error;
    }
};

// --- REPORTS & CHARTS COMPONENTS ---

const FinanceReports = ({ folders }: { folders: Folder[] }) => {
    // 1. Aggregation
    const allReceipts = useMemo(() => {
        return folders
            .flatMap(f => f.receipts)
            .filter(r => r.status === 'success' && r.receiptData !== null)
            .map(r => r.receiptData!)
            .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    }, [folders]);

    if (allReceipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data available for reports. Add and analyze receipts first.</p>
            </div>
        );
    }

    // 2. Metrics
    const totalSpend = allReceipts.reduce((sum, r) => sum + r.total, 0);
    const totalCount = allReceipts.length;
    const averageSpend = totalSpend / totalCount;
    const currency = allReceipts[0]?.currency || 'USD'; // Assume mostly consistent

    // 3. Category Data
    const categoryTotals: Record<string, number> = {};
    allReceipts.forEach(r => {
        const cat = r.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + r.total;
    });
    const categoryData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    const topCategory = categoryData[0]?.name || 'N/A';

    // 4. Timeline Data (Daily Aggregation)
    const dailyTotals: Record<string, number> = {};
    allReceipts.forEach(r => {
        dailyTotals[r.transactionDate] = (dailyTotals[r.transactionDate] || 0) + r.total;
    });
    const sortedDates = Object.keys(dailyTotals).sort();
    const timelineData = sortedDates.map(date => ({ date, value: dailyTotals[date] }));

    // --- Helper for Currency Formatting ---
    const formatMoney = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

    // --- Chart Configuration ---
    const maxDaily = Math.max(...timelineData.map(d => d.value)) || 1;
    
    // SVG Dimensions
    const chartHeight = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    // Using percentage based width in viewBox
    
    // Calculate points for Area Chart
    const points = timelineData.map((d, i) => {
        // X: percentage from 0 to 100
        const x = (i / (timelineData.length - 1 || 1)) * 100;
        // Y: Value scaled to chart area
        const y = chartHeight - padding.bottom - ((d.value / maxDaily) * (chartHeight - padding.top - padding.bottom));
        return `${x},${y}`;
    }).join(' ');
    
    // Add bottom corners to close the area polygon
    const areaPoints = `0,${chartHeight - padding.bottom} ${points} 100,${chartHeight - padding.bottom}`;

    // --- Improved X-Axis Logic: Scale ticks evenly ---
    const numLabels = 6;
    const labelIndices = new Set<number>();
    if (timelineData.length > 0) {
        // Always include start and end
        labelIndices.add(0);
        labelIndices.add(timelineData.length - 1);
        
        if (timelineData.length > 2) {
            // Distribute remaining labels evenly
            const step = (timelineData.length - 1) / (numLabels - 1);
            for (let i = 1; i < numLabels - 1; i++) {
                const index = Math.round(i * step);
                if (index > 0 && index < timelineData.length - 1) {
                    labelIndices.add(index);
                }
            }
        }
    }

    // Y-Axis Grid Lines (5 lines)
    const yGridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
        const val = maxDaily * pct;
        const y = chartHeight - padding.bottom - (pct * (chartHeight - padding.top - padding.bottom));
        return { val, y };
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#343a40] p-4 rounded-lg border border-gray-600 shadow-sm">
                    <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Spend</div>
                    <div className="text-2xl font-bold text-white mt-1">{formatMoney(totalSpend)}</div>
                </div>
                <div className="bg-[#343a40] p-4 rounded-lg border border-gray-600 shadow-sm">
                    <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Receipts</div>
                    <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
                </div>
                <div className="bg-[#343a40] p-4 rounded-lg border border-gray-600 shadow-sm">
                    <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Avg. Receipt</div>
                    <div className="text-2xl font-bold text-[#28a745] mt-1">{formatMoney(averageSpend)}</div>
                </div>
                <div className="bg-[#343a40] p-4 rounded-lg border border-gray-600 shadow-sm">
                    <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Top Category</div>
                    <div className="text-2xl font-bold text-[#A92128] mt-1 truncate">{topCategory}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spending Over Time Chart */}
                <div className="lg:col-span-2 bg-[#343a40] p-6 rounded-lg border border-gray-600 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">Spending Over Time</h3>
                    <div className="relative h-64 w-full">
                        {timelineData.length > 1 ? (
                            <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                <defs>
                                    <linearGradient id="financeGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor={TR_RED} stopOpacity="0.5" />
                                        <stop offset="100%" stopColor={TR_RED} stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Grid lines & Y-Axis Labels */}
                                {yGridLines.map((grid, i) => (
                                    <g key={i}>
                                        <line x1="0" y1={grid.y} x2="100" y2={grid.y} stroke="#4f4f4f" strokeWidth="0.5" strokeDasharray="2 2" />
                                        <text x="-2" y={grid.y + 3} textAnchor="end" fontSize="8" fill="#9ca3af" className="select-none">
                                            {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(grid.val)}
                                        </text>
                                    </g>
                                ))}
                                
                                {/* Area */}
                                <polygon points={areaPoints} fill="url(#financeGradient)" />
                                {/* Line */}
                                <polyline points={points} fill="none" stroke={TR_RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                                
                                {/* Data Points */}
                                {timelineData.map((d, i) => {
                                    const x = (i / (timelineData.length - 1 || 1)) * 100;
                                    const y = chartHeight - padding.bottom - ((d.value / maxDaily) * (chartHeight - padding.top - padding.bottom));
                                    return (
                                        <g key={i} className="group">
                                            <circle cx={x} cy={y} r="1.5" fill={TR_RED} stroke="#fff" strokeWidth="0.5" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {/* Tooltip simulation */}
                                            <foreignObject x={x > 50 ? x - 25 : x} y={y - 10} width="30" height="20" className="opacity-0 group-hover:opacity-100 overflow-visible pointer-events-none">
                                                 <div className="bg-gray-900 text-white text-[8px] px-1 py-0.5 rounded shadow border border-gray-600 whitespace-nowrap text-center">
                                                    {formatMoney(d.value)}
                                                 </div>
                                            </foreignObject>
                                        </g>
                                    );
                                })}

                                {/* X-Axis Labels */}
                                {timelineData.map((d, i) => {
                                    if (!labelIndices.has(i)) return null;
                                    const x = (i / (timelineData.length - 1 || 1)) * 100;
                                    // Determine anchor based on position to prevent cutoff
                                    let anchor: "middle" | "start" | "end" = "middle";
                                    if (i === 0) anchor = "start";
                                    else if (i === timelineData.length - 1) anchor = "end";

                                    return (
                                        <text key={i} x={x} y={chartHeight - 10} textAnchor={anchor} fontSize="8" fill="#9ca3af" className="select-none">
                                            {d.date.substring(5)} {/* Show MM-DD */}
                                        </text>
                                    );
                                })}
                            </svg>
                        ) : (
                             <div className="flex items-center justify-center h-full text-gray-500">Need more data points to graph history.</div>
                        )}
                    </div>
                </div>

                {/* Category Breakdown Chart */}
                <div className="lg:col-span-1 bg-[#343a40] p-6 rounded-lg border border-gray-600 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">Spending by Category</h3>
                    <div className="space-y-5 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                        {categoryData.map((cat, i) => {
                            const percent = (cat.value / totalSpend) * 100;
                            return (
                                <div key={cat.name} className="relative">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-200 font-medium">{cat.name}</span>
                                        <span className="text-gray-400">{formatMoney(cat.value)}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className="bg-[#A92128] h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-right text-xs text-gray-500 mt-0.5">{percent.toFixed(1)}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-[#343a40] rounded-lg border border-gray-600 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-600 bg-[#2d2d2d]">
                    <h3 className="text-md font-bold text-white">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#262626] text-gray-400 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Merchant</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {allReceipts.slice(0, 10).reverse().map((r, i) => (
                                <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-gray-400">{r.transactionDate}</td>
                                    <td className="p-4 font-medium text-white">{r.merchantName}</td>
                                    <td className="p-4">
                                        <span className="inline-block px-2 py-1 rounded bg-gray-700 text-xs text-gray-300 border border-gray-600">
                                            {r.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-white font-bold">{formatMoney(r.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const ReceiptField = ({ label, value }: { label: string, value: string | number | null | undefined }) => {
  if (value === undefined || value === null) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-400">{label}</p>
      <p className="text-md text-gray-200">{value}</p>
    </div>
  );
};

const LoadingSpinner = () => (
  <svg className="animate-spin h-12 w-12 text-[#A92128]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ErrorDisplay = ({ message }: { message: string }) => {
  if (!message) return null;

  const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative my-4 flex items-center" role="alert">
      <ErrorIcon />
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

const ReceiptDisplay = ({ data }: { data: ReceiptData }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(amount);
  };

  return (
    <div className="bg-[#343a40] p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-100 border-b border-gray-600 pb-3">Extracted Information</h2>
      
      <div className="space-y-4">
        <ReceiptField label="Merchant" value={data.merchantName} />
        <ReceiptField label="Address" value={data.merchantAddress} />
        <div className="grid grid-cols-2 gap-4">
          <ReceiptField label="Date" value={data.transactionDate} />
          <ReceiptField label="Time" value={data.transactionTime} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <ReceiptField label="Category" value={data.category} />
            <ReceiptField label="Payment" value={`${data.paymentMethod}${data.last4 ? ` (**** ${data.last4})` : ''}`} />
        </div>
      </div>

      {data.lineItems && data.lineItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Items Purchased</h3>
          <div className="border-t border-b border-gray-600 py-2 space-y-2 max-h-60 overflow-y-auto pr-2">
            {data.lineItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-300 flex-1 pr-2">{item.description} {item.quantity && `(x${item.quantity})`}</span>
                <span className="font-mono text-gray-200">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t-2 border-gray-600 space-y-2">
        {data.subtotal !== null && data.subtotal !== undefined && (
          <div className="flex justify-between items-center text-md">
            <span className="font-semibold text-gray-400">Subtotal</span>
            <span className="font-mono text-gray-300">{formatCurrency(data.subtotal)}</span>
          </div>
        )}
        {data.tax !== null && data.tax !== undefined && (
          <div className="flex justify-between items-center text-md">
            <span className="font-semibold text-gray-400">Tax</span>
            <span className="font-mono text-gray-300">{formatCurrency(data.tax)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xl font-bold">
          <span className="text-[#A92128]">Total</span>
          <span className="font-mono text-white">{formatCurrency(data.total)}</span>
        </div>
      </div>
    </div>
  );
};

const GeneratedLabel = ({ label, imageUrl, originalFilename }: { label: string, imageUrl: string, originalFilename: string }) => {
  const [copied, setCopied] = useState(false);

  const CopyIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
  );

  const CheckIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
  );

  const DownloadIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
  );

  const handleCopy = () => {
    const tempInput = document.createElement('textarea');
    tempInput.value = label;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const lastDotIndex = originalFilename.lastIndexOf('.');
    const extension = (lastDotIndex > 0 && lastDotIndex < originalFilename.length - 1) 
        ? originalFilename.substring(lastDotIndex + 1) 
        : 'jpg';

    // Sanitize label for filename
    const sanitizedLabel = label.replace(/[\\/:"*?<>|]+/g, '_').replace(/\s+/g, ' ').trim();
    const filename = `${sanitizedLabel}.${extension}`;
    
    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#343a40] p-4 rounded-lg shadow-lg border-l-4 border-[#A92128]">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Generated Filename</h3>
      <div className="flex items-center justify-between bg-[#212529]/70 p-3 rounded-md">
        <p className="text-md text-gray-200 font-mono break-all pr-4 text-sm leading-relaxed">
            {label}
        </p>
        <div className="flex items-center space-x-1">
            <button 
                onClick={handleDownload}
                className="p-2 rounded-md hover:bg-gray-600 transition-colors duration-200 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Download with new name"
            >
                <DownloadIcon />
            </button>
            <button 
                onClick={handleCopy} 
                className="p-2 rounded-md hover:bg-gray-600 transition-colors duration-200 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Copy to clipboard"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
        </div>
      </div>
    </div>
  );
};

const ReceiptCard: React.FC<{ job: ReceiptJob, onDelete?: () => void }> = ({ job, onDelete }) => {
    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
    
    const DuplicateIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );

    return (
        <div className={`bg-[#343a40]/50 p-6 rounded-lg shadow-lg border ${job.isDuplicate ? 'border-yellow-600/50' : 'border-gray-600'} grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative group`}>
            {/* Duplicate Warning Banner */}
            {job.isDuplicate && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-900/40 border-b border-yellow-600/30 px-4 py-1 rounded-t-lg flex items-center justify-center z-10">
                    <DuplicateIcon />
                    <span className="text-yellow-500 text-xs font-bold uppercase tracking-wide">Potential Duplicate</span>
                </div>
            )}

            {/* Delete Button */}
            <button
                onClick={onDelete}
                className="absolute top-4 right-4 p-2 bg-[#2d2d2d]/50 hover:bg-red-900/80 text-gray-400 hover:text-red-400 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20"
                title="Delete Receipt"
                aria-label="Delete receipt"
            >
                <TrashIcon />
            </button>

            <div className={job.isDuplicate ? "mt-6" : ""}>
                <h2 className="text-md font-bold mb-4 text-gray-300 truncate pr-8" title={job.file.name}>{job.file.name}</h2>
                <div className="relative aspect-[9/16] overflow-hidden rounded-md border-2 border-gray-600 bg-[#212529]">
                    <img src={job.imageUrl} alt={`Receipt preview for ${job.file.name}`} className="object-contain w-full h-full" />
                </div>
            </div>

            <div className={`space-y-6 min-h-[50vh] flex flex-col justify-center ${job.isDuplicate ? "mt-6" : ""}`}>
                {job.status === 'pending' && (
                     <div className="flex flex-col items-center justify-center text-center bg-[#343a40] p-6 rounded-lg shadow-inner h-full border border-dashed border-gray-600">
                        <p className="text-lg text-gray-400">Ready to analyze.</p>
                     </div>
                )}
                {job.status === 'loading' && (
                    <div className="flex flex-col items-center justify-center bg-[#343a40] p-6 rounded-lg shadow-inner h-full">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg text-gray-300">Analyzing...</p>
                    </div>
                )}

                {job.status === 'error' && job.error && <ErrorDisplay message={job.error} />}
                
                {job.status === 'success' && (
                    <div className="space-y-6">
                        {job.generatedLabel && <GeneratedLabel label={job.generatedLabel} imageUrl={job.imageUrl} originalFilename={job.file.name} />}
                        {job.receiptData && <ReceiptDisplay data={job.receiptData} />}
                    </div>
                )}
            </div>
        </div>
    );
};

const CameraCapture = ({ onCapture, onClose }: { onCapture: (file: File) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const CaptureIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
  );

  const CloseIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
  );

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Prioritize the rear camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
      } catch (err) {
        console.warn('Could not get rear camera, trying front camera.', err);
        // Fallback to any available camera if the rear one fails
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (finalErr) {
          console.error('Error accessing camera:', finalErr);
          setError('Could not access the camera. Please check browser permissions.');
          return;
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop all tracks of the stream when the component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(blob => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
            const fileName = `capture-${timestamp}.jpeg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            onCapture(file);
            onClose(); // Close the camera view after capture
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="camera-title">
        <div className="relative w-full max-w-2xl bg-[#212529] rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-600">
                <h2 id="camera-title" className="text-xl font-bold text-center text-gray-100">Take a Photo</h2>
            </div>
            <div className="relative aspect-video flex items-center justify-center bg-black">
                {error ? (
                    <div className="text-center text-red-400 p-4">
                        <p className="font-bold">Camera Error</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" aria-label="Live camera feed" />
                )}
                <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-center p-4 bg-[#343a40] space-x-8">
                <button
                    onClick={onClose}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-4 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="Close camera"
                >
                    <CloseIcon />
                </button>
                <button
                    onClick={handleCapture}
                    disabled={!!error}
                    className="bg-[#A92128] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold p-5 rounded-full ring-4 ring-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Capture photo"
                >
                    <CaptureIcon />
                </button>
                <div className="w-16 h-16"></div> {/* Spacer for symmetry */}
            </div>
        </div>
    </div>
  );
};

const ImageUpload = ({ onImagesUpload }: { onImagesUpload: (files: File[]) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const UploadIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
  );

  const CameraIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesUpload(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const imageFiles = (Array.from(e.dataTransfer.files) as File[]).filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            onImagesUpload(imageFiles);
        }
    }
  }, [onImagesUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleCapture = (file: File) => {
    onImagesUpload([file]);
  };

  return (
    <>
      <div className="bg-[#343a40] p-8 rounded-lg shadow-xl text-center border border-gray-600">
          <h2 className="text-2xl font-bold mb-2 text-gray-100">Upload Your Receipts</h2>
          <p className="text-gray-400 mb-6">Drag & drop, click to select, or take a photo.</p>
          <div 
              onDrop={handleDrop} 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-[#A92128] bg-[#2d2d2d]/50' : 'border-gray-600 bg-[#212529]/50'}`}
          >
              <UploadIcon />
              <p className="text-gray-300">Drop images here or click to select</p>
              <p className="text-gray-500 text-sm mt-1">PNG, JPG, or WEBP</p>
              <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload receipt images"
              />
          </div>
          <div className="mt-6">
              <button
                  onClick={() => setShowCamera(true)}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 inline-flex items-center"
              >
                  <CameraIcon />
                  Take Photo
              </button>
          </div>
      </div>
      {showCamera && (
        <CameraCapture 
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
};

const FolderManager = ({ 
    folders, 
    selectedFolderId, 
    isLoading = false,
    onAddFolder, 
    onUpdateFolder, 
    onDeleteFolder, 
    onSelectFolder 
}: {
    folders: Folder[],
    selectedFolderId: string | null,
    isLoading?: boolean,
    onAddFolder: (name: string) => void,
    onUpdateFolder: (id: string, newName: string) => void,
    onDeleteFolder: (id: string) => void,
    onSelectFolder: (id: string | null) => void
}) => {
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingFolderName, setEditingFolderName] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const EditIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
    
    const CheckIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
    
    const XIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
    
    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
    
    const ButtonSpinner = () => (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    useEffect(() => {
        if (editingFolderId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingFolderId]);

    const handleAddFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim() && !isLoading) {
            onAddFolder(newFolderName.trim());
            setNewFolderName('');
        }
    };

    const handleStartEdit = (e: React.MouseEvent, folder: Folder) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        setEditingFolderId(folder.id);
        setEditingFolderName(folder.name);
    };

    const handleDeleteClick = (e: React.MouseEvent, folderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        onDeleteFolder(folderId);
    };

    const handleCancelEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setEditingFolderId(null);
        setEditingFolderName('');
    };

    const handleSaveEdit = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (editingFolderId && editingFolderName.trim()) {
            onUpdateFolder(editingFolderId, editingFolderName.trim());
        }
        handleCancelEdit();
    };

    return (
        <div className="bg-[#343a40] p-6 rounded-lg shadow-xl border border-gray-600">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">Manage Folders</h2>
            
            <form onSubmit={handleAddFolder} className="flex items-center space-x-2 mb-6">
                <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter new folder name (e.g., Smith)"
                    disabled={isLoading}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#A92128] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="New folder name"
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !newFolderName.trim()}
                    className="bg-[#A92128] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[120px] flex justify-center items-center"
                >
                    {isLoading ? (
                        <>
                            <ButtonSpinner />
                            <span className="ml-2">Adding...</span>
                        </>
                    ) : (
                        'Add Folder'
                    )}
                </button>
            </form>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Folder:</h3>
                {folders.length === 0 ? (
                    <p className="text-gray-400">No folders created yet. Add one above to get started.</p>
                ) : (
                    <div className={`flex flex-wrap gap-2 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
                        {folders.map(folder => (
                            <div key={folder.id} className="flex items-center">
                                {editingFolderId === folder.id ? (
                                    <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editingFolderName}
                                            onChange={(e) => setEditingFolderName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') handleCancelEdit(e);
                                            }}
                                            className="bg-gray-600 rounded-md py-1 px-2 text-white w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button onClick={handleSaveEdit} aria-label="Save folder name" className="p-1 text-green-400 hover:bg-gray-600 rounded"><CheckIcon/></button>
                                        <button onClick={handleCancelEdit} aria-label="Cancel editing" className="p-1 text-red-400 hover:bg-gray-600 rounded"><XIcon/></button>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => onSelectFolder(folder.id)}
                                        className={`group flex items-center rounded-md transition-all duration-200 cursor-pointer border ${selectedFolderId === folder.id ? 'bg-[#A92128] border-[#A92128]' : 'bg-gray-700 border-transparent hover:bg-gray-600 hover:border-gray-500'}`}
                                    >
                                        <span className={`font-semibold py-2 px-3 flex items-center gap-2 ${selectedFolderId === folder.id ? 'text-white' : 'text-gray-200'}`}>
                                            {folder.name}
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedFolderId === folder.id ? 'bg-red-800 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                {folder.receipts.length}
                                            </span>
                                        </span>
                                        <div className="flex items-center border-l border-white/10">
                                            <button
                                                onClick={(e) => handleStartEdit(e, folder)}
                                                className={`p-2 ${selectedFolderId === folder.id ? 'hover:bg-red-800 text-red-200 hover:text-white' : 'hover:bg-gray-500 text-gray-400 hover:text-white'}`}
                                                aria-label={`Edit folder ${folder.name}`}
                                                title="Edit Name"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, folder.id)}
                                                className={`p-2 ${selectedFolderId === folder.id ? 'hover:bg-red-800 text-red-200 hover:text-white' : 'hover:bg-gray-500 text-gray-400 hover:text-white'}`}
                                                aria-label="Delete folder"
                                                title="Delete Folder"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
             {selectedFolderId && (
                <button 
                    onClick={() => onSelectFolder(null)}
                    disabled={isLoading}
                    className="text-sm text-gray-400 hover:text-white mt-4 underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Deselect current folder
                </button>
             )}
        </div>
    );
};

// --- CORE FINANCE APPLICATION LOGIC ---

const FinanceTracker: React.FC<FinanceTrackerProps> = ({ apiKey }) => {
    // State loaded from localStorage on initial render
    const [activeTab, setActiveTab] = useState<'manage' | 'reports'>('manage');
    const [folders, setFolders] = useState<Folder[]>(loadData);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('date-desc');
    const [isDragging, setIsDragging] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const dragCounter = useRef(0);
    const [isDataLoading, setIsDataLoading] = useState(false); // Always false since data is sync loaded

    useEffect(() => {
        // Request camera permission on mount to ensure it's available when needed
        const checkPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Close stream immediately, we just wanted the permission prompt
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                // Ignore error (user might deny, or no camera)
                console.log("Camera permission check failed or denied on mount", e);
            }
        };
        checkPermission();
    }, []);

    const activeFolder = useMemo(() => folders.find(f => f.id === selectedFolderId), [folders, selectedFolderId]);
    const jobs = activeFolder?.receipts || [];

    // Save data to localStorage whenever folders change
    useEffect(() => {
        saveData(folders);
    }, [folders]);
    
    // --- State Update Handlers (These manage React state and trigger localStorage save) ---

    const updateFoldersState = (newFolders: Folder[]) => {
        // We ensure we maintain the structural integrity for React to update correctly
        setFolders(newFolders);
    };

    // Logic to identify duplicates within a folder
    const recalculateDuplicates = (receipts: ReceiptJob[]) => {
      const successReceipts = receipts.filter(r => r.status === 'success' && r.receiptData);
      const lookup = new Map(); // Key: "Date_Total", Value: [ids]

      // Group receipts by Date + Total
      successReceipts.forEach(r => {
        if (r.receiptData) {
          const key = `${r.receiptData.transactionDate}_${r.receiptData.total.toFixed(2)}`;
          const existing = lookup.get(key) || [];
          lookup.set(key, [...existing, r.id]);
        }
      });

      const duplicateIds = new Set();
      lookup.forEach(ids => {
        if (ids.length > 1) {
          ids.forEach((id: any) => duplicateIds.add(id));
        }
      });

      return receipts.map(r => ({
        ...r,
        isDuplicate: duplicateIds.has(r.id)
      }));
    };

    // --- Folder Management Handlers ---

    const handleAddFolder = (name: string) => {
        const newFolder: Folder = {
            id: generateId(),
            name,
            receipts: []
        };
        updateFoldersState([...folders, newFolder]);
        setSelectedFolderId(newFolder.id);
    };

    const handleUpdateFolder = (id: string, newName: string) => {
        updateFoldersState(folders.map(f => f.id === id ? { ...f, name: newName } : f));
    };

    const handleDeleteFolder = (id: string) => {
        const newFolders = folders.filter(f => f.id !== id);
        updateFoldersState(newFolders);
        if (selectedFolderId === id) {
            setSelectedFolderId(null);
        }
    };

    const handleSelectFolder = (id: string | null) => {
        setSelectedFolderId(id);
    };

    // --- Job/Receipt Handlers ---

    const handleImagesUpload = (files: File[]) => {
        if (!selectedFolderId) return;

        const newJobs: ReceiptJob[] = files.map(file => ({
            id: generateId(),
            file: { name: file.name }, // Store only necessary file info
            imageUrl: URL.createObjectURL(file), // This URL is volatile (lost on refresh)
            status: 'pending',
            receiptData: null,
            generatedLabel: null,
            error: null,
        }));

        updateFoldersState(folders.map(folder => {
            if (folder.id === selectedFolderId) {
                return { ...folder, receipts: [...folder.receipts, ...newJobs] };
            }
            return folder;
        }));
    };

    const handleCameraCapture = (file: File) => {
        handleImagesUpload([file]);
    };

    const handleDeleteReceipt = (jobId: string) => {
        if (!selectedFolderId) return;

        updateFoldersState(folders.map(folder => {
            if (folder.id === selectedFolderId) {
                const updatedReceipts = folder.receipts.filter(r => r.id !== jobId);
                const receiptsWithDuplicatesChecked = recalculateDuplicates(updatedReceipts);
                return { ...folder, receipts: receiptsWithDuplicatesChecked };
            }
            return folder;
        }));
    };

    // Helper to update a job's status and data
    const updateJobInFolder = (folderId: string, jobId: string, updates: Partial<ReceiptJob>) => {
        setFolders(prev => prev.map(folder => {
            if (folder.id === folderId) {
                let updatedReceipts = folder.receipts.map(job => job.id === jobId ? { ...job, ...updates } : job);
                
                // If the update was a success, we should re-check for duplicates across the folder
                if (updates.status === 'success') {
                   updatedReceipts = recalculateDuplicates(updatedReceipts);
                }

                return {
                    ...folder,
                    receipts: updatedReceipts
                };
            }
            return folder;
        }));
    };

    const handleAnalyzeAllClick = async () => {
        if (!activeFolder) return;
        const folderId = activeFolder.id;
        const folderName = activeFolder.name;
        const jobsToProcess = activeFolder.receipts.filter(job => job.status === 'pending');

        for (const job of jobsToProcess) {
            // Update status to loading
            updateJobInFolder(folderId, job.id, { status: 'loading' });

            try {
                // Get base64 from the blob URL for API call
                const response = await fetch(job.imageUrl);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        // remove data:image/jpeg;base64, prefix
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                const mimeType = blob.type || 'image/jpeg';

                const data = await analyzeReceipt(base64, mimeType, apiKey);
                
                // Format generated label
                const formattedDate = data.transactionDate.replace(/-/g, '.');
                const totalString = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(data.total);
                
                const last4 = data.last4 || 'xxxx';
                const suffix = `(${folderName} ${last4})`;
                const label = `${formattedDate} - ${data.merchantName} - ${data.filenameCategory} - ${totalString} ${suffix}`;

                // Update with success
                updateJobInFolder(folderId, job.id, { status: 'success', receiptData: data, generatedLabel: label });

            } catch (err) {
                console.error(`Failed to analyze receipt ${job.file.name}:`, err);
                // Update with error
                updateJobInFolder(folderId, job.id, { status: 'error', error: 'Failed to analyze receipt. Please try again.' });
            }
        }
    };

    // Sorting Logic
    const sortedJobs = useMemo(() => {
        const pending = jobs.filter(j => j.status !== 'success');
        const completed = jobs.filter(j => j.status === 'success');

        completed.sort((a, b) => {
            const dataA = a.receiptData;
            const dataB = b.receiptData;

            if (!dataA || !dataB) return 0;

            switch (sortOption) {
                case 'date-desc':
                    return (new Date(dataB.transactionDate).getTime() || 0) - (new Date(dataA.transactionDate).getTime() || 0);
                case 'date-asc':
                    return (new Date(dataA.transactionDate).getTime() || 0) - (new Date(dataB.transactionDate).getTime() || 0);
                case 'category':
                    return (dataA.category || '').localeCompare(dataB.category || '');
                case 'total-desc':
                    return (dataB.total || 0) - (dataA.total || 0);
                default:
                    return 0;
            }
        });

        // Always show pending items at the top
        return [...pending, ...completed];
    }, [jobs, sortOption]);

    // Global Drag and Drop Handlers for the main content area
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedFolderId || activeTab !== 'manage') return;
        dragCounter.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setIsDragging(true);
        }
      };
    
      const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedFolderId || activeTab !== 'manage') return;
    
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
          setIsDragging(false);
        }
      };
    
      const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
      };
    
      const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
    
        if (!selectedFolderId || activeTab !== 'manage') return;
    
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
           const imageFiles = (Array.from(e.dataTransfer.files) as File[]).filter((file) => file.type.startsWith('image/'));
           if (imageFiles.length > 0) {
               handleImagesUpload(imageFiles);
           }
        }
      };

    const pendingJobCount = jobs.filter(job => job.status === 'pending').length;
    const inProgress = jobs.some(job => job.status === 'loading');

    // Small components for the toolbar icons
    const ToolbarUploadIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
        </svg>
      );
      
    const ToolbarCameraIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    if (isDataLoading) {
        return (
            <div className="flex-grow flex items-center justify-center p-8 bg-[#212529]">
                <LoadingSpinner />
                <p className="ml-4 text-xl text-gray-400">Loading finance data...</p>
            </div>
        );
    }

    return (
        <div 
            className="h-full flex flex-col bg-[#212529] overflow-hidden"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {/* Header Tabs */}
                <div className="max-w-4xl mx-auto w-full mb-6 border-b border-gray-700">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manage' ? 'border-[#A92128] text-[#A92128]' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}`}
                        >
                            Manage Receipts
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'reports' ? 'border-[#A92128] text-[#A92128]' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}`}
                        >
                            Reports Dashboard
                        </button>
                    </nav>
                </div>

                {/* Drag Overlay */}
                {isDragging && selectedFolderId && activeTab === 'manage' && (
                    <div className="fixed inset-0 z-50 bg-red-900/80 flex flex-col items-center justify-center border-8 border-white/20 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white mb-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h2 className="text-4xl font-bold text-white drop-shadow-md">Drop receipts to add to "{activeFolder?.name}"</h2>
                    </div>
                )}

                <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col gap-8">
                    
                    {activeTab === 'reports' ? (
                        <FinanceReports folders={folders} />
                    ) : (
                        <>
                            <FolderManager 
                                folders={folders}
                                selectedFolderId={selectedFolderId}
                                onAddFolder={handleAddFolder}
                                onUpdateFolder={handleUpdateFolder}
                                onDeleteFolder={handleDeleteFolder}
                                onSelectFolder={handleSelectFolder}
                                isLoading={inProgress}
                            />

                            {selectedFolderId && activeFolder ? (
                                <div className={`w-full flex-grow flex flex-col ${jobs.length === 0 ? 'justify-center' : ''}`}>
                                    {jobs.length === 0 ? (
                                        <ImageUpload onImagesUpload={handleImagesUpload} />
                                    ) : (
                                        <>
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 bg-[#343a40] p-4 rounded-lg gap-4 shadow-lg border border-gray-600">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                                        {activeFolder.name}
                                                        <span className="text-gray-400 text-lg font-normal">({jobs.length} items)</span>
                                                    </h2>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    {/* Sort Control */}
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <span className="text-gray-500 hidden sm:inline">Sort by:</span>
                                                        <select 
                                                            value={sortOption}
                                                            onChange={(e) => setSortOption(e.target.value)}
                                                            className="bg-gray-700 border-none text-white text-sm rounded focus:ring-[#A92128] p-1.5"
                                                        >
                                                            <option value="date-desc">Date (Newest)</option>
                                                            <option value="date-asc">Date (Oldest)</option>
                                                            <option value="category">Category</option>
                                                            <option value="total-desc">Total Amount</option>
                                                        </select>
                                                    </div>

                                                    {pendingJobCount > 0 && (
                                                        <button
                                                            onClick={handleAnalyzeAllClick}
                                                            disabled={inProgress}
                                                            className="bg-[#A92128] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-lg transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus