
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TruckIcon, Plus, Star, Search, Filter } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Vendors() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  
  const [formData, setFormData] = useState({
    vendor_name: "",
    region: "",
    rate_per_100kg: "",
    rate_per_uld: "",
    rate_per_truck: "",
    reliability_rating: 5,
    contact_email: "",
    is_active: true
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.TruckingVendor.list("-created_date"),
  });

  const createVendorMutation = useMutation({
    mutationFn: (data) => base44.entities.TruckingVendor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsDialogOpen(false);
      setFormData({
        vendor_name: "",
        region: "",
        rate_per_100kg: "",
        rate_per_uld: "",
        rate_per_truck: "",
        reliability_rating: 5,
        contact_email: "",
        is_active: true
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createVendorMutation.mutate({
      ...formData,
      rate_per_100kg: parseFloat(formData.rate_per_100kg),
      rate_per_uld: parseFloat(formData.rate_per_uld),
      rate_per_truck: parseFloat(formData.rate_per_truck),
      reliability_rating: parseInt(formData.reliability_rating)
    });
  };

  const uniqueRegions = useMemo(() => {
    return [...new Set(vendors.map(v => v.region).filter(Boolean))];
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const matchesSearch = searchQuery === "" || 
        vendor.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = filterRegion === "all" || vendor.region === filterRegion;
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" && vendor.is_active) ||
        (filterStatus === "inactive" && !vendor.is_active);
      const matchesRating = filterRating === "all" || vendor.reliability_rating === parseInt(filterRating);
      
      return matchesSearch && matchesRegion && matchesStatus && matchesRating;
    });
  }, [vendors, searchQuery, filterRegion, filterStatus, filterRating]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TruckIcon className="w-8 h-8 text-[#006564]" />
              Trucking Vendors
            </h1>
            <p className="text-gray-600 mt-1">Manage your trucking vendor partners and rates</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#006564] hover:bg-[#00877C]">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_name">Vendor Name *</Label>
                    <Input
                      id="vendor_name"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate_per_100kg">Rate per 100KG (USD) *</Label>
                    <Input
                      id="rate_per_100kg"
                      type="number"
                      step="0.01"
                      value={formData.rate_per_100kg}
                      onChange={(e) => setFormData({...formData, rate_per_100kg: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate_per_uld">Rate per ULD (USD) *</Label>
                    <Input
                      id="rate_per_uld"
                      type="number"
                      step="0.01"
                      value={formData.rate_per_uld}
                      onChange={(e) => setFormData({...formData, rate_per_uld: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate_per_truck">Rate per Truck (USD) *</Label>
                    <Input
                      id="rate_per_truck"
                      type="number"
                      step="0.01"
                      value={formData.rate_per_truck}
                      onChange={(e) => setFormData({...formData, rate_per_truck: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Reliability Rating (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.reliability_rating}
                      onChange={(e) => setFormData({...formData, reliability_rating: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#006564] hover:bg-[#00877C]">
                    Add Vendor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search vendors by name, region, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {uniqueRegions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredVendors.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-right">Per 100KG</TableHead>
                      <TableHead className="text-right">Per ULD</TableHead>
                      <TableHead className="text-right">Per Truck</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                        <TableCell>{vendor.region}</TableCell>
                        <TableCell>
                          {vendor.is_active ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {[...Array(vendor.reliability_rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(vendor.rate_per_100kg)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(vendor.rate_per_uld)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(vendor.rate_per_truck)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {vendor.contact_email || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {vendors.length === 0 ? "No vendors added yet" : "No vendors match your search"}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {vendors.length === 0 ? "Add your first trucking vendor to get started" : "Try adjusting your filters"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>Showing {filteredVendors.length.toLocaleString()} of {vendors.length.toLocaleString()} vendors</p>
        </div>
      </div>
    </div>
  );
}
