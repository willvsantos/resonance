"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceCard } from "@/components/voice-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VoicesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [localeFilter, setLocaleFilter] = useState("all");

  const trpc = useTRPC();
  const { data: systemVoices, isLoading: loadingSystem } = useQuery(trpc.voice.listSystem.queryOptions());
  const { data: customVoices, isLoading: loadingCustom } = useQuery(trpc.voice.listCustom.queryOptions());

  const categories = useMemo(() => {
    const all = [...(systemVoices || []), ...(customVoices || [])].map(v => v.category).filter(Boolean);
    return Array.from(new Set(all));
  }, [systemVoices, customVoices]);

  const locales = useMemo(() => {
    const all = [...(systemVoices || []), ...(customVoices || [])].map(v => v.locale).filter(Boolean);
    return Array.from(new Set(all));
  }, [systemVoices, customVoices]);

  const filteredSystem = systemVoices?.filter((v: any) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    const matchesLocale = localeFilter === "all" || v.locale === localeFilter;
    return matchesSearch && matchesCategory && matchesLocale;
  });

  const filteredCustom = customVoices?.filter((v: any) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    const matchesLocale = localeFilter === "all" || v.locale === localeFilter;
    return matchesSearch && matchesCategory && matchesLocale;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Library</h1>
          <p className="text-muted-foreground">
            Browse our curated system voices or manage your custom clones.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search voices..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={localeFilter} onValueChange={(v) => setLocaleFilter(v || "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Locale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locales</SelectItem>
              {locales.map(loc => (
                <SelectItem key={loc} value={loc!}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="system">System Voices</TabsTrigger>
          <TabsTrigger value="custom">My Voices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="mt-6">
          {loadingSystem ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
              ))}
            </div>
          ) : filteredSystem?.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">No system voices found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSystem?.map((voice: any) => (
                <VoiceCard key={voice.id} voice={voice} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          {loadingCustom ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
              ))}
            </div>
          ) : filteredCustom?.length === 0 ? (
            <div className="flex flex-col gap-2 h-[200px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">You haven't cloned any voices yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCustom?.map((voice: any) => (
                <VoiceCard key={voice.id} voice={voice} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
