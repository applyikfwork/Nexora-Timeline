import React from "react";
import { useListSavedPlaces, useDeleteSavedPlace } from "@workspace/api-client-react";
import { Bookmark, MapPin, Trash2, Loader2, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function SavedPlaces() {
  const { data: places, isLoading } = useListSavedPlaces();
  const deleteMutation = useDeleteSavedPlace();
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/places/saved"] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
          <Bookmark className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Saved Places</h1>
          <p className="text-white/60 text-sm">Your personal collection of monitored locations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
      ) : places && places.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place) => (
            <div key={place.id} className="bg-card border border-white/10 rounded-xl p-6 group hover:border-secondary/50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(place.id)}
                  disabled={deleteMutation.isPending}
                  className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{place.placeName}</h3>
                  <div className="text-sm text-white/50">{place.country}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Calendar className="w-4 h-4" />
                  Saved on {format(new Date(place.createdAt), 'MMM d, yyyy')}
                </div>
                
                {place.notes && (
                  <div className="p-3 bg-background rounded-lg border border-white/5 text-sm text-white/70 italic">
                    "{place.notes}"
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs font-mono text-white/30 pt-4 border-t border-white/5">
                  {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/30 rounded-2xl border border-white/5 border-dashed">
          <Bookmark className="w-16 h-16 text-white/10 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No places saved yet</h3>
          <p className="text-white/50 max-w-md">
            Explore the map or search for locations, then save them here to quickly access their insights later.
          </p>
        </div>
      )}
    </div>
  );
}
