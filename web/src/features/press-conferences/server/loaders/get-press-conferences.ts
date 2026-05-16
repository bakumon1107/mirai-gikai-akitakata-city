import "server-only";
import type { PressConference } from "../../shared/types";
import { findPublishedPressConferences } from "../repositories/press-conference-repository";

export async function getPressConferences(): Promise<PressConference[]> {
  return findPublishedPressConferences();
}
