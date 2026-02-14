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
import { CheckCircle2, ExternalLink, Info } from "lucide-react";

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
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function SchemeResults({ results, isLoading }: SchemeResultsProps) {
  if (isLoading) {
    return (
      <section className="mt-8 md:mt-12 w-full">
        <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6 text-center">Checking Eligibility...</h2>
        <LoadingSkeleton />
      </section>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <section className="mt-8 md:mt-12 w-full animate-in fade-in duration-500">
      {results.eligibleSchemes.length > 0 ? (
        <>
          <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6 text-center text-primary">
            🎉 Eligible Schemes Found!
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {results.eligibleSchemes.map((scheme, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b-0 mb-4">
                <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
                  <AccordionTrigger className="p-6 text-lg font-semibold font-headline hover:no-underline [&[data-state=open]>svg]:text-accent">
                    <div className="flex items-center gap-3 text-left">
                       <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                       {scheme.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-primary mb-1">Benefits:</h4>
                        <p className="text-muted-foreground">{scheme.benefits}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-primary mb-1">Why you are eligible:</h4>
                        <p className="text-muted-foreground">{scheme.eligibilitySummary}</p>
                      </div>
                      {scheme.applicationGuideLink && (
                        <div className="pt-2">
                           <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                            <a href={scheme.applicationGuideLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
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
        </>
      ) : (
        <Card className="text-center p-8 mt-12 bg-secondary border-dashed">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl font-bold mb-2">No Schemes Found</h2>
            <p className="text-muted-foreground">
                Based on the profile provided, we couldn't find any matching government schemes at the moment.
            </p>
        </Card>
      )}
    </section>
  );
}
