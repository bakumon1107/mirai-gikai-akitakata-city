import { Container } from "@/components/layouts/container";
import { PressConferenceList } from "@/features/press-conferences/client/components/press-conference-list";
import { getPressConferences } from "@/features/press-conferences/server/loaders/get-press-conferences";

export default async function PressConferencesPage() {
  const pressConferences = await getPressConferences();

  return (
    <Container className="py-8">
      <PressConferenceList pressConferences={pressConferences} />
    </Container>
  );
}
