"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Free",
    description: "Perfect for testing and personal projects.",
    price: "$0",
    productId: "", // No price ID for free
    features: [
      "10,000 characters / month",
      "Standard voice quality",
      "Access to system voices",
      "Community support",
    ],
    limit: 10000,
  },
  {
    name: "Pro",
    description: "For creators who need more power and custom voices.",
    price: "$19",
    productId: "product_placeholder_pro", // User will need to replace this
    features: [
      "100,000 characters / month",
      "High-fidelity voice synthesis",
      "Unlimited custom voice cloning",
      "Priority support",
    ],
    limit: 100000,
    popular: true,
  },
  {
    name: "Business",
    description: "Enterprise-grade features for teams and scale.",
    price: "$99",
    productId: "product_placeholder_business", // User will need to replace this
    features: [
      "1,000,000 characters / month",
      "Ultra-low latency inference",
      "Dedicated account manager",
      "Custom model fine-tuning",
    ],
    limit: 1000000,
  },
];

export default function BillingPage() {
  const trpc = useTRPC();
  
  const { data: usage, isLoading: usageLoading } = useQuery(trpc.billing.getUsage.queryOptions());
  const { data: subscription, isLoading: subLoading } = useQuery(trpc.billing.getSubscription.queryOptions());

  const checkoutMutation = useMutation(trpc.billing.createCheckout.mutationOptions({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error("Failed to create checkout session: " + error.message);
    },
  }));

  const currentMonthChars = usage?.characterCount || 0;
  const currentPlan = PLANS.find(p => p.name.toLowerCase() === (subscription?.product?.name?.toLowerCase() || "free")) || PLANS[0];
  const usagePercentage = Math.min((currentMonthChars / currentPlan.limit) * 100, 100);

  const handleUpgrade = (productId: string) => {
    if (!productId) return;
    checkoutMutation.mutate({ productId: productId });
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <DashboardHeader 
        heading="Billing" 
        text="Manage your subscription and monitor usage." 
      />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage this month</CardTitle>
            <CardDescription>
              Your character consumption resets on the first of every month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{currentMonthChars.toLocaleString()} characters used</span>
                <span className="text-muted-foreground">{currentPlan.limit.toLocaleString()} limit</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              {usagePercentage >= 90 ? "You are almost at your limit. Consider upgrading for more characters." : "You have plenty of characters left for this month."}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>You are currently on the {currentPlan.name} plan.</CardDescription>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{currentPlan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <Badge variant={subscription ? "default" : "secondary"}>
                  {subscription?.status || "Free Tier"}
                </Badge>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {subscription && (
              <Button variant="outline" className="w-full" render={
                <a href="https://polar.sh/dashboard/subscriptions" target="_blank" rel="noreferrer">
                  Manage in Polar
                </a>
              } />
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-center mt-8">Choose your plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={`flex flex-col relative ${plan.popular ? 'border-primary shadow-md' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-3xl font-bold">{plan.price}</div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  disabled={currentPlan.name === plan.name || !plan.productId || checkoutMutation.isPending}
                  onClick={() => handleUpgrade(plan.productId)}
                >
                  {checkoutMutation.isPending && checkoutMutation.variables?.productId === plan.productId ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : plan.popular ? (
                    <Zap className="mr-2 h-4 w-4 fill-current" />
                  ) : null}
                  {currentPlan.name === plan.name ? "Current Plan" : plan.name === "Free" ? "Active" : "Upgrade"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
