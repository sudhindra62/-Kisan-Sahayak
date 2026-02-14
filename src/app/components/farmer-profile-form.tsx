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
import { Loader2, Tractor, MapPin, Droplets, DollarSign, Sprout } from "lucide-react";
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
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
          <Tractor className="h-6 w-6" />
          Farmer Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="landSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Sprout className="h-4 w-4" />Land Size (in acres)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annualIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Annual Income</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />State</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Maharashtra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />District</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pune" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Sprout className="h-4 w-4" />Primary Crop Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Wheat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="irrigationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Droplets className="h-4 w-4" />Irrigation Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
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
