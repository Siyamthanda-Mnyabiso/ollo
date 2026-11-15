import { Suspense } from "react";
import { Card } from "@/components/dashboard/shell";
import { ItemForm } from "@/components/dashboard/item-form";
import { listItems, requireSeller } from "@/lib/dashboard/queries";
import { formatRand } from "@/lib/money";
import { setItemActive } from "./actions";

export const metadata = { title: "Items" };

async function ItemsContent() {
  const { seller } = await requireSeller();
  const rows = await listItems(seller.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-primary text-3xl font-bold tracking-tight">Items</h1>
        <p className="text-muted-foreground mt-1">
          Items are optional. Add the things you sell so you can reuse their prices.
        </p>
      </div>
      <Card>
        <ItemForm />
      </Card>
      <Card>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No items yet.</p>
        ) : (
          <ul className="divide-border divide-y">
            {rows.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p
                    className={
                      item.active
                        ? "font-semibold"
                        : "text-muted-foreground font-semibold line-through"
                    }
                  >
                    {item.name}
                  </p>
                  <p className="text-muted-foreground text-sm">{formatRand(item.priceCents)}</p>
                </div>
                <form action={setItemActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="active" value={String(!item.active)} />
                  <button
                    type="submit"
                    className="text-primary hover:bg-accent rounded-lg px-3 py-2 text-base font-bold"
                  >
                    {item.active ? "Hide" : "Show"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={null}>
      <ItemsContent />
    </Suspense>
  );
}
