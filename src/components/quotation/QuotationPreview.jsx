
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { format, addDays } from "date-fns";
import { useCurrency } from "@/components/CurrencyProvider";

export default function QuotationPreview({ quotation, order, validityDays }) {
  const { formatCurrency } = useCurrency();
  
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-[#006564] to-[#00877C] text-white p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Package className="w-7 h-7 text-[#006564]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cathay Cargo</h2>
              <p className="text-white/90">Air & Ground Logistics</p>
            </div>
          </div>
          <Badge className="bg-white text-[#006564]">QUOTATION</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6 pb-6 border-b">
          <div>
            <p className="text-sm text-gray-500 mb-1">Order Number</p>
            <p className="font-semibold text-lg">{quotation.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Date</p>
            <p className="font-semibold">{format(new Date(), "MMMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Valid Until</p>
            <p className="font-semibold text-[#006564]">
              {format(addDays(new Date(), validityDays), "MMMM d, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge>{quotation.status}</Badge>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Shipment Details</h3>
          <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Origin</p>
              <p className="font-medium">{order.origin_airport}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">{order.destination_airport}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium">{order.weight_kg.toLocaleString()} KG</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cargo Type</p>
              <p className="font-medium">{order.cargo_type}</p>
            </div>
            {order.dimensions && (
              <div>
                <p className="text-sm text-gray-500">Dimensions</p>
                <p className="font-medium">{order.dimensions}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Price Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-700 font-medium">Trucking Cost</span>
              <span className="font-semibold">
                {formatCurrency(quotation.trucking_cost)}
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-700 font-medium">Airline Operating Cost</span>
              <span className="font-semibold">
                {formatCurrency(quotation.air_freight_cost)}
              </span>
            </div>

            <div className="flex justify-between py-3 bg-[#E8F5F4] rounded-lg px-4 mt-4">
              <span className="font-bold text-gray-900">Total Cost</span>
              <span className="font-bold text-[#006564]">
                {formatCurrency(quotation.total_internal_cost)}
              </span>
            </div>
            
            <div className="flex justify-between py-2 text-green-600">
              <span>Service Fee ({quotation.profit_margin_percent}%)</span>
              <span className="font-medium">+{formatCurrency(quotation.markup_amount)}</span>
            </div>
            
            <div className="flex justify-between py-4 bg-[#006564] text-white rounded-lg px-4 mt-4">
              <span className="text-lg font-bold">TOTAL QUOTE</span>
              <span className="text-2xl font-bold">
                {formatCurrency(quotation.final_quote_price)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-2">Terms & Conditions</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {quotation.terms || `Standard terms and conditions apply. This quotation is valid for ${validityDays} days from the date of issue. Prices are subject to change based on fuel surcharges and currency fluctuations.`}
          </p>
        </div>

        <div className="pt-4 border-t text-center text-sm text-gray-500">
          <p>Thank you for choosing Cathay Cargo</p>
          <p className="mt-1">For inquiries, please contact: cargo@cathaypacific.com</p>
        </div>
      </CardContent>
    </Card>
  );
}
