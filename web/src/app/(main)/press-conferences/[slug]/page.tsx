import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { PressConferenceDetail } from "@/features/press-conferences/client/components/press-conference-detail";
import { getPressConferenceBySlug } from "@/features/press-conferences/server/loaders/get-press-conference-by-slug";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PressConferencePage({ params }: Props) {
  const { slug } = await params;

  const pressConference = await getPressConferenceBySlug(slug);
  if (!pressConference) {
    notFound();
  }

  return (
    <Container className="py-8">
      <PressConferenceDetail pressConference={pressConference} />
    </Container>
  );
}
