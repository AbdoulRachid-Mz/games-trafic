import { Participant, ParticipantStatus } from "./types";

export function selectParticipants(
  participants: Participant[],
  mode:
    | "ALL"
    | "ACTIVE"
    | "ELIMINATED"
    | "QUALIFIED"
    | "CUSTOM",
  customIds?: string[]
) {
  switch (mode) {
    case "ACTIVE":
      return participants.filter(p => p.status === "ACTIVE");
    case "ELIMINATED":
      return participants.filter(p => p.status === "ELIMINATED");
    case "QUALIFIED":
      return participants.filter(p => p.status === "QUALIFIED");
    case "CUSTOM":
      return participants.filter(p => customIds?.includes(p.id));
    default:
      return participants;
  }
}
