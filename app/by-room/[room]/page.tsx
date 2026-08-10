import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogSnapshot, rootNodes } from "../../live-catalog";
import { departmentsFor } from "../../guided-wizard";
import { ROOM_WIZARD_STEPS, WizardJourney } from "../../wizard-journey";
import { WizardOptionGrid } from "../../wizard-option-grid";

type RoomPageProps = { params: Promise<{ room: string }> };

async function findRoom(slug: string) {
  const catalog = await getCatalogSnapshot();
  const room = rootNodes(catalog.rooms).find((node) => node.slug === slug);
  return { catalog, room };
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { room: slug } = await params;
  const { room } = await findRoom(slug);
  if (!room) return {};
  const description = `Everything you need for your ${room.name.toLowerCase()} — chosen department by department, with live prices from Buildanta.`;
  return { title: `${room.name} materials`, description, openGraph: { title: `${room.name} | Buildanta`, description } };
}

export default async function RoomWizardEntry({ params }: RoomPageProps) {
  const { room: slug } = await params;
  const { catalog, room } = await findRoom(slug);
  if (!room) notFound();

  const departments = departmentsFor(room, catalog.categories, catalog.products);
  const totalProducts = departments.reduce((sum, option) => sum + option.productCount, 0);

  return <main className="listing-page wizard-landing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><a href="/by-room">Rooms</a><span>›</span><span className="breadcrumb-part">{room.name}</span>
    </nav>

    <div className="page-intro category-page-intro wizard-intro">
      <div>
        <p>STEP 1 OF YOUR {room.name.toUpperCase()}</p>
        <h1>What are you working on?</h1>
        <span>Pick a department and we will narrow it down with you, one choice at a time.</span>
        <small>{totalProducts} {totalProducts === 1 ? "product" : "products"} available for this room</small>
      </div>
      {room.imageUrl && <img src={room.imageUrl} alt={`${room.name} interior`} />}
    </div>

    <WizardJourney
      steps={ROOM_WIZARD_STEPS}
      currentStep={1}
      selections={[{ label: "Room", value: room.name, href: "/by-room" }]}
    />

    {departments.length > 0 ? (
      <WizardOptionGrid
        heading={`Shop ${room.name.toLowerCase()} by department`}
        subheading="Choose a department before comparing real products."
        options={departments.map((option) => ({
          id: option.node.id,
          name: option.node.name,
          href: `/categories/${option.node.slug}?room=${encodeURIComponent(room.slug)}`,
          description: option.node.description,
          imageUrl: option.node.imageUrl,
          productCount: option.productCount,
        }))}
      />
    ) : (
      <section className="empty-panel">
        <span aria-hidden="true">0</span>
        <h2>Nothing mapped to {room.name} yet</h2>
        <p>Departments are chosen in Buildanta Inventory. Once a department with stock is mapped to this room, it appears here.</p>
        <a className="button orange" href="/categories">Browse all categories</a>
      </section>
    )}
  </main>;
}
