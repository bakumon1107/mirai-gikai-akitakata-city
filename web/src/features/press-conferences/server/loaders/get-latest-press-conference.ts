import "server-only";
import type { PressConference } from "../../shared/types";
import { findLatestPublishedPressConference } from "../repositories/press-conference-repository";

export async function getLatestPressConference(): Promise<PressConference | null> {
  return findLatestPublishedPressConference();
}
