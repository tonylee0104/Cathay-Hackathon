import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Save, AlertCircle, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NewOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    order_number: `ORD-${Date.now()}`,
    origin_airport: "HKG",
    destination_airport: "",
    distribution_centers: [],
    weight_kg: "",
    dimensions: "",
    cargo_type: "General",
    trucking_vendor_id: "",
    trucking_cost_model: "per_100kg",
    custom_trucking_rate: "",
    uld_count: "",
    truck_count: "",
    status: "draft"
  });

  const [selectedDC, setSelectedDC] = useState("");

  const airportDistributionMap = {
    'HKG': ['Kowloon Distribution Center', 'New Territories Warehouse', 'Hong Kong Island Hub', 'Lantau Logistics Park'],
    'LAX': ['Downtown LA Hub', 'Long Beach Distribution', 'Santa Monica Warehouse', 'Inglewood Logistics Center'],
    'JFK': ['Brooklyn Logistics Center', 'Queens Distribution Hub', 'Manhattan Warehouse', 'Bronx Distribution Park'],
    'LHR': ['Heathrow Industrial Estate', 'East London Warehouse', 'West London Hub', 'Slough Distribution Center'],
    'PVG': ['Pudong Distribution Center', 'Shanghai Free Trade Zone', 'Hongqiao Logistics Hub', 'Baoshan Warehouse'],
    'NRT': ['Tokyo Bay Warehouse', 'Narita Logistics Hub', 'Chiba Distribution Center', 'Saitama Warehouse Park'],
    'SIN': ['Changi Business Park', 'Jurong Distribution Center', 'Woodlands Logistics Hub', 'Tuas Warehouse Complex'],
    'DXB': ['Dubai Logistics City', 'Jebel Ali Warehouse', 'Al Quoz Industrial Hub', 'Dubai South Distribution'],
    'FRA': ['Frankfurt Rhine-Main Hub', 'Industrial Park West', 'Offenbach Distribution', 'Darmstadt Logistics Center'],
    'SYD': ['Sydney Port Distribution', 'Western Sydney Logistics', 'Botany Bay Hub', 'Parramatta Warehouse']
  };

  const airports = Object.keys(airportDistributionMap);
  const availableDistributionCenters = airportDistributionMap[formData.destination_airport] || [];

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.TruckingVendor.filter({ is_active: true }),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`${createPageUrl("CostCalculator")}?orderId=${order.id}`);
    },
    onError: (err) => {
      setError("Failed to create order. Please check your inputs.");
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddDC = () => {
    if (selectedDC && !formData.distribution_centers.includes(selectedDC)) {
      setFormData(prev => ({
        ...prev,
        distribution_centers: [...prev.distribution_centers, selectedDC]
      }));
      setSelectedDC("");
    }
  };

  const handleRemoveDC = (dc) => {
    setFormData(prev => ({
      ...prev,
      distribution_centers: prev.distribution_centers.filter(d => d !== dc)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.destination_airport || !formData.weight_kg) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.distribution_centers.length === 0) {
      setError("Please add at least one distribution center");
      return;
    }

    if (parseFloat(formData.weight_kg) <= 0) {
      setError("Weight must be greater than 0");
      return;
    }

    const dataToSubmit = {
      ...formData,
      weight_kg: parseFloat(formData.weight_kg),
      custom_trucking_rate: formData.custom_trucking_rate ? parseFloat(formData.custom_trucking_rate) : 0,
      uld_count: formData.uld_count ? parseInt(formData.uld_count) : 0,
      truck_count: formData.truck_count ? parseInt(formData.truck_count) : 0,
    };

    createOrderMutation.mutate(dataToSubmit);
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-[#006564]" />
            New Order
          </h1>
          <p className="text-gray-600 mt-1">Create a new cargo order and calculate costs</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="order_number">Order Number *</Label>
                  <Input
                    id="order_number"
                    value={formData.order_number}
                    onChange={(e) => handleChange('order_number', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo_type">Cargo Type *</Label>
                  <Select value={formData.cargo_type} onValueChange={(v) => handleChange('cargo_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Perishable">Perishable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
                      <SelectItem value="Valuable">Valuable</SelectItem>
                      <SelectItem value="Live Animals">Live Animals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin_airport">Origin Airport *</Label>
                  <Select value={formData.origin_airport} onValueChange={(v) => handleChange('origin_airport', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map(airport => (
                        <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination_airport">Destination Airport *</Label>
                  <Select value={formData.destination_airport} onValueChange={(v) => {
                    handleChange('destination_airport', v);
                    setFormData(prev => ({ ...prev, distribution_centers: [] }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map(airport => (
                        <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (KG) *</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 500"
                    value={formData.weight_kg}
                    onChange={(e) => handleChange('weight_kg', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
                  <Input
                    id="dimensions"
                    placeholder="e.g., 120 x 80 x 100 cm (optional)"
                    value={formData.dimensions}
                    onChange={(e) => handleChange('dimensions', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Distribution Centers</h3>
                
                {formData.destination_airport ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={selectedDC} onValueChange={setSelectedDC}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select distribution center" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDistributionCenters.map(dc => (
                            <SelectItem key={dc} value={dc}>{dc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        onClick={handleAddDC}
                        disabled={!selectedDC}
                        className="bg-[#006564] hover:bg-[#00877C]"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {formData.distribution_centers.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Distribution Centers:</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.distribution_centers.map((dc, idx) => (
                            <Badge key={idx} className="bg-[#E8F5F4] text-[#006564] px-3 py-1">
                              {dc}
                              <button
                                type="button"
                                onClick={() => handleRemoveDC(dc)}
                                className="ml-2 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Please select a destination airport first to see available distribution centers
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Trucking Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="trucking_vendor">Trucking Vendor</Label>
                    <Select value={formData.trucking_vendor_id} onValueChange={(v) => handleChange('trucking_vendor_id', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name} - {vendor.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trucking_cost_model">Cost Model</Label>
                    <Select value={formData.trucking_cost_model} onValueChange={(v) => handleChange('trucking_cost_model', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_100kg">Per 100 KG</SelectItem>
                        <SelectItem value="per_uld">Per ULD</SelectItem>
                        <SelectItem value="per_truck">Per Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.trucking_cost_model === 'per_uld' && (
                    <div className="space-y-2">
                      <Label htmlFor="uld_count">ULD Count</Label>
                      <Input
                        id="uld_count"
                        type="number"
                        placeholder="Number of ULDs"
                        value={formData.uld_count}
                        onChange={(e) => handleChange('uld_count', e.target.value)}
                      />
                    </div>
                  )}

                  {formData.trucking_cost_model === 'per_truck' && (
                    <div className="space-y-2">
                      <Label htmlFor="truck_count">Truck Count</Label>
                      <Input
                        id="truck_count"
                        type="number"
                        placeholder="Number of trucks"
                        value={formData.truck_count}
                        onChange={(e) => handleChange('truck_count', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="custom_rate">Custom Rate (Optional)</Label>
                    <Input
                      id="custom_rate"
                      type="number"
                      step="0.01"
                      placeholder="Override vendor rate"
                      value={formData.custom_trucking_rate}
                      onChange={(e) => handleChange('custom_trucking_rate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#006564] hover:bg-[#00877C]"
                  disabled={createOrderMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createOrderMutation.isPending ? 'Creating...' : 'Create & Calculate'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}