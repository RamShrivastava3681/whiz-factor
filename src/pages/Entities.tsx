import { Users, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { suppliers, buyers } from '@/data/mockData';

export default function Entities() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers & Buyers</h1>
          <p className="text-sm text-muted-foreground">Manage your trade partners</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Entity
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search entities..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suppliers Summary */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Suppliers ({suppliers.length})</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            {suppliers.slice(0, 5).map((supplier) => (
              <div key={supplier.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">{supplier.category} • {supplier.country}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  supplier.status === 'active' ? 'bg-success/10 text-success' :
                  supplier.status === 'pending' ? 'bg-warning/10 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {supplier.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buyers Summary */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Buyers ({buyers.length})</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            {buyers.slice(0, 5).map((buyer) => (
              <div key={buyer.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{buyer.name}</p>
                  <p className="text-xs text-muted-foreground">{buyer.category} • {buyer.country}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  buyer.riskRating === 'low' ? 'bg-success/10 text-success' :
                  buyer.riskRating === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {buyer.riskRating} risk
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
