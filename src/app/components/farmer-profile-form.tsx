"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { FarmerProfileInput } from "@/ai/schemas";
import { IndianRupee } from "lucide-react";

// Zod schema to match the logic from the AI flow.
const formSchema = z.object({
  landSize: z.coerce.number().positive({ message: "Land size must be a positive number." }),
  location: z.object({
    state: z.string().min(2, { message: "State is required." }),
    district: z.string().min(2, { message: "District is required." }),
  }),
  cropType: z.string().min(2, { message: "Crop type is required." }),
  irrigationType: z.enum(['Rainfed', 'Well', 'Canal', 'Other']),
  annualIncome: z.coerce.number().min(0, { message: "Annual income cannot be negative." }),
  farmerCategory: z.enum(['Small and Marginal', 'Medium', 'Large']),
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
      farmerCategory: 'Small and Marginal',
    },
  });

  return (
     <form onSubmit={form.handleSubmit(onSubmit)} style={{width: '100%'}}>
        <div className="grid">
            <div className="input-group">
                <label>Land Size (in acres)</label>
                <input type="number" placeholder="e.g., 5" {...form.register("landSize")} />
                {form.formState.errors.landSize && <p className="error-message">{form.formState.errors.landSize.message}</p>}
            </div>

            <div className="input-group">
                <label>Annual Income (in <IndianRupee className="inline h-4 w-4" />)</label>
                <input type="number" placeholder="e.g., 50000" {...form.register("annualIncome")} />
                {form.formState.errors.annualIncome && <p className="error-message">{form.formState.errors.annualIncome.message}</p>}
            </div>

            <div className="input-group">
                <label>State</label>
                <input type="text" placeholder="e.g., Maharashtra" {...form.register("location.state")} />
                {form.formState.errors.location?.state && <p className="error-message">{form.formState.errors.location.state.message}</p>}
            </div>

            <div className="input-group">
                <label>District</label>
                <input type="text" placeholder="e.g., Pune" {...form.register("location.district")} />
                {form.formState.errors.location?.district && <p className="error-message">{form.formState.errors.location.district.message}</p>}
            </div>

            <div className="input-group">
                <label>Primary Crop Type</label>
                <input type="text" placeholder="e.g., Wheat" {...form.register("cropType")} />
                {form.formState.errors.cropType && <p className="error-message">{form.formState.errors.cropType.message}</p>}
            </div>

            <div className="input-group">
                <label>Irrigation Type</label>
                <select {...form.register("irrigationType")}>
                    <option value="Rainfed">Rainfed</option>
                    <option value="Well">Well</option>
                    <option value="Canal">Canal</option>
                    <option value="Other">Other</option>
                </select>
                {form.formState.errors.irrigationType && <p className="error-message">{form.formState.errors.irrigationType.message}</p>}
            </div>

            <div className="input-group">
                <label>Farmer Category</label>
                <select {...form.register("farmerCategory")}>
                    <option value="Small and Marginal">Small and Marginal (&lt; 5 acres)</option>
                    <option value="Medium">Medium (5-10 acres)</option>
                    <option value="Large">Large (&gt; 10 acres)</option>
                </select>
                {form.formState.errors.farmerCategory && <p className="error-message">{form.formState.errors.farmerCategory.message}</p>}
            </div>
        </div>

        <button className="premium-btn" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Analyzing...
            </>
          ) : (
            "Find Schemes"
          )}
        </button>
    </form>
  );
}
