"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tractor, MapPin, Droplets, IndianRupee, Sprout } from "lucide-react";
import type { FarmerProfileInput } from "@/ai/flows/farmer-scheme-eligibility-analyzer";

const formSchema = z.object({
  landSize: z.coerce.number().positive({ message: "Land size must be a positive number." }),
  location: z.object({
    state: z.string().min(2, { message: "State is required." }),
    district: z.string().min(2, { message: "District is required." }),
  }),
  cropType: z.string().min(2, { message: "Crop type is required." }),
  irrigationType: z.enum(['Rainfed', 'Well', 'Canal', 'Other']),
  annualIncome: z.coerce.number().min(0, { message: "Annual income cannot be negative." }),
});

type FarmerProfileFormProps = {
  onSubmit: (data: FarmerProfileInput) => void;
  isLoading: boolean;
};

export default function FarmerProfileForm({ onSubmit, isLoading }: FarmerProfileFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landSize: undefined,
      location: {
        state: "",
        district: "",
      },
      cropType: "",
      irrigationType: 'Rainfed',
      annualIncome: undefined,
    },
  });

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/5 backdrop-blur-xl border shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-foreground flex items-center gap-3">
          <Tractor className="h-6 w-6" />
          Farmer Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <FormField
                control={form.control}
                name="landSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land Size (in acres)</FormLabel>
                    <div className="relative flex items-center">
                        <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annualIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income</FormLabel>
                     <div className="relative flex items-center">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                     <div className="relative flex items-center">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="e.g., Maharashtra" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                     <div className="relative flex items-center">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                         <Input placeholder="e.g., Pune" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Crop Type</FormLabel>
                    <div className="relative flex items-center">
                        <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                         <Input placeholder="e.g., Wheat" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="irrigationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Irrigation Type</FormLabel>
                    <div className="relative flex items-center">
                        <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select an irrigation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Rainfed">Rainfed</SelectItem>
                            <SelectItem value="Well">Well</SelectItem>
                            <SelectItem value="Canal">Canal</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transition-colors duration-300">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  "Find Schemes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
