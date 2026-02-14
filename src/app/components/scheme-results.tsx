"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ExternalLink, Info, Leaf } from "lucide-react";

type Results = {
  eligibleSchemes: {
    name: string;
    benefits: string;
    eligibilitySummary: string;
    applicationGuideLink?: string | undefined;
  }[];
} | null;

type SchemeResultsProps = {
  results: Results;
  isLoading: boolean;
};

const LoadingSkeleton = () => (
  <div className="space-y-4 w-full">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="bg-card/5 backdrop-blur-xl border shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-2 pt-6">
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-5/6 bg-white/10" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function SchemeResults({ results, isLoading }: SchemeResultsProps) {
  if (isLoading) {
    return (
      <section className="mt-8 md:mt-0 w-full max-w-4xl text-center">
        <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6 text-foreground">Checking Eligibility...</h2>
        <LoadingSkeleton />
      </section>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <section className="w-full max-w-4xl animate-in fade-in duration-500">
      {results.eligibleSchemes.length > 0 ? (
        <div className="space-y-6">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-300">
            Eligible Schemes Found
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {results.eligibleSchemes.map((scheme, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b-0">
                <Card className="bg-card/5 backdrop-blur-xl border shadow-xl hover:border-primary/50 transition-all duration-300">
                  <AccordionTrigger className="p-6 text-lg font-semibold font-headline hover:no-underline text-foreground">
                    <div className="flex items-center gap-3 text-left">
                       <Leaf className="h-6 w-6 text-primary flex-shrink-0" />
                       {scheme.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0">
                    <div className="space-y-4 text-left">
                      <div>
                        <h4 className="font-bold text-primary mb-2">Benefits</h4>
                        <p className="text-muted-foreground">{scheme.benefits}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-primary mb-2">Why you are eligible</h4>
                        <p className="text-muted-foreground">{scheme.eligibilitySummary}</p>
                      </div>
                      {scheme.applicationGuideLink && (
                        <div className="pt-2">
                           <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-colors duration-300">
                            <a href={scheme.applicationGuideLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Application Guide
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        <Card className="text-center p-8 w-full bg-card/5 backdrop-blur-xl border shadow-xl">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl font-bold mb-2 text-foreground">No Schemes Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
                Based on the profile provided, we couldn't find any matching government schemes at the moment.
            </p>
        </Card>
      )}
    </section>
  );
}
