import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FileText, Download, Send, Lock, Unlock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import QuotationPreview from "../components/quotation/QuotationPreview";
import { toast } from "sonner";
import { useCurrency } from "@/components/CurrencyProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuotationGenerator() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const { formatCurrency, currency } = useCurrency();
  const printRef = useRef();
  
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [margin, setMargin] = useState(15);
  const [validityDays, setValidityDays] = useState(14);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => base44.entities.Quotation.list("-created_date"),
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list("-created_date"),
    refetchInterval: 5000,
  });

  // Filter and deduplicate quotations - only show the most recent per order
  const validQuotations = React.useMemo(() => {
    const quotationsWithOrders = quotations.filter(q => 
      orders.some(o => o.id === q.order_id)
    );
    
    // Group by order_id and keep only the most recent
    const quotationsByOrder = {};
    quotationsWithOrders.forEach(q => {
      if (!quotationsByOrder[q.order_id] || 
          new Date(q.created_date) > new Date(quotationsByOrder[q.order_id].created_date)) {
        quotationsByOrder[q.order_id] = q;
      }
    });
    
    return Object.values(quotationsByOrder);
  }, [quotations, orders]);

  useEffect(() => {
    if (orderId && validQuotations.length > 0) {
      const quote = validQuotations.find(q => q.order_id === orderId);
      if (quote) setSelectedQuotationId(quote.id);
    }
  }, [orderId, validQuotations]);

  const selectedQuotation = validQuotations.find(q => q.id === selectedQuotationId);
  const relatedOrder = orders.find(o => o.id === selectedQuotation?.order_id);

  useEffect(() => {
    if (selectedQuotation) {
      setMargin(selectedQuotation.profit_margin_percent);
      setValidityDays(selectedQuotation.validity_days);
      setIsLocked(selectedQuotation.status === 'sent' || selectedQuotation.status === 'accepted');
    }
  }, [selectedQuotation]);

  const updateQuotationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quotation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("Quotation updated successfully");
    },
  });

  const handleMarginChange = (value) => {
    if (isLocked) return;
    
    setMargin(value[0]);
    if (selectedQuotation) {
      const newMarkup = selectedQuotation.total_internal_cost * (value[0] / 100);
      const newFinalPrice = selectedQuotation.total_internal_cost + newMarkup;
      
      updateQuotationMutation.mutate({
        id: selectedQuotation.id,
        data: {
          profit_margin_percent: value[0],
          markup_amount: newMarkup,
          final_quote_price: newFinalPrice,
          validity_days: validityDays
        }
      });
    }
  };

  const handleValidityChange = (days) => {
    if (isLocked) return;
    
    setValidityDays(days);
    if (selectedQuotation) {
      updateQuotationMutation.mutate({
        id: selectedQuotation.id,
        data: { validity_days: days }
      });
    }
  };

  const handleUnlockConfirm = () => {
    setIsLocked(false);
    setShowUnlockDialog(false);
    toast.success("Quotation unlocked for editing");
  };

  const handleExportPDF = () => {
    if (!selectedQuotation || !relatedOrder) return;
    
    setIsGeneratingPDF(true);
    
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #quotation-print-area,
        #quotation-print-area * {
          visibility: visible;
        }
        #quotation-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          margin: 0.5in;
        }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
      setIsGeneratingPDF(false);
    }, 250);
  };

  const handleSendQuotation = async () => {
    if (selectedQuotation) {
      await updateQuotationMutation.mutateAsync({
        id: selectedQuotation.id,
        data: { status: 'sent' }
      });
      await base44.entities.Order.update(relatedOrder.id, { status: 'quoted' });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsLocked(true);
      toast.success("Quotation marked as sent and locked");
    }
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#006564]" />
              Quotation Generator
            </h1>
            <p className="text-gray-600 mt-1">Generate customer-facing quotations with profit margins</p>
          </div>
          {selectedQuotation && (
            <div className="flex gap-3">
              {isLocked && (
                <Button 
                  onClick={() => setShowUnlockDialog(true)}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Edit Sent Quotation
                </Button>
              )}
              <Button 
                onClick={handleExportPDF}
                variant="outline"
                disabled={isGeneratingPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Preparing...' : 'Export PDF'}
              </Button>
              <Button 
                onClick={handleSendQuotation}
                className="bg-[#006564] hover:bg-[#00877C]"
                disabled={selectedQuotation.status === 'sent' || selectedQuotation.status === 'accepted'}
              >
                <Send className="w-4 h-4 mr-2" />
                {selectedQuotation.status === 'sent' ? 'Already Sent' : 'Mark as Sent'}
              </Button>
            </div>
          )}
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Select Quotation</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {validQuotations.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => {
                    setSelectedQuotationId(quote.id);
                    setMargin(quote.profit_margin_percent);
                    setValidityDays(quote.validity_days);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedQuotationId === quote.id
                      ? 'border-[#006564] bg-[#E8F5F4]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{quote.order_number}</p>
                    {(quote.status === 'sent' || quote.status === 'accepted') && (
                      <Lock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-[#006564]">
                    {formatCurrency(quote.final_quote_price)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Margin: {quote.profit_margin_percent}%
                  </p>
                </button>
              ))}
            </div>
            {validQuotations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No quotations available. Calculate costs first!
              </div>
            )}
          </CardContent>
        </Card>

        {selectedQuotation && relatedOrder && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className={`border-none shadow-lg ${isLocked ? 'opacity-75' : ''}`}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Configure Margin</CardTitle>
                  {isLocked && (
                    <div className="flex items-center gap-1 text-orange-600 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profit Margin: {margin}%</Label>
                    <Slider
                      value={[margin]}
                      onValueChange={handleMarginChange}
                      min={5}
                      max={50}
                      step={1}
                      className="mt-2"
                      disabled={isLocked}
                    />
                    <p className="text-xs text-gray-500">
                      Suggested: 10-20% for standard, 25-35% for express
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validity">Validity (Days)</Label>
                    <Input
                      id="validity"
                      type="number"
                      value={validityDays}
                      onChange={(e) => handleValidityChange(parseInt(e.target.value) || 14)}
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Internal Cost:</span>
                    <span className="font-medium">{formatCurrency(selectedQuotation.total_internal_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Markup ({margin}%):</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(selectedQuotation.markup_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Final Quote:</span>
                    <span className="text-[#006564]">{formatCurrency(selectedQuotation.final_quote_price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2" id="quotation-print-area">
              <QuotationPreview 
                quotation={selectedQuotation} 
                order={relatedOrder} 
                validityDays={validityDays}
              />
            </div>
          </div>
        )}

        {!selectedQuotation && validQuotations.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a quotation to configure</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Edit Sent Quotation
            </AlertDialogTitle>
            <AlertDialogDescription>
              This quotation has already been sent to the customer. Editing it may cause confusion or discrepancies.
              <br /><br />
              Are you sure you want to unlock and edit this quotation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnlockConfirm}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Yes, Unlock for Editing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}