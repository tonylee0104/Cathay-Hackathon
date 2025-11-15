
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, FileText, ArrowRight, Trash2, Plane } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/components/CurrencyProvider";

export default function CostCalculator() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [costs, setCosts] = useState(null);
  const { formatCurrency } = useCurrency();
  
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list("-created_date"),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.TruckingVendor.list(),
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedVendor = vendors.find(v => v.id === selectedOrder?.trucking_vendor_id);

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrderId('');
      setCosts(null);
      toast.success("Order deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete order");
    }
  });

  const handleDeleteOrder = (e, order) => {
    e.stopPropagation();
    
    if (order.status === 'quoted' || order.status === 'completed') {
      toast.error("Cannot delete orders that have been quoted or completed");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(order.id);
    }
  };

  useEffect(() => {
    if (selectedOrder) {
      calculateCosts();
    }
  }, [selectedOrder, selectedVendor]);

  const calculateCosts = () => {
    if (!selectedOrder) return;

    let truckingCost = 0;
    
    if (selectedOrder.custom_trucking_rate && selectedOrder.custom_trucking_rate > 0) {
      if (selectedOrder.trucking_cost_model === 'per_100kg') {
        const units = selectedOrder.weight_kg / 100;
        truckingCost = selectedOrder.custom_trucking_rate * units;
      } else if (selectedOrder.trucking_cost_model === 'per_uld') {
        const uldCount = selectedOrder.uld_count || Math.ceil(selectedOrder.weight_kg / 1500);
        truckingCost = selectedOrder.custom_trucking_rate * uldCount;
      } else if (selectedOrder.trucking_cost_model === 'per_truck') {
        const truckCount = selectedOrder.truck_count || Math.ceil(selectedOrder.weight_kg / 10000);
        truckingCost = selectedOrder.custom_trucking_rate * truckCount;
      }
    } else if (selectedVendor) {
      if (selectedOrder.trucking_cost_model === 'per_100kg') {
        const units = selectedOrder.weight_kg / 100;
        truckingCost = selectedVendor.rate_per_100kg * units;
      } else if (selectedOrder.trucking_cost_model === 'per_uld') {
        const uldCount = selectedOrder.uld_count || Math.ceil(selectedOrder.weight_kg / 1500);
        truckingCost = selectedVendor.rate_per_uld * uldCount;
      } else if (selectedOrder.trucking_cost_model === 'per_truck') {
        const truckCount = selectedOrder.truck_count || Math.ceil(selectedOrder.weight_kg / 10000);
        truckingCost = selectedVendor.rate_per_truck * truckCount;
      }
    } else {
      truckingCost = 40 * (selectedOrder.weight_kg / 100);
    }

    const routeMultiplier = {
      'HKG-LAX': 4.5,
      'HKG-JFK': 5.2,
      'HKG-LHR': 4.8,
      'HKG-PVG': 2.1,
      'HKG-NRT': 3.2,
      'HKG-SIN': 2.8,
      'HKG-DXB': 4.0,
      'HKG-FRA': 4.7,
      'HKG-SYD': 4.3,
    };

    const route = `${selectedOrder.origin_airport}-${selectedOrder.destination_airport}`;
    const reverseRoute = `${selectedOrder.destination_airport}-${selectedOrder.origin_airport}`;
    const multiplier = routeMultiplier[route] || routeMultiplier[reverseRoute] || 3.5;
    
    const baseAirlineCostPerKg = multiplier;
    const airlineOperatingCost = selectedOrder.weight_kg * baseAirlineCostPerKg;
    
    const totalCost = truckingCost + airlineOperatingCost;

    setCosts({
      trucking: truckingCost,
      airlineOperating: airlineOperatingCost,
      total: totalCost
    });
  };

  const handleGenerateQuote = async () => {
    if (!costs || !selectedOrder) return;

    const quotation = {
      order_id: selectedOrder.id,
      order_number: selectedOrder.order_number,
      trucking_cost: costs.trucking,
      fuel_cost: 0,
      labor_cost: 0,
      operational_cost: 0,
      air_freight_cost: costs.airlineOperating,
      total_internal_cost: costs.total,
      profit_margin_percent: 15,
      markup_amount: costs.total * 0.15,
      final_quote_price: costs.total * 1.15,
      validity_days: 14,
      terms: "Standard terms and conditions apply. Quote valid for 14 days.",
      status: "draft"
    };

    await base44.entities.Quotation.create(quotation);
    await base44.entities.Order.update(selectedOrder.id, { status: 'calculated' });
    
    navigate(`${createPageUrl("QuotationGenerator")}?orderId=${selectedOrder.id}`);
  };

  const statusConfig = {
    draft: { 
      label: 'Draft', 
      borderColor: 'border-gray-300', 
      bgColor: 'bg-gray-50',
      badgeColor: 'bg-gray-100 text-gray-700',
      accentColor: 'bg-gray-200'
    },
    calculated: { 
      label: 'Calculated', 
      borderColor: 'border-blue-300', 
      bgColor: 'bg-blue-50',
      badgeColor: 'bg-blue-100 text-blue-700',
      accentColor: 'bg-blue-200'
    },
    quoted: { 
      label: 'Quoted', 
      borderColor: 'border-green-300', 
      bgColor: 'bg-green-50',
      badgeColor: 'bg-green-100 text-green-700',
      accentColor: 'bg-green-200'
    },
    completed: { 
      label: 'Completed', 
      borderColor: 'border-purple-300', 
      bgColor: 'bg-purple-50',
      badgeColor: 'bg-purple-100 text-purple-700',
      accentColor: 'bg-purple-200'
    }
  };

  const groupedOrders = {
    draft: orders.filter(o => o.status === 'draft'),
    calculated: orders.filter(o => o.status === 'calculated'),
    quoted: orders.filter(o => o.status === 'quoted'),
    completed: orders.filter(o => o.status === 'completed')
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-[#006564]" />
              Cost Calculator
            </h1>
            <p className="text-gray-600 mt-1">Calculate shipment costs for quotation</p>
          </div>
          {costs && (
            <Button 
              onClick={handleGenerateQuote}
              className="bg-[#006564] hover:bg-[#00877C]"
            >
              Generate Quote <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Select Order</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {Object.entries(groupedOrders).map(([status, statusOrders]) => {
              if (statusOrders.length === 0) return null;
              const config = statusConfig[status];
              
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${config.accentColor}`} />
                    <h3 className="font-semibold text-gray-900">{config.label}</h3>
                    <Badge variant="outline" className="ml-auto">{statusOrders.length}</Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {statusOrders.map((order) => {
                      const canDelete = order.status !== 'quoted' && order.status !== 'completed';
                      
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all relative group ${config.borderColor} ${config.bgColor} ${
                            selectedOrderId === order.id
                              ? 'ring-2 ring-[#006564] ring-offset-2'
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold truncate pr-2">{order.order_number}</p>
                            <Badge className={`text-xs shrink-0 ml-2 ${config.badgeColor}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {order.origin_airport || 'N/A'} → {order.destination_airport || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.weight_kg?.toLocaleString() || 0} KG • {order.cargo_type}
                          </p>
                          {order.distribution_centers?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {order.distribution_centers.length} DC(s)
                            </p>
                          )}
                          <div className="flex justify-end mt-2">
                            {canDelete ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => handleDeleteOrder(e, order)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            ) : (
                              <div className="h-6 w-6" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders yet. Create your first order!
              </div>
            )}
          </CardContent>
        </Card>

        {selectedOrder && costs && (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Cost</p>
                      <CardTitle className="text-3xl font-bold mt-2 text-[#006564] truncate">
                        {formatCurrency(costs.total)}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        For {selectedOrder.weight_kg.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#E8F5F4] shrink-0">
                      <TrendingUp className="w-5 h-5 text-[#006564]" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600">Trucking Cost</p>
                      <CardTitle className="text-3xl font-bold mt-2 truncate">
                        {formatCurrency(costs.trucking)}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600">Airline Operating Cost</p>
                      <CardTitle className="text-3xl font-bold mt-2 truncate">
                        {formatCurrency(costs.airlineOperating)}
                      </CardTitle>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 shrink-0">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-none shadow-md">
              <CardHeader className="border-b">
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Route</p>
                    <p className="text-gray-600 mt-1">{selectedOrder.origin_airport} → {selectedOrder.destination_airport}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Shipment Weight</p>
                    <p className="text-gray-600 mt-1">{selectedOrder.weight_kg.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cargo Type</p>
                    <p className="text-gray-600 mt-1">{selectedOrder.cargo_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cost Model</p>
                    <p className="text-gray-600 mt-1">{selectedOrder.trucking_cost_model?.replace(/_/g, ' ')}</p>
                  </div>
                  {selectedOrder.distribution_centers?.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">Distribution Centers</p>
                      <p className="text-gray-600 mt-1">{selectedOrder.distribution_centers.join(', ')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedOrder && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select an order to calculate costs</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
