import "server-only";
import type { PressConference } from "../../shared/types";
import { findPublishedPressConferenceBySlug } from "../repositories/press-conference-repository";

export async function getPressConferenceBySlug(
  slug: string
): Promise<PressConference | null> {
  return findPublishedPressConferenceBySlug(slug);
}
