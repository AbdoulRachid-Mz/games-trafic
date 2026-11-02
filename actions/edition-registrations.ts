'use server';

/**
 * Edition Registrations Actions
 * Centralizes participant/team registrations to tournament editions.
 * Re-exports core operations from actions/editions for backward compatibility
 * and single source of truth.
 */

export {
  joinEdition,
  deleteEditionRegistrationAction,
  addEditionParticipantAction,
  checkParticipantDependencies,
} from '@/actions/editions';