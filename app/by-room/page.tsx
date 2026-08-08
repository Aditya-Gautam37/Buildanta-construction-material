import { redirect } from "next/navigation";
import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { departmentsFor } from "../guided-wizard";
import { WizardOptionGrid } from "../wizard-option-grid";

const roomImages: Record<string, string> = {
  "Living room": "/livingroom.jpg",
  Bedroom: "/bedroom.jpg",
  Kitchen: "/kitchen.jpg",
  Bathroom: "/bathroom.jpg",
  "Study / Home Office": "/images/buildanta-v2/room-study-v2.webp",
  "Balcony & Terrace": "/images/buildanta-v2/room-balcony-v2.webp",
};

export default async function ByRoom({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const rooms = rootNodes(catalog.rooms);

  // The old shape was /by-room?room=Living%20room. Anything still pointing here
  // — a bookmark, an old link, a search result — lands on the journey instead.
  if (params.room) {
    const target = rooms.find((room) => room.name === params.room || room.slug === params.room);
    if (target) redirect(`/by-room/${target.slug}`);
  }

  const options = rooms
    .map((room) => ({ room, departments: departmentsFor(room, catalog.categories, catalog.products) }))
    .filter((entry) => entry.departments.length > 0);

  return <main className="listing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><span className="breadcrumb-part">Rooms</span>
    </nav>

    <div className="page-intro category-page-intro">
      <div>
        <p>SHOP BY ROOM</p>
        <h1>Which room are you working on?</h1>
        <span>Pick a room and we will narrow it down with you, one choice at a time.</span>
        <small>{options.length} {options.length === 1 ? "room" : "rooms"} ready to shop</small>
      </div>
    </div>

    {options.length > 0 ? (
      <WizardOptionGrid
        heading="Choose a room"
        subheading="Every path uses the same live Buildanta catalogue."
        options={options.map(({ room, departments }) => ({
          id: room.id,
          name: room.name,
          href: `/by-room/${room.slug}`,
          description: `${departments.length} ${departments.length === 1 ? "department" : "departments"} to browse`,
          imageUrl: room.imageUrl || roomImages[room.name] || null,
          productCount: departments.reduce((sum, option) => sum + option.productCount, 0),
        }))}
      />
    ) : (
      <section className="empty-panel">
        <span aria-hidden="true">0</span>
        <h2>No rooms are mapped yet</h2>
        <p>Map departments to a room in Buildanta Inventory and it will appear here.</p>
        <a className="button orange" href="/categories">Browse all categories</a>
      </section>
    )}
  </main>;
}
